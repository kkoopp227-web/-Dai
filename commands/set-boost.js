const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-boost')
    .setDescription('تحديد شات رسائل الترقية (Boost)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('اختر شات الترقية')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const db = client.loadDB();

    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].boostChannel = channel.id;
    await client.saveDB(db).catch(() => {});

    await interaction.reply({
      content: `تم تحديد شات الترقية إلى: ${channel}`,
      ephemeral: true,
    });
  },
};