// telegram.js
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.onText(/^\/pair (\d{11,14})$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const number = match[1];

    const { generateWACode } = await import('./socket/pairing.js');
    const code = await generateWACode(number);

    bot.sendMessage(chatId, `🔗 *8-digit code for ${number}*: \n\`${code}\``, { parse_mode: 'Markdown' });
});
