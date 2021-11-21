const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show-welcome-message')
    .setDescription('Teste die Willkommens Nachricht'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId)
	  return interaction.reply(':x: Der Command ist nur für den Server Besitzer!');

    interaction.client.emit('guildMemberAdd', interaction.member);
	return interaction.reply('Es wurde ein test verschickt!');
  }
};
