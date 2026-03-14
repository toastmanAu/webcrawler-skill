import { Router, json } from 'itty-router';

const router = Router();

// Types
interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_OWNER_ID: string;
  LECTO_API_KEY?: string;
  KV_STORE: KVNamespace;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; username?: string };
  text?: string;
  reply_to_message?: { text?: string };
}

interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: { chat: { id: number }; message_id: number };
  data?: string;
}

// Language list (code, display name)
const LANGUAGES = [
  { code: 'en', name: '🇬🇧 English' },
  { code: 'es', name: '🇪🇸 Spanish' },
  { code: 'fr', name: '🇫🇷 French' },
  { code: 'de', name: '🇩🇪 German' },
  { code: 'it', name: '🇮🇹 Italian' },
  { code: 'pt', name: '🇵🇹 Portuguese' },
  { code: 'ru', name: '🇷🇺 Russian' },
  { code: 'ja', name: '🇯🇵 Japanese' },
  { code: 'zh', name: '🇨🇳 Chinese' },
  { code: 'ko', name: '🇰🇷 Korean' },
  { code: 'ar', name: '🇸🇦 Arabic' },
  { code: 'hi', name: '🇮🇳 Hindi' },
  { code: 'tr', name: '🇹🇷 Turkish' },
  { code: 'pl', name: '🇵🇱 Polish' },
  { code: 'nl', name: '🇳🇱 Dutch' },
];

const LANGS_PER_PAGE = 5;

// Helper: Send Telegram message
async function sendTelegram(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: any,
  replyToMessageId?: number
): Promise<Response> {
  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: 'MarkdownV2',
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;

  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Helper: Answer callback query
async function answerCallbackQuery(
  token: string,
  callbackId: string,
  text: string,
  showAlert = false
): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text,
      show_alert: showAlert,
    }),
  });
}

