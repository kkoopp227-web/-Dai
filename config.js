const fs = require('fs');

let fileCfg = {};
try {
  fileCfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (_) {}

module.exports = {
  token: process.env.DISCORD_TOKEN || fileCfg.token,
  clientId: process.env.DISCORD_CLIENT_ID || fileCfg.clientId,
  guildId: process.env.DISCORD_GUILD_ID || fileCfg.guildId,
  commandChannel: process.env.COMMAND_CHANNEL || fileCfg.commandChannel,
  allowedRole: process.env.ALLOWED_ROLE || fileCfg.allowedRole,
  welcomeChannel: process.env.WELCOME_CHANNEL || fileCfg.welcomeChannel,
  boostChannel: process.env.BOOST_CHANNEL || fileCfg.boostChannel,
  logChannel: process.env.LOG_CHANNEL || fileCfg.logChannel,
  autoRole: process.env.AUTO_ROLE || fileCfg.autoRole,
  mongoUri: process.env.MONGO_URI || fileCfg.mongoUri,
};