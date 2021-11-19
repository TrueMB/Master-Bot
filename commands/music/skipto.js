const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Überspringen Songs in der Warteschlange')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Bis zur welchen Position möchtest du überspringen?')
        .setRequired(true)
    ),

  execute(interaction) {
    interaction.deferReply();
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp(
        `:no_entry: Du musst im gleichen Sprachkanal, wie der Bot sein!`
      );
    }
    if (voiceChannel.id !== interaction.member.voice.channelId) {
      return interaction.followUp(
        `:no_entry: Du musst im gleichen Sprachkanal, wie der Bot sein!`
      );
    }
    const player = interaction.client.playerManager.get(interaction.guildId);
    if (!player) {
      return interaction.followUp(':x: Es wird aktuell nichts abgespielt!');
    }
    if (player.queue.length < 1) {
      return interaction.followUp('Es sind keine Songs in der Warteschlange!');
    }

    const position = interaction.options.get('position').value;

    if (player.loopQueue) {
      const slicedBefore = player.queue.slice(0, position - 1);
      const slicedAfter = player.queue.slice(position - 1);
      player.queue = slicedAfter.concat(slicedBefore);
    } else {
      player.queue.splice(0, position - 1);
      player.loopSong = false;
    }
    player.audioPlayer.stop();
    return interaction.followUp(`Es wurde auf Position **${player.queue[0].title}** übersprungen!`);
  }
};
