const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const createGuildData = require('../../utils/createGuildData');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Wiederhole einen Song!'),

  execute(interaction) {
    if (!interaction.client.guildData.get(interaction.guildId)) {
      interaction.client.guildData.set(interaction.guildId, createGuildData());
    }
    const guildData = interaction.client.guildData.get(interaction.guildId);
    const player = interaction.client.playerManager.get(interaction.guildId);
    if (!player) {
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    } else if (player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    } else if (
      player.audioPlayer.state.status === AudioPlayerStatus.Playing &&
      guildData.triviaData.isTriviaRunning
    ) {
      return interaction.reply(
        `Du kannst diesen Command nicht während eines Musik Quizes ausführen!`
      );
    } else if (
      interaction.member.voice.channelId !==
      interaction.guild.me.voice.channelId
    ) {
      return interaction.reply(
        'Du musst im gleichen Sprachkanal sein, um diesen Command ausführen zu können!'
      );
    }

    if (player.loopSong) {
      player.loopSong = false;
      return interaction.reply(
        `**${player.nowPlaying.title}** wird nun nicht mehr wiederholt :repeat: `
      );
    }

    player.loopSong = true;
    interaction.reply(
      `**${player.nowPlaying.title}** wird nun wiederholt :repeat: `
    );
  }
};
