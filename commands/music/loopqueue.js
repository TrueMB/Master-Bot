const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const createGuildData = require('../../utils/createGuildData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loopqueue')
    .setDescription('Wiederhole die Warteschlange X mal - (Standard ist 1x)')
    .addIntegerOption(option =>
      option
        .setName('looptimes')
        .setDescription('Wie oft soll wiederholt werden?')
    ),

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
    } else if (player.loopSong) {
      return interaction.reply(
        ':x: Schalte zuerst die Wiederholung mit **/loop** aus, bevor du wieder **/loopqueue** benutzt.'
      );
    }

    let looptimes = interaction.options.get('looptimes');
    if (!looptimes) {
      looptimes = 1;
    } else {
      looptimes = looptimes.value;
    }

    if (player.loopQueue) {
      player.loopQueue = false;
      player.looptimes = 0;
      return interaction.reply(
        ':repeat: Die Warteschlange ist nun nicht mehr in der **Wiederholung**'
      );
    }
    player.loopSong = false;
    player.loopQueue = true;
    player.looptimes = looptimes;
    return interaction.reply(':repeat: Die Warteschlange wird nun **' + looptimes + 'x wiederholt**');
  }
};
