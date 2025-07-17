// telegram.js
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_TOKEN = process.env.TG_BOT_TOKEN; // make sure this is in .env
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 Welcome to *BloodyOmeh v1*.\nUse /pair <number> to get your WhatsApp pairing code.`, {
    parse_mode: 'Markdown',
  });
});

bot.onText(/^\/pair (\d{10,15})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];

  try {
    const { generateWACode } = await import('./socket/pairing.js');
    const code = await generateWACode(number);

    bot.sendMessage(chatId, `🔗 *8-digit code for ${number}*: \n\`${code}\``, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '⚠️ Error generating pairing code:\n' + err.message);
  }
});
