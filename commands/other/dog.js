const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { tenorAPI } = require('../../config.json');

// Skips loading if not found in config.json
if (!tenorAPI) return;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Zeigt ein süßes Puppy!'),
  execute(interaction) {
    fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=dog&limit=1`)
      .then(res => res.json())
      .then(json => interaction.reply(json.results[0].url))
      .catch(err => {
        interaction.reply(':x: Konnte Doggo nicht Laden!');
        return console.error(err);
      });
  }
};
