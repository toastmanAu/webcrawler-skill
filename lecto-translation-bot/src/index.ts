import { Router, json } from 'itty-router';

const router = Router();

// Types
interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_OWNER_ID?: string;
  LECTO_API_KEY?: string;
  lecto_kv: KVNamespace;
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
  // European
  { code: 'en', name: '🇬🇧 English', cmd: 'en' },
  { code: 'es', name: '🇪🇸 Spanish', cmd: 'es' },
  { code: 'fr', name: '🇫🇷 French', cmd: 'fr' },
  { code: 'de', name: '🇩🇪 German', cmd: 'de' },
  { code: 'it', name: '🇮🇹 Italian', cmd: 'it' },
  { code: 'pt', name: '🇵🇹 Portuguese', cmd: 'pt' },
  { code: 'ru', name: '🇷🇺 Russian', cmd: 'ru' },
  { code: 'pl', name: '🇵🇱 Polish', cmd: 'pl' },
  { code: 'nl', name: '🇳🇱 Dutch', cmd: 'nl' },
  { code: 'sv', name: '🇸🇪 Swedish', cmd: 'sv' },
  { code: 'no', name: '🇳🇴 Norwegian', cmd: 'no' },
  { code: 'da', name: '🇩🇰 Danish', cmd: 'da' },
  { code: 'fi', name: '🇫🇮 Finnish', cmd: 'fi' },
  { code: 'cs', name: '🇨🇿 Czech', cmd: 'cs' },
  { code: 'sk', name: '🇸🇰 Slovak', cmd: 'sk' },
  { code: 'hu', name: '🇭🇺 Hungarian', cmd: 'hu' },
  { code: 'ro', name: '🇷🇴 Romanian', cmd: 'ro' },
  { code: 'bg', name: '🇧🇬 Bulgarian', cmd: 'bg' },
  { code: 'hr', name: '🇭🇷 Croatian', cmd: 'hr' },
  { code: 'el', name: '🇬🇷 Greek', cmd: 'el' },
  { code: 'tr', name: '🇹🇷 Turkish', cmd: 'tr' },
  
  // Asian
  { code: 'zh', name: '🇨🇳 Chinese', cmd: 'zh' },
  { code: 'ja', name: '🇯🇵 Japanese', cmd: 'ja' },
  { code: 'ko', name: '🇰🇷 Korean', cmd: 'ko' },
  { code: 'vi', name: '🇻🇳 Vietnamese', cmd: 'vi' },
  { code: 'th', name: '🇹🇭 Thai', cmd: 'th' },
  { code: 'hi', name: '🇮🇳 Hindi', cmd: 'hi' },
  { code: 'bn', name: '🇧🇩 Bengali', cmd: 'bn' },
  { code: 'pa', name: '🇵🇰 Punjabi', cmd: 'pa' },
  { code: 'ta', name: '🇮🇳 Tamil', cmd: 'ta' },
  { code: 'te', name: '🇮🇳 Telugu', cmd: 'te' },
  { code: 'kn', name: '🇮🇳 Kannada', cmd: 'kn' },
  { code: 'ml', name: '🇮🇳 Malayalam', cmd: 'ml' },
  { code: 'id', name: '🇮🇩 Indonesian', cmd: 'id' },
  { code: 'ms', name: '🇲🇾 Malay', cmd: 'ms' },
  { code: 'tl', name: '🇵🇭 Tagalog', cmd: 'tl' },
  
  // Middle East & Africa
  { code: 'ar', name: '🇸🇦 Arabic', cmd: 'ar' },
  { code: 'he', name: '🇮🇱 Hebrew', cmd: 'he' },
  { code: 'fa', name: '🇮🇷 Persian', cmd: 'fa' },
  { code: 'ur', name: '🇵🇰 Urdu', cmd: 'ur' },
  { code: 'sw', name: '🇹🇿 Swahili', cmd: 'sw' },
  { code: 'af', name: '🇿🇦 Afrikaans', cmd: 'af' },
  
  // Americas
  { code: 'es-mx', name: '🇲🇽 Spanish (Mexico)', cmd: 'es-mx' },
  { code: 'pt-br', name: '🇧🇷 Portuguese (Brazil)', cmd: 'pt-br' },
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
  return text.replace(/[_*[\]()~`>#\+\-=|{}\.!]/g, (c) => `\\${c}`);
}

// Helper: Clean text for translation (remove emoji, URLs)
function cleanText(text: string): string {
  // Remove emoji
  let cleaned = text.replace(
    /(\u00d7|\u20e3|[\u0300-\u036f]|[\u2600-\u27BF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u200D\u200C\u200B])/g,
    ''
  );
  
  // Remove URLs (http, https, www, etc.)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '').replace(/www\.[^\s]+/g, '').trim();
  
  return cleaned;
}

// Helper: Translate via Lecto
async function translateText(
  apiKey: string,
  text: string,
  targetLang: string
): Promise<string | null> {
  try {
    // Clean text before sending
    const cleanedText = cleanText(text);
    
    if (!cleanedText) {
      return null; // Empty after cleaning
    }

    const response = await fetch('https://api.lecto.ai/v1/translate/text', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        texts: [cleanedText],
        to: [targetLang],
      }),
    });

    if (!response.ok) {
      console.error(`Lecto API error: ${response.status}`);
      return null;
    }

    const data = await response.json<any>();
    console.log('Lecto response:', JSON.stringify(data));
    
    // Correct response format
    if (data.translations?.[0]?.translated?.[0]) {
      return data.translations[0].translated[0];
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

// Extract text to translate (from reply or command text)
function getTextToTranslate(message: TelegramMessage): string | null {
  // Prefer replied message
  if (message.reply_to_message?.text) {
    return message.reply_to_message.text;
  }
  // Skip if reply is media (no caption)
  if (message.reply_to_message && !message.reply_to_message.text) {
    return null;
  }
  return null;
}

// Handle direct language command (/en, /es, /zh, etc.)
async function handleLanguageCommand(
  env: Env,
  chatId: number,
  message: TelegramMessage,
  langCode: string
): Promise<Response> {
  const sourceText = getTextToTranslate(message);

  if (!sourceText) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, 'Please reply to a text message');
  }

  // Get API key
  const kvKey = await env.lecto_kv.get('lecto_api_key');
  const apiKey = env.LECTO_API_KEY || kvKey;

  if (!apiKey) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, '❌ API key not configured');
  }

  // Translate
  const translated = await translateText(apiKey, sourceText, langCode);

  if (!translated) {
    return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, '❌ Translation failed');
  }

  // Add language flag on output (emoji will be stripped if forwarded, preventing recursion)
  const lang = LANGUAGES.find((l) => l.code === langCode);
  const flag = lang?.name.split(' ')[0] || ''; // Extract just the emoji
  const result = `${flag} ${escapeMarkdown(translated)}`;

  return sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, result);
}

// Handle callback query (language selection from picker)
async function handleCallback(
  env: Env,
  callbackQuery: TelegramCallbackQuery
): Promise<Response> {
  const callbackId = callbackQuery.id;
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;

  if (!chatId || !callbackQuery.data) {
    return new Response('OK', { status: 200 });
  }

  // Language translation
  if (callbackQuery.data.startsWith('translate_')) {
    const targetLang = callbackQuery.data.split('_')[1];
    const storeKey = `translate_${chatId}_${messageId}`;
    const sourceText = await env.lecto_kv.get(storeKey);

    if (!sourceText) {
      await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackId, 'Translation expired', true);
      return new Response('OK', { status: 200 });
    }

    // Get API key
    const kvKey = await env.lecto_kv.get('lecto_api_key');
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

    // Add language flag on output (emoji stripped if forwarded, preventing recursion)
    const lang = LANGUAGES.find((l) => l.code === targetLang);
    const flag = lang?.name.split(' ')[0] || ''; // Extract just the emoji
    const result = `${flag} ${escapeMarkdown(translated)}`;
    
    await sendTelegram(env.TELEGRAM_BOT_TOKEN, chatId, result);

    // Answer callback
    await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackId, '✅');
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
      const text = message.text || '';

      // Check for language commands (with or without @botname)
      for (const lang of LANGUAGES) {
        const cmdPattern = new RegExp(`^/${lang.cmd}(@WyTranslateBot)?$`);
        if (cmdPattern.test(text)) {
          return await handleLanguageCommand(env, chatId, message, lang.code);
        }
      }
    }

    if (callbackQuery) {
      return await handleCallback(env, callbackQuery);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});

export default router;