// Helper: Escape MarkdownV2
function escapeMarkdown(text: string): string {
  const chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return text.replace(/[_*[\]()~`>#\+\-=|{}\.!]/g, (c) => `\\${c}`);
}

// Helper: Translate via Lecto
async function translateText(
  apiKey: string,
  text: string,
  targetLang: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.lecto.ai/v1/translate/text', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        texts: [text],
        to: [targetLang],
      }),
    });

    if (!response.ok) {
      console.error(`Lecto API error: ${response.status}`);
      return null;
    }

    const data = await response.json<any>();
    if (data.result?.[0]?.[0]?.text) {
      return data.result[0][0].text;
    }
    return null;
  } catch (error) {
    console.error('Translation error:', error);
    return null;
  }
}

// Build language keyboard with pagination
function buildLanguageKeyboard(page = 0) {
  const start = page * LANGS_PER_PAGE;
  const end = start + LANGS_PER_PAGE;
  const pageLanguages = LANGUAGES.slice(start, end);

  const buttons = pageLanguages.map((lang) => [
    {
      text: lang.name,
      callback_data: `translate_${lang.code}`,
    },
  ]);

  // Add pagination buttons
  const navRow = [];
  if (page > 0) {
    navRow.push({
      text: '◀ Back',
      callback_data: `lang_page_${page - 1}`,
    });
  }
  if (end < LANGUAGES.length) {
    navRow.push({
      text: 'Next ▶',
      callback_data: `lang_page_${page + 1}`,
    });
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  return {
    inline_keyboard: buttons,
  };
}

// Handle /start command
async function handleStart(env: Env, chatId: number, userId: number): Promise<Response> {
  const isOwner = userId.toString() === env.TELEGRAM_OWNER_ID;
  const welcome = `Welcome to Lecto Translation Bot\\!

🌍 *Features:*
• Reply to any message and use /translate to translate it
• Owner only: /setkey, /allowgroup, /disallowgroup, /groups

${isOwner ? '👑 *You are the owner*' : ''}`;

  return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, welcome);
}

// Handle /translate command
async function handleTranslate(
  env: Env,
  chatId: number,
  message: TelegramMessage,
  userId: number
): Promise<Response> {
  // Check authorization
  if (message.chat.type === 'private') {
    if (userId.toString() !== env.TELEGRAM_OWNER_ID) {
      return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Private chat: owner only');
    }
  } else {
    // Group: check whitelist
    const allowed = await env.KV_STORE.get(`group_${chatId}`);
    if (!allowed) {
      return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'This group is not whitelisted for translations');
    }
  }

  // Check for reply
  if (!message.reply_to_message?.text) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Please reply to a text message and then use /translate');
  }

  const sourceText = message.reply_to_message.text;

  // Store source text in KV (TTL: 5 minutes = 300 seconds)
  const storeKey = `translate_${chatId}_${message.message_id}`;
  await env.KV_STORE.put(storeKey, sourceText, { expirationTtl: 300 });

  // Show language picker
  const keyboard = buildLanguageKeyboard(0);
  return sendTelegram(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    'Select target language:',
    keyboard,
    message.message_id
  );
}

// Handle /setkey command (owner only)
async function handleSetKey(env: Env, chatId: number, text: string, userId: number): Promise<Response> {
  if (userId.toString() !== env.TELEGRAM_OWNER_ID) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Owner only command');
  }

  const parts = text.split(' ');
  if (parts.length < 2) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /setkey <lecto_api_key>');
  }

  const apiKey = parts.slice(1).join(' ').trim();
  await env.KV_STORE.put('lecto_api_key', apiKey);

  return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, '✅ Lecto API key stored');
}

// Handle /allowgroup command (owner only)
async function handleAllowGroup(env: Env, chatId: number, userId: number, chatType: string): Promise<Response> {
  if (userId.toString() !== env.TELEGRAM_OWNER_ID) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Owner only command');
  }

  if (chatType === 'private') {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Use this command in a group');
  }

  await env.KV_STORE.put(`group_${chatId}`, 'true');
  return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, `✅ Group ${chatId} whitelisted`);
}

// Handle /disallowgroup command (owner only)
async function handleDisallowGroup(env: Env, chatId: number, userId: number): Promise<Response> {
  if (userId.toString() !== env.TELEGRAM_OWNER_ID) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Owner only command');
  }

  await env.KV_STORE.delete(`group_${chatId}`);
  return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, `✅ Group ${chatId} removed from whitelist`);
}

// Handle /groups command (owner only)
async function handleGroups(env: Env, chatId: number, userId: number): Promise<Response> {
  if (userId.toString() !== env.TELEGRAM_OWNER_ID) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Owner only command');
  }

  // KV doesn't support listing, so we'd need to track groups separately
  // For now, return a note
  return sendTelegram(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    '_Groups feature: KV doesn\'t support listing\\. Use /allowgroup in each group to whitelist it\\._'
  );
}

// Handle callback query (language selection)
async function handleCallback(
  env: Env,
  callbackQuery: TelegramCallbackQuery,
  userId: number
): Promise<Response> {
  const callbackId = callbackQuery.id;
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;

  if (!chatId || !callbackQuery.data) {
    return new Response('OK', { status: 200 });
  }

  // Pagination
  if (callbackQuery.data.startsWith('lang_page_')) {
    const page = parseInt(callbackQuery.data.split('_')[2], 10);
    const keyboard = buildLanguageKeyboard(page);
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard,
      }),
    });
    return new Response('OK', { status: 200 });
  }

  // Language translation
  if (callbackQuery.data.startsWith('translate_')) {
    const targetLang = callbackQuery.data.split('_')[1];
    const storeKey = `translate_${chatId}_${messageId}`;
    const sourceText = await env.KV_STORE.get(storeKey);

    if (!sourceText) {
      await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackId, 'Translation expired', true);
      return new Response('OK', { status: 200 });
    }

    // Get API key
    const kvKey = await env.KV_STORE.get('lecto_api_key');
    const apiKey = env.LECTO_API_KEY || kvKey;

    if (!apiKey) {
      await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackId, 'API key not configured', true);
      return new Response('OK', { status: 200 });
    }

    // Translate
    const translated = await translateText(apiKey, sourceText, targetLang);

    if (!translated) {
      await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackId, 'Translation failed', true);
      return new Response('OK', { status: 200 });
    }

    // Send result
    const langName = LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
    const result = `*${langName}:*\n${escapeMarkdown(translated)}`;
    await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, result);

    // Answer callback
    await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackId, '✅ Translated');
    return new Response('OK', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}

// Main handler
router.post('/webhook', async (request: Request, env: Env) => {
  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;
    const callbackQuery = update.callback_query;

    if (message) {
      const chatId = message.chat.id;
      const userId = message.from?.id || 0;
      const text = message.text || '';

      if (text.startsWith('/start')) {
        return await handleStart(env, chatId, userId);
      }

      if (text.startsWith('/translate')) {
        return await handleTranslate(env, chatId, message, userId);
      }

      if (text.startsWith('/setkey')) {
        return await handleSetKey(env, chatId, text, userId);
      }

      if (text.startsWith('/allowgroup')) {
        return await handleAllowGroup(env, chatId, userId, message.chat.type);
      }

      if (text.startsWith('/disallowgroup')) {
        return await handleDisallowGroup(env, chatId, userId);
      }

      if (text.startsWith('/groups')) {
        return await handleGroups(env, chatId, userId);
      }
    }

    if (callbackQuery) {
      return await handleCallback(env, callbackQuery, callbackQuery.from.id);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});

export default router;
