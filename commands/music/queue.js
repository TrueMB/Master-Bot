const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { PagesBuilder } = require('discord.js-pages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Zeigt die Warteschlange an'),
  async execute(interaction) {
    await interaction.deferReply();
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if (guildData) {
      if (guildData.triviaData.isTriviaRunning) {
        return interaction.followUp(
          ':x: Bitte versuche es nach dem Musik Quiz erneut!'
        );
      }
    }
    const player = interaction.client.playerManager.get(interaction.guildId);
    if (player) {
      if (player.queue.length == 0) {
        return interaction.followUp(':x: Es sind keine Songs in der Warteschlange!');
      }
    } else if (!player) {
      return interaction.followUp(':x: Es wird aktuell kein Song abgepsielt!');
    }

    const queueClone = Array.from(player.queue);
    const embeds = [];

    for (let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
      const playlistArray = queueClone.slice(i * 24, 24 + i * 24);
      const fields = [];

      playlistArray.forEach((element, index) => {
        fields.push({
          name: `${index + 1 + i * 24}`,
          value: `${element.title}`
        });
      });

      embeds.push(new MessageEmbed().setTitle(`Page ${i}`).setFields(fields));
    }

    new PagesBuilder(interaction)
      .setTitle('Musik Warteschlange')
      .setPages(embeds)
      .setListenTimeout(2 * 60 * 1000)
      .setColor('#9096e6')
      .setAuthor(
        interaction.member.user.username,
        interaction.member.user.displayAvatarURL()
      )
      .build();
  }
};
