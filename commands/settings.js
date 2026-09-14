const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('عرض إعدادات البوت الحالية')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const db = client.loadDB();
    const guildData = db[interaction.guild.id] || {};

    const role = guildData.autoRole ? interaction.guild.roles.cache.get(guildData.autoRole) : null;
    const welcomeChannel = guildData.welcomeChannel ? interaction.guild.channels.cache.get(guildData.welcomeChannel) : null;
    const boostChannel = guildData.boostChannel ? interaction.guild.channels.cache.get(guildData.boostChannel) : null;

    const embed = new EmbedBuilder()
      .setColor('#5865f2')
      .setTitle('إعدادات البوت')
      .addFields(
        { name: 'الرول التلقائي', value: role ? `${role}` : 'غير محدد', inline: true },
        { name: 'شات الترحيب', value: welcomeChannel ? `${welcomeChannel}` : 'غير محدد', inline: true },
        { name: 'شات الترقية', value: boostChannel ? `${boostChannel}` : 'غير محدد', inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};