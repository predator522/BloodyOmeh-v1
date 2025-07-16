const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const P = require('pino');
const path = require('path');
const fs = require('fs');

async function startSock(sessionName = 'default') {
  const sessionFolder = path.join(__dirname, '..', 'session', sessionName);

  // Ensure session folder exists
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P().info),
    },
    browser: ['BloodyOmeh', 'Safari', '1.0.0'],
    logger: P({ level: 'silent' }),
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startSock(sessionName);
      }
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp as', sock.user.name || sock.user.id);
    }
  });

  return sock;
}

module.exports = startSock;
