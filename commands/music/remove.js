const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Entferne einen Eintrag aus der Warteschlange')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Welche Position möchtest du aus der Warteschlange entfernen?')
        .setRequired(true)
    ),
  execute(interaction) {
    const position = interaction.options.get('position').value;
    const player = interaction.client.playerManager.get(interaction.guildId);

    if (!player) {
      return interaction.reply('Es wird aktuell nichts abgespielt.');
    }

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply(
        ':no_entry: Bitte betrete einen Sprachkanal und versuche es erneut!'
      );
    } else if (voiceChannel.id !== interaction.guild.me.voice.channel.id) {
      interaction.reply(
        `:no_entry: Du musst im gleichen Sprachkanal wie der Bot sein!`
      );
      return;
    }

    if (position < 1 || position > player.queue.length) {
      return interaction.reply('Bitte gib eine existierende Position an!');
    }

    player.queue.splice(position - 1, 1);
    return interaction.reply(
      `:wastebasket: Position ${position} wurde aus der Warteschlange entfernt!`
    );
  }
};
