const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Überspringe den aktuellen Song!'),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('Bitte betrete einen Sprachkanal und versuche es dann erneut.');
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if (player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    } else if (voiceChannel.id !== interaction.guild.me.voice.channel.id) {
      return interaction.reply(
        'Du musst im gleichen Sprachkanal, wie der Bot sein!'
      );
    } else if (
      interaction.guild.client.guildData.get(interaction.guild.id)
        .isTriviaRunning
    ) {
      return interaction.reply(
        `Das Musik Quiz wird ohne '/' übersprungen! **skip**`
      );
    }
    interaction.reply(
      `**${interaction.client.playerManager.get(interaction.guildId).nowPlaying.title}** wurde übersprungen`
    );
    player.audioPlayer.stop();
  }
};
