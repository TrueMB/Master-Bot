const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bored')
    .setDescription('Generiere eine random Aktivität!'),
  execute(interaction) {
    fetch('https://www.boredapi.com/api/activity?participants=1')
      .then(res => res.json())
      .then(json => {
        const embed = new MessageEmbed()
          .setColor('#6BA3FF')
          .setAuthor(
            'Mein Vorschlag:',
            'https://i.imgur.com/7Y2F38n.png',
            'https://www.boredapi.com/'
          )
          .setDescription(json.activity)
          .setTimestamp();
        interaction.reply({ embeds: [embed] });
        return;
      })
      .catch(err => {
        interaction.reply('Konnte leider keine Aktivität für dich Laden :sob:');
        return console.error(err);
      });
  }
};
