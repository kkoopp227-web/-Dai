const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-log')
    .setDescription('تحديد شات سجل خروج الأعضاء')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('اختر شات السجل')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const db = client.loadDB();

    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].logChannel = channel.id;
    await client.saveDB(db).catch(() => {});

    await interaction.reply({
      content: `تم تحديد شات السجل إلى: ${channel}`,
      ephemeral: true,
    });
  },
};