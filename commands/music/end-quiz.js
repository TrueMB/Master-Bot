const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('end-quiz')
    .setDescription('Beende ein laufendes Musik Quiz'),
  execute(interaction) {
    const triviaPlayer = interaction.client.triviaManager.get(
      interaction.guildId
    );
    if (!triviaPlayer) {
      return interaction.reply(':x: Es läuft aktuell kein Musik Quiz!');
    }

    if (
      interaction.guild.me.voice.channel !== interaction.member.voice.channel
    ) {
      return interaction.reply(
        ':no_entry: Du bist in keinem Sprachkanal!'
      );
    }

    if (!triviaPlayer.score.has(interaction.member.user.username)) {
      return interaction.reply(
        ':stop_sign: Du musst an dem Quiz teilnehmen, um es beenden zu können.'
      );
    }
    triviaPlayer.queue.length = 0;
    triviaPlayer.wasTriviaEndCalled = true;
    triviaPlayer.score.clear();
    triviaPlayer.connection.destroy();
    interaction.client.triviaManager.delete(interaction.guildId);

    interaction.reply(
      'Das Musik Quiz wurde beendet.'
    );
  }
};
