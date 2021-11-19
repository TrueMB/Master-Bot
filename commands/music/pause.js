const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausiere einen Song'),
  execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('Bitte betrete zuerst einen Sprachkanal!');
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if (!player) {
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    }
    if (player.audioPlayer.state.status == AudioPlayerStatus.Paused) {
      return interaction.reply('Der Song ist bereits pausiert!');
    } else if (voiceChannel.id !== interaction.guild.me.voice.channel.id) {
      return interaction.reply(
        'Du musst im selben Sprachkanal wie der Bot sein.!'
      );
    }

    const success = player.audioPlayer.pause();

    if (success) {
      return interaction.reply(
        ':pause_button: Der Song wurd pausiert. Nutze den /resume Command zum fortsetzen.'
      );
    } else {
      return interaction.reply(
        'Konnte den Song nicht pausieren. Bitte versuche es später erneut.'
      );
    }
  }
};
