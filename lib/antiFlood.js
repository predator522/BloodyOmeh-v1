const cooldowns = {};
const userMessageTimestamps = {};

const COOLDOWN_SECONDS = 3;
const FLOOD_WINDOW = 10; // seconds
const FLOOD_LIMIT = 5;   // max messages per window

function isFlooding(user) {
  const now = Date.now();

  if (!userMessageTimestamps[user]) userMessageTimestamps[user] = [];

  userMessageTimestamps[user] = userMessageTimestamps[user].filter(
    (timestamp) => now - timestamp < FLOOD_WINDOW * 1000
  );

  userMessageTimestamps[user].push(now);

  return userMessageTimestamps[user].length > FLOOD_LIMIT;
}

function isOnCooldown(user) {
  const now = Date.now();

  if (cooldowns[user] && now - cooldowns[user] < COOLDOWN_SECONDS * 1000) {
    return true;
  }

  cooldowns[user] = now;
  return false;
}

module.exports = {
  isFlooding,
  isOnCooldown,
};
