const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chucknorris')
    .setDescription('Bekomme Chuck Norris Fakten!'),
  execute(interaction) {
    // thanks to https://api.chucknorris.io
    fetch('https://api.chucknorris.io/jokes/random')
      .then(res => res.json())
      .then(json => {
        const embed = new MessageEmbed()
          .setColor('#CD7232')
          .setAuthor(
            'Chuck Norris',
            'https://i.imgur.com/wr1g92v.png',
            'https://chucknorris.io'
          )
          .setDescription(json.value)
          .setTimestamp();
        interaction.reply({ embeds: [embed] });
        return;
      })
      .catch(err => {
        interaction.reply(':x: Ein Fehler ist aufgetreten. Chuck untersucht das!');
        return console.error(err);
      });
  }
};
