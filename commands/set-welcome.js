const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-welcome')
    .setDescription('تحديد شات الترحيب للأعضاء الجدد')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('اختر شات الترحيب')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const db = client.loadDB();

    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].welcomeChannel = channel.id;
    await client.saveDB(db).catch(() => {});

    await interaction.reply({
      content: `تم تحديد شات الترحيب إلى: ${channel}`,
      ephemeral: true,
    });
  },
};