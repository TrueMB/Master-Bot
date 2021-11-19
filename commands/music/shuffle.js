const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mische die Warteschlange!'),

  execute(interaction) {
    interaction.deferReply();
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp(
        `:no_entry: Du musst im gleichen Sprachkanal, wie der Bot sein!`
      );
    } else if (voiceChannel.id !== interaction.guild.me.voice.channel.id) {
      return interaction.followUp(
        `:no_entry: Du musst im gleichen Sprachkanal, wie der Bot sein!`
      );
    }
    const player = interaction.client.playerManager.get(interaction.guildId);
    if (!player) {
      return interaction.followUp(':x: Es wird aktuell nichts abgespielt!');
    } else if (player.loopSong) {
      return interaction.followUp(
        ':x: Schalte zuerst die **Wiederholung** aus, bevor du **/shuffle** nutzt!'
      );
    }

    if (player.queue.length < 1) {
      return interaction.followUp('Es sing keine Songs in der Warteschlange zum Mischen!');
    }

    if (player.commandLock) {
      return interaction.followUp(
        'Bitte warte bis der Play Command verarbeitet wurde.'
      );
    }

    shuffleQueue(player.queue);

    return interaction.followUp('Die Warteschlange wurde gemischt!');
  }
};

function shuffleQueue(queue) {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
}
