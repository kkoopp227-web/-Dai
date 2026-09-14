const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { createWelcomeCard } = require('./welcomeCard');
const storage = require('./storage');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

client.commands = new Collection();

const loadDB = storage.loadDB;
const saveDB = storage.saveDB;

client.loadDB = loadDB;
client.saveDB = saveDB;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

const inviteCache = new Map();
client.inviteCache = inviteCache;

client.once('ready', async () => {
  console.log(`تم تشغيل البوت: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'مراقبة السيرفر', type: ActivityType.Watching }],
    status: 'online',
  });

  for (const guild of client.guilds.cache.values()) {
    try {
      const guildInvites = await guild.invites.fetch();
      inviteCache.set(guild.id, new Map(
        guildInvites.map(invite => [invite.code, { uses: invite.uses, inviter: invite.inviter?.id }])
      ));
    } catch (err) {
      console.log(`فشل جمع الدعوات في ${guild.name}: ${err.message}`);
    }
  }
});

client.on('inviteCreate', async (invite) => {
  const cached = inviteCache.get(invite.guild.id) || new Map();
  cached.set(invite.code, { uses: invite.uses, inviter: invite.inviter?.id });
  inviteCache.set(invite.guild.id, cached);
});

client.on('inviteDelete', async (invite) => {
  const cached = inviteCache.get(invite.guild.id);
  if (cached) cached.delete(invite.code);
});

client.on('guildMemberAdd', async (member) => {
  const db = loadDB();
  const guildData = db[member.guild.id] || {};

  const autoRoleId = config.autoRole || guildData.autoRole;
  const welcomeChannelId = config.welcomeChannel || guildData.welcomeChannel;

  // Auto Role
  if (autoRoleId) {
    try {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) {
        await member.roles.add(role);
      }
    } catch (err) {
      console.log(`فشل إعطاء الرول التلقائي: ${err.message}`);
    }
  }

  // Welcome Message
  if (welcomeChannelId) {
    try {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (!channel) return;

      let inviter = null;

      const guildInvites = await member.guild.invites.fetch();
      const cachedInvites = inviteCache.get(member.guild.id) || new Map();

      for (const [code, invite] of guildInvites) {
        const cachedInvite = cachedInvites.get(code);
        if (cachedInvite && invite.uses > cachedInvite.uses) {
          inviter = invite.inviter || null;
          break;
        }
      }

      const welcomeImage = await createWelcomeCard(member, inviter, guildData.welcomeConfig);

      await channel.send({
        content: `مرحباً في السيرفر، أهلاً وسهلاً بك يا ${member}!`,
        files: [{ attachment: welcomeImage, name: 'welcome.png' }],
      });

      // Update cache
      const newCached = inviteCache.get(member.guild.id) || new Map();
      for (const [code, invite] of guildInvites) {
        newCached.set(code, { uses: invite.uses, inviter: invite.inviter?.id });
      }
      inviteCache.set(member.guild.id, newCached);
    } catch (err) {
      console.log(`فشل إرسال رسالة الترحيب: ${err.message}`);
    }
  }
});

client.on('guildMemberRemove', async (member) => {
  const db = loadDB();
  const guildData = db[member.guild.id] || {};

  const logChannelId = config.logChannel || guildData.logChannel;

  if (logChannelId) {
    try {
      const channel = member.guild.channels.cache.get(logChannelId);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('غادر العضو السيرفر')
        .setDescription(`${member.user.username} خرج من **${member.guild.name}**`)
        .addFields(
          { name: 'اليوزر', value: `${member.user.username}`, inline: true },
          { name: 'الديسبلاي', value: `${member.displayName}`, inline: true },
          { name: 'عدد الأعضاء بعد الخروج', value: `${member.guild.members.cache.size}`, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.log(`فشل إرسال رسالة الخروج: ${err.message}`);
    }
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (oldMember.premiumSince && !newMember.premiumSince) return;
  if (!oldMember.premiumSince && newMember.premiumSince) {
    const db = loadDB();
    const guildData = db[newMember.guild.id] || {};

    const boostChannelId = config.boostChannel || guildData.boostChannel;

    if (boostChannelId) {
      try {
        const channel = newMember.guild.channels.cache.get(boostChannelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('ترقية جديدة!')
        .setDescription(`${newMember} قام بترقية السيرفر! شكر لك!`)
        .addFields(
          { name: 'عدد الترقيات', value: `${newMember.guild.premiumSubscriptionCount || 0}`, inline: true },
        )
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

        await channel.send({ embeds: [embed] });
      } catch (err) {
        console.log(`فشل إرسال رسالة الترقية: ${err.message}`);
      }
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (config.commandChannel && interaction.channelId !== config.commandChannel) return;
  if (config.allowedRole && interaction.member && !interaction.member.roles.cache.has(config.allowedRole)) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`خطأ في الأمر ${interaction.commandName}:`, error.message);
    try {
      const reply = { content: 'حدث خطأ أثناء تنفيذ الأمر!', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (_) {
      console.log('تعذر إرسال رسالة الخطأ (interaction منتهي)');
    }
  }
});

client.on('error', (e) => console.error('Client Error:', e.message));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));

(async () => {
  await storage.init();

  if (process.env.PORT) {
    const http = require('http');
    http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('bot is running');
    }).listen(process.env.PORT, () => {
      console.log(`الخادم الصحي شغال على المنفذ ${process.env.PORT}`);
    });
  }

  client.login(config.token);
})();
