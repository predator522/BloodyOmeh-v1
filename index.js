require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { handleCommand } = require('./handlers/commandHandler');
const { startTelegramBot } = require('./telegram/pairbot');
const pino = require('pino');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Express health check for Railway/VPS
app.get('/', (req, res) => res.send('BloodyOmeh v1 is alive!'));
app.listen(PORT, () => console.log(`✅ Web server running on port ${PORT}`));

// --- MULTI SESSION LOGIN SYSTEM ---
const startWhatsAppBot = async (sessionId) => {
    const sessionPath = path.join(__dirname, './data/sessions', sessionId);
    if (!fs.existsSync(sessionPath)) return console.log(`❌ Session not found: ${sessionId}`);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message) return;
        await handleCommand(sock, msg);
    });

    console.log(`🤖 WhatsApp session '${sessionId}' loaded successfully.`);
};

// Start all available sessions
const sessionsDir = path.join(__dirname, './data/sessions');
fs.readdirSync(sessionsDir).forEach(session => {
    if (fs.lstatSync(path.join(sessionsDir, session)).isDirectory()) {
        startWhatsAppBot(session);
    }
});

// Start Telegram Pair Bot
startTelegramBot();
