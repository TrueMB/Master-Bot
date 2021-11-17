const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Verlässt den Sprachkanal'),
  execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('Ich bin in keinem Sprachkanal! :(');
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if (!player) { //ERGIBT DIESE ABFRAGE SINN?  - BOT KANN PAUSIERT SEIN
      return interaction.reply('Es wird aktuell kein Song abgespielt!');
    } else if (voiceChannel.id !== interaction.guild.me.voice.channel.id) {
      return interaction.reply(
        'Du musst im gleichen Sprachkanal sein, um diesen Command ausführen zu können!'
      );
    }

    player.connection.destroy();
    interaction.client.playerManager.delete(interaction.guildId);
    return interaction.reply('Bye bye! :(');
  }
};
