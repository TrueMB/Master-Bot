const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('awoo')
    .setDescription('Bekomme ein Awoo.'),
  execute(interaction, mentionedMember) {
    fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=anime+awoo&limit=1`)
          .then(res => res.json())
          .then(json => {

    		 if (mentionedMember == 's') mentionedMember = '<@!' + message.author.id + '>';

             const idkEmbed = new MessageEmbed()
              .setDescription(mentionedMember + ' Awoos')
    		  .setImage(json.results[0].media[0].gif.url);
    		  //.setImage(json.results[0].url);
             interaction.deferReply();
             message.channel.send(idkEmbed);
    	  })
          .catch(err => {
            console.error(err);
            return interaction.reply(':x: Konnte kein Awoo laden.');
          });
  }
};
