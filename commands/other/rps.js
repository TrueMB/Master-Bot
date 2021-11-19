const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Rock paper scissors!')
    .addStringOption(option =>
      option
        .setName('move')
        .setDescription(
          'Schere, Stein, Papier'
        )
        .setRequired(true)
    ),
  execute(interaction) {
    const replies = ['Stein', 'Papier', 'Schere'];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    const embed = new MessageEmbed()
      .setColor('RANDOM')
      .setTitle('Schere, Stein, Papier')
      .setDescription(`**${reply}**`);
    return interaction.reply({ embeds: [embed] });
  }
};
