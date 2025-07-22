import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs-extra'
import { Boom } from '@hapi/boom'
import path from 'path'

export async function startBot(sessionId) {
  const sessionPath = `./sessions/${sessionId}`
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['BloodyOmeh', 'Safari', '3.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

      if (reason === DisconnectReason.loggedOut) {
        console.log('🔴 Session logged out. Deleting session:', sessionId)
        await fs.remove(sessionPath)
      } else {
        console.log('Reconnecting...')
        startBot(sessionId)
      }
    } else if (connection === 'open') {
      console.log(`✅ Bot connected: ${sessionId}`)
    }
  })

  return sock
}
