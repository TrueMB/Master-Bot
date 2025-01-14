const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('motivation')
    .setDescription('Bekomme einen Motivations Stups!'),
  execute(interaction) {
    // thanks to https://type.fit/api/quotes

    const jsonQuotes = fs.readFileSync(
      '././resources/quotes/motivational.json',
      'utf8'
    );
    const quoteArray = JSON.parse(jsonQuotes).quotes;

    const randomQuote =
      quoteArray[Math.floor(Math.random() * quoteArray.length)];

    const quoteEmbed = new MessageEmbed()
      .setAuthor(
        'Motivation:',
        'https://i.imgur.com/Cnr6cQb.png',
        'https://type.fit'
      )
      .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
      .setTimestamp()
      .setColor('#FFD77A');
    return interaction.reply({ embeds: [quoteEmbed] });
  }
};
