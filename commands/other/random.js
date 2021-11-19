const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Generiere eine Random Nummer zwischen zwei Zahlen!')
    .addIntegerOption(option =>
      option
        .setName('min')
        .setDescription('Was ist die kleinste Nummer?')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('max')
        .setDescription('Was ist die größte Nummer?')
        .setRequired(true)
    ),

  execute(interaction) {
    const min = Math.ceil(interaction.options.get('min').value);
    const max = Math.floor(interaction.options.get('max').value);
    const rngEmbed = new MessageEmbed().setTitle(
      `${Math.floor(Math.random() * (max - min + 1)) + min}`
    );

    return interaction.reply({ embeds: [rngEmbed] });
  }
};
