const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Zeigt den aktiven Song an'),
  async execute(interaction) {
    const player = await interaction.client.playerManager.get(
      interaction.guildId
    );

    if (!player) {
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    } else if (player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    }

    const nowPlayingEmbed = new MessageEmbed()
      .setTitle('Aktuell wird abgespielt:')
      .setColor('#ff0000')
      .setDescription(
        `[${player.nowPlaying.title}](${player.nowPlaying.url}) - **[${player.nowPlaying.memberDisplayName}]**`
      );

    interaction.reply({ embeds: [nowPlayingEmbed] });
  }
};
