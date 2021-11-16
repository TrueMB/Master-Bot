const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Spielt den pausierten Song wieder ab.'),
  execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('Bitte betrete einen Sprachkanal und versuche es erneut!');
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if (!player) {
      return interaction.reply('Es wird aktuell kein Song pausiert!');
    }
    if (player.audioPlayer.state.status == AudioPlayerStatus.Playing) {
      return interaction.reply('Der Song ist nicht pausiert!');
    } else if (voiceChannel.id !== interaction.guild.me.voice.channel.id) {
      return interaction.reply(
        'Du musst im selben Sprachkanal sein!'
      );
    }

    const success = player.audioPlayer.unpause();

    if (success) {
      return interaction.reply(':play_pause: Song wird fortgesetzt!');
    } else {
      return interaction.reply(
        'Ich konnte deinen Song nicht fortsetzen. Bitte versuche es später erneut.'
      );
    }
  }
};
