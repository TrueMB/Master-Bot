const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { tenorAPI } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Lust auf ein süßes Kätzchen?'),
  execute(interaction) {
    fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=cat&limit=1`)
      .then(res => res.json())
      .then(json => interaction.reply({ content: json.results[0].url }))
      .catch(err => {
        interaction.reply(':x: Konnte leider keine Katze finden!');
        return console.error(err);
      });
  }
};
