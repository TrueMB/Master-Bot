const { SlashCommandBuilder } = require('@discordjs/builders');
const Guild = require('../../utils/models/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-message')
    .setDescription('Aktiviere die Willkommens Nachricht')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Was soll gemacht werden?')
        .setRequired(true)
	    .addChoice('Check', 'check')
		.addChoice('Enable', 'enable')
	    .addChoice('Disable', 'disable')
	),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId)
	  return interaction.reply(':x: Der Command ist nur für den Server Besitzer!');

    const guildData = await Guild.findOne({ guildId: interaction.member.guild.id });

    if (!guildData)
	  return interaction.reply('Bitte erstelle zuerst eine Nachricht mit **/set-welcome-message**!');

    const status = interaction.options.get('status').value;

	if(status == 'check'){
	  return interaction.reply('Der Status der Willkommens Nachricht ist aktuell: ' + guildData.status);
	}

	const statusValue = (status == 'enable');
	guildData.status = statusValue;
    guildData.save();

	return interaction.reply('Der Status der Willkommens Nachricht wurde auf **' + status + '** gesetzt!');
  }
};
