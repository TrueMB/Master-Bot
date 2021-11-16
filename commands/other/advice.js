const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advice')
    .setDescription('Bekomme einen Rat!'),
  execute(interaction) {
    fetch('https://api.adviceslip.com/advice')
      .then(res => res.json())
      .then(json => {
        const embed = new MessageEmbed()
          .setColor('#403B3A')
          .setAuthor(
            'Mein Rat an dich:',
            'https://i.imgur.com/8pIvnmD.png',
            'https://adviceslip.com/'
          )
          .setDescription(json.slip.advice)
          .setTimestamp();
        interaction.reply({ embeds: [embed] });
        return;
      })
      .catch(err => {
        interaction.reply('Konnte leider keinen Rat für dich finden :sob:');
        return console.error(err);
      });
  }
};
