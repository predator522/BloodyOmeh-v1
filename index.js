require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const makeSocket = require('./socket/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Telegram bot
const bot = new Telegraf(process.env.TG_BOT_TOKEN);

bot.command('start', (ctx) => {
  ctx.reply('🤖 Welcome to BloodyOmeh v1\nUse /pair <number> to get your WhatsApp pairing code.');
});

bot.command('pair', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length !== 2) return ctx.reply('❌ Usage: /pair <number>');
  const number = args[1];

  try {
    const code = await makeSocket(number);
    ctx.reply(`🔐 Pairing Code for *${number}*:\n\`${code}\``, { parse_mode: 'Markdown' });
  } catch (err) {
    ctx.reply('⚠️ Error generating pairing code:\n' + err.message);
  }
});

bot.launch();
console.log('🤖 Telegram bot launched');

// Express server
app.use(express.json());

app.get('/', (_, res) => {
  res.send('🤖 BloodyOmeh v1 is running.');
});

app.get('/pair', async (req, res) => {
  const number = req.query.number;
  if (!number) return res.status(400).send('Missing ?number= parameter');
  try {
    const code = await makeSocket(number);
    res.send(`🔐 Pairing Code for ${number}: ${code}`);
  } catch (err) {
    res.status(500).send('Error generating pairing code: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🌐 HTTP Server running at http://localhost:${PORT}`);
});
