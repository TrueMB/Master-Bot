const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { tenorAPI } = require('../../config.json');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('awoo')
    .setDescription('Einfach Awoo.'),
  async execute(interaction) {
    await fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=anime+awoo&limit=1`)
      .then(res => res.json())
      .then(json => {

        const embed = new MessageEmbed()
          .setDescription('Awoooo~~')
    	  .setImage(json.results[0].media[0].gif.url);

        return interaction.reply({ embeds: [ embed ] });
      })
      .catch(err => {
        console.error(err);
        return interaction.reply(':x: Konnte kein Awoo laden.');
      });
  }
};
