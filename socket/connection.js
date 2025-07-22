const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');

async function generatePairingCode(number) {
    const sessionId = number;
    const sessionPath = path.join(__dirname, '../data/sessions', sessionId);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    try {
        const code = await sock.requestPairingCode(`${number}@s.whatsapp.net`);
        console.log(`✅ Pairing code for ${number}: ${code}`);
        return code;
    } catch (err) {
        console.error('❌ Error generating pairing code:', err);
        return null;
    }
}

module.exports = { generatePairingCode };
