const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-role')
    .setDescription('تحديد الرول التلقائي الذي يُعطى للأعضاء الجدد')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('اختر الرول')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const role = interaction.options.getRole('role');
    const db = client.loadDB();

    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].autoRole = role.id;
    client.saveDB(db);

    await interaction.reply({
      content: `تم تحديد الرول التلقائي إلى: ${role}`,
      ephemeral: true,
    });
  },
};