'use strict';

/**
 * CKB Node Monitor — Alexa Skill
 * Lambda handler (Node.js 18.x)
 *
 * Displays CKB node stats on Echo Show via APL.
 * Falls back to public RPC when no personal node is configured.
 */

const Alexa = require('ask-sdk-core');
const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
const https = require('https');
const http = require('http');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_RPC_URL = 'https://mainnet.ckb.dev/rpc';
const RPC_PORT = 8114;
const RPC_TIMEOUT_MS = 8000;
const DYNAMO_TABLE = process.env.DYNAMODB_TABLE || 'ckb-node-monitor-attributes';
const APL_TEMPLATE_TOKEN = 'ckbDashboardToken';

// APL document — embedded to avoid S3 dependency and reduce cold start
const APL_DOCUMENT_PATH = './apl/dashboard.json';

// ─────────────────────────────────────────────────────────────────────────────
// DynamoDB persistence adapter
// ─────────────────────────────────────────────────────────────────────────────

const persistenceAdapter = new DynamoDbPersistenceAdapter({
  tableName: DYNAMO_TABLE,
  createTable: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// CKB RPC helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make a CKB JSON-RPC call.
 * Supports both http:// (personal node) and https:// (public fallback).
 */
function ckbRpc(baseUrl, method, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method,
      params,
    });

    let url;
    try {
      url = new URL(baseUrl);
    } catch (e) {
      return reject(new Error(`Invalid RPC URL: ${baseUrl}`));
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname || '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: RPC_TIMEOUT_MS,
    };

    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`RPC error ${json.error.code}: ${json.error.message}`));
          } else {
            resolve(json.result);
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('RPC request timed out'));
    });

    req.on('error', (e) => reject(e));

    req.write(body);
    req.end();
  });
}

/**
 * Fetch all required CKB stats in parallel.
 * Returns a normalised stats object.
 */
async function fetchCkbStats(nodeIp) {
  const baseUrl = nodeIp
    ? `http://${nodeIp}:${RPC_PORT}`
    : PUBLIC_RPC_URL;

  const [blockchainInfo, peers, localNodeInfo] = await Promise.allSettled([
    ckbRpc(baseUrl, 'get_blockchain_info', []),
    ckbRpc(baseUrl, 'get_peers', []),
    ckbRpc(baseUrl, 'local_node_info', []),
  ]);

  // get_blockchain_info is mandatory — if it fails, throw
  if (blockchainInfo.status === 'rejected') {
    throw new Error(`Cannot reach node: ${blockchainInfo.reason.message}`);
  }

  const info = blockchainInfo.value;
  const peerList = peers.status === 'fulfilled' ? peers.value : [];
  const localInfo = localNodeInfo.status === 'fulfilled' ? localNodeInfo.value : null;

  // CKB returns hex block numbers — convert to decimal
  const blockHeightHex = info.tip_block_number || info.tipBlockNumber || '0x0';
  const blockHeight = parseInt(blockHeightHex, 16);

  // Epoch is returned as a compound hex value; display as-is or decode
  const epochHex = info.epoch || '0x0';
  const epochNum = decodeEpoch(epochHex);

  const tipHash = info.tip_block_hash || info.tipBlockHash || '0x000…';
  const shortHash = tipHash.slice(0, 10) + '…' + tipHash.slice(-6);

  const isIBD = info.is_initial_block_download ?? info.isInitialBlockDownload ?? false;
  const chain = info.chain || 'ckb';
  const warnings = info.warnings || '';

  const peerCount = Array.isArray(peerList) ? peerList.length : 0;

  let nodeVersion = 'unknown';
  let nodeId = '—';
  if (localInfo) {
    nodeVersion = localInfo.version || 'unknown';
    nodeId = (localInfo.node_id || localInfo.nodeId || '—').slice(0, 12) + '…';
  }

  // Determine health status
  let statusLabel, statusColor, syncStatus;
  if (isIBD) {
    statusLabel = '⟳ SYNCING';
    statusColor = '#D97706'; // amber
    syncStatus = 'Initial block download in progress';
  } else if (peerCount === 0) {
    statusLabel = '✕ OFFLINE';
    statusColor = '#E74C3C'; // red
    syncStatus = 'No peers connected';
  } else {
    statusLabel = '✓ HEALTHY';
    statusColor = '#3CC68A'; // CKB green
    syncStatus = 'Fully synced';
  }

  return {
    blockHeight: blockHeight.toLocaleString(),
    tipBlockHash: shortHash,
    peerCount: String(peerCount),
    epoch: epochNum,
    chain: chain.toUpperCase(),
    nodeVersion: nodeVersion.split('(')[0].trim(), // strip build hash for display
    nodeId,
    statusLabel,
    statusColor,
    syncStatus,
    isSyncing: isIBD,
    hasWarnings: warnings.length > 0,
    warnings,
    lastUpdated: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) + ' UTC',
  };
}

/**
 * Decode CKB epoch compound number.
 * CKB epoch = 0x{length}{index}{number} packed in 64-bit hex.
 * Returns a human-readable string like "3721" or "3721/1800".
 */
function decodeEpoch(epochHex) {
  try {
    const raw = BigInt(epochHex);
    const number = Number(raw & BigInt('0xFFFFFF'));
    const index = Number((raw >> BigInt(24)) & BigInt('0xFFFF'));
    const length = Number((raw >> BigInt(40)) & BigInt('0xFFFF'));
    if (length > 0) {
      return `${number} (${index}/${length})`;
    }
    return String(number);
  } catch {
    return epochHex;
  }
}

/**
 * Load the APL document from disk (cached after first load).
 */
let _aplDocument = null;
function getAplDocument() {
  if (!_aplDocument) {
    try {
      _aplDocument = require('./apl/dashboard.json');
    } catch {
      // If file missing, return null — we'll skip APL
      _aplDocument = null;
    }
  }
  return _aplDocument;
}

/**
 * Check if the current device supports APL.
 */
function supportsApl(handlerInput) {
  const supportedInterfaces =
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
  return supportedInterfaces && supportedInterfaces['Alexa.Presentation.APL'];
}

/**
 * Build an Alexa RenderDocument directive for APL.
 */
function buildAplDirective(datasource) {
  const document = getAplDocument();
  if (!document) return null;

  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    token: APL_TEMPLATE_TOKEN,
    document,
    datasources: {
      payload: datasource,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LaunchRequest — fetch stats and show dashboard
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    return handleGetStats(handlerInput);
  },
};

/**
 * GetStatsIntent — voice query for stats
 */
const GetStatsIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetStatsIntent'
    );
  },
  async handle(handlerInput) {
    return handleGetStats(handlerInput);
  },
};

/**
 * Core stats fetch + response builder (shared by Launch and GetStats).
 */
async function handleGetStats(handlerInput) {
  const { attributesManager, responseBuilder } = handlerInput;
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

  // Load persistent attributes (node IP)
  let persistentAttrs = {};
  try {
    persistentAttrs = await attributesManager.getPersistentAttributes() || {};
  } catch (e) {
    console.warn('Could not load persistent attributes:', e.message);
  }

  const nodeIp = persistentAttrs.nodeIp || null;
  const isPublicFallback = !nodeIp;

  let stats;
  let errorMessage = null;

  try {
    stats = await fetchCkbStats(nodeIp);
  } catch (e) {
    console.error('Failed to fetch stats:', e.message);
    errorMessage = e.message;
  }

  if (errorMessage) {
    const speakOutput = isPublicFallback
      ? `Sorry, I couldn't reach the public CKB node. Please try again later.`
      : `Sorry, I couldn't reach your CKB node at ${nodeIp}. Please check it's running and try again.`;

    return responseBuilder
      .speak(speakOutput)
      .withShouldEndSession(false)
      .getResponse();
  }

  // Build voice response
  const speakOutput = buildSpeechOutput(stats, isPublicFallback, nodeIp);

  // Build APL datasource
  const aplData = {
    ...stats,
    showFallbackBanner: isPublicFallback,
    nodeSource: isPublicFallback
      ? '🌐 Public node: mainnet.ckb.dev'
      : `🖥 Your node: ${nodeIp}`,
  };

  const response = responseBuilder
    .speak(speakOutput)
    .withShouldEndSession(false);

  if (supportsApl(handlerInput)) {
    const directive = buildAplDirective(aplData);
    if (directive) response.addDirective(directive);
  }

  return response.getResponse();
}

function buildSpeechOutput(stats, isPublicFallback, nodeIp) {
  const parts = [];

  if (isPublicFallback) {
    parts.push("Showing public node data. Run your own node for real-time personal stats.");
  }

  parts.push(`Block height is ${stats.blockHeight.replace(/,/g, ' ')}.`);
  parts.push(`Status: ${stats.statusLabel.replace(/[✓✕⟳]/g, '').trim()}.`);
  parts.push(`Peers connected: ${stats.peerCount}.`);

  if (stats.isSyncing) {
    parts.push('Node is currently syncing.');
  }

  if (stats.hasWarnings) {
    parts.push(`Warning: ${stats.warnings}`);
  }

  return parts.join(' ');
}

/**
 * SetNodeIPIntent — store user's node IP in persistent attributes
 */
const SetNodeIPIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetNodeIPIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    // Extract IP slot — Alexa STT may return it differently, we normalise
    const ipSlot = Alexa.getSlotValue(handlerInput.requestEnvelope, 'ipAddress');

    if (!ipSlot) {
      return responseBuilder
        .speak("I didn't catch the IP address. Please say something like: set my node to 192 dot 168 dot 1 dot 100.")
        .withShouldEndSession(false)
        .getResponse();
    }

    // Normalise STT output: "192 dot 168 dot 1 dot 100" → "192.168.1.100"
    const normalised = normaliseIp(ipSlot);

    if (!isValidIp(normalised)) {
      return responseBuilder
        .speak(`That doesn't look like a valid IP address: ${ipSlot}. Please try again, saying the numbers and dots clearly.`)
        .withShouldEndSession(false)
        .getResponse();
    }

    // Store in DynamoDB
    let persistentAttrs = {};
    try {
      persistentAttrs = await attributesManager.getPersistentAttributes() || {};
    } catch (e) {
      console.warn('Could not read persistent attributes:', e.message);
    }

    persistentAttrs.nodeIp = normalised;
    attributesManager.setPersistentAttributes(persistentAttrs);

    try {
      await attributesManager.savePersistentAttributes();
    } catch (e) {
      console.error('Failed to save persistent attributes:', e.message);
      return responseBuilder
        .speak("Sorry, I had trouble saving your node address. Please try again.")
        .withShouldEndSession(false)
        .getResponse();
    }

    return responseBuilder
      .speak(`Got it! I've saved your CKB node at ${normalised}. Opening your dashboard now.`)
      .withShouldEndSession(false)
      .getResponse();
  },
};

/**
 * ClearNodeIPIntent — remove stored node IP (revert to public fallback)
 */
const ClearNodeIPIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClearNodeIPIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;

    let persistentAttrs = {};
    try {
      persistentAttrs = await attributesManager.getPersistentAttributes() || {};
    } catch (e) {
      console.warn('Could not read persistent attributes:', e.message);
    }

    delete persistentAttrs.nodeIp;
    attributesManager.setPersistentAttributes(persistentAttrs);

    try {
      await attributesManager.savePersistentAttributes();
    } catch (e) {
      console.error('Failed to save persistent attributes:', e.message);
    }

    return responseBuilder
      .speak("Done! I've removed your node address. I'll use the public CKB network from now on.")
      .withShouldEndSession(false)
      .getResponse();
  },
};

/**
 * APL UserEvent — handle "Refresh" button tap from Echo Show screen
 */
const AplUserEventHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
      handlerInput.requestEnvelope.request.arguments &&
      handlerInput.requestEnvelope.request.arguments[0] === 'REFRESH'
    );
  },
  async handle(handlerInput) {
    return handleGetStats(handlerInput);
  },
};

/**
 * HelpIntent
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    const speakOutput = [
      "CKB Node Monitor shows you live stats from the Nervos Network.",
      "If you run your own node, say: set my node to, followed by your IP address.",
      "Otherwise I'll show public network data.",
      "You can ask: show my node stats, block height, or peer count.",
      "To reset to the public node, say: clear my node.",
    ].join(' ');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("Say 'show stats' to see your dashboard, or 'set my node to' followed by your IP address.")
      .withShouldEndSession(false)
      .getResponse();
  },
};

/**
 * CancelAndStop
 */
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye! May your blocks stay healthy.')
      .withShouldEndSession(true)
      .getResponse();
  },
};

/**
 * SessionEndedRequest
 */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log('Session ended:', JSON.stringify(handlerInput.requestEnvelope.request.reason));
    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * FallbackIntent
 */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("I'm not sure how to help with that. Try saying 'show my node stats' or 'help'.")
      .reprompt("Say 'show stats' or 'help'.")
      .withShouldEndSession(false)
      .getResponse();
  },
};

/**
 * Error handler — catch all
 */
const ErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput, error) {
    console.error('Unhandled error:', error.message, error.stack);
    return handlerInput.responseBuilder
      .speak("Sorry, something went wrong. Please try again.")
      .withShouldEndSession(false)
      .getResponse();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// IP validation helpers
// ─────────────────────────────────────────────────────────────────────────────

function normaliseIp(raw) {
  return raw
    .toLowerCase()
    .replace(/\s*dot\s*/g, '.')
    .replace(/\s+/g, '')
    .trim();
}

function isValidIp(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — log every request for debugging
// ─────────────────────────────────────────────────────────────────────────────

const LoggingRequestInterceptor = {
  process(handlerInput) {
    console.log('Incoming request:', JSON.stringify({
      type: Alexa.getRequestType(handlerInput.requestEnvelope),
      intent: handlerInput.requestEnvelope.request.intent?.name,
    }));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skill builder + export
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = Alexa.SkillBuilders.custom()
  .withPersistenceAdapter(persistenceAdapter)
  .addRequestHandlers(
    LaunchRequestHandler,
    GetStatsIntentHandler,
    SetNodeIPIntentHandler,
    ClearNodeIPIntentHandler,
    AplUserEventHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    FallbackIntentHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LoggingRequestInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
