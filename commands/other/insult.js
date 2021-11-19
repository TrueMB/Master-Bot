const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('insult')
    .setDescription('Generiere einen bösen Spruch!'),
  execute(interaction) {
    // thanks to https://evilinsult.com :)
    fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json')
      .then(res => res.json())
      .then(json => {
        const embed = new MessageEmbed()
          .setColor('#E41032')
          .setAuthor(
            'Insult',
            'https://i.imgur.com/bOVpNAX.png',
            'https://evilinsult.com'
          )
          .setDescription(json.insult)
          .setTimestamp();
        interaction.reply({ embeds: [embed] });
        return;
      })
      .catch(err => {
        interaction.reply(':x: Konnte nicht beleidigen! :/');
        return console.error(err);
      });
  }
};
