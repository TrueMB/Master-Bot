const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { PagesBuilder } = require('discord.js-pages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue-history')
    .setDescription('Zeigt den Warteschlangen Verlauf an'),
  execute(interaction) {
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if (!guildData) {
      return interaction.followUp('Es existiert kein Warteschlangen Verlauf!');
    } else if (guildData) {
      if (!guildData.queueHistory.length) {
        return interaction.followUp('Es gibt keine Songs im Verlauf!');
      }
    }

    const queueClone = Array.from(guildData.queueHistory);
    const embeds = [];

    for (let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
      const playlistArray = queueClone.slice(i * 24, 24 + i * 24);
      const fields = [];

      playlistArray.forEach((element, index) => {
        if (element == null) return;
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
