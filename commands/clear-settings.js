const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-settings')
    .setDescription('مسح جميع الإعدادات (الرول التلقائي والشاتات)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const db = client.loadDB();
    const guildData = db[interaction.guild.id];

    if (!guildData || (!guildData.autoRole && !guildData.welcomeChannel && !guildData.boostChannel)) {
      return interaction.reply({ content: 'لا توجد إعدادات لمسحها.', ephemeral: true });
    }

    db[interaction.guild.id] = {};
    client.saveDB(db);

    await interaction.reply({
      content: 'تم مسح جميع الإعدادات بنجاح.',
      ephemeral: true,
    });
  },
};