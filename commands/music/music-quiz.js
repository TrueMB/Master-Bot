const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const TriviaPlayer = require('../../utils/music/TriviaPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music-quiz')
    .setDescription('Starte ein Musik Quiz gegen deine Freunde!')
    .addStringOption(option =>
      option
        .setName('songs')
        .setDescription('Wie viele Songs sollen in dem Quiz sein?')
    )
    .addStringOption(option =>
      option
        .setName('kategorie')
        .setDescription('Welche Kategorie soll abgespielt werden?')
	    .addChoice('Anime', 'anime')
		.addChoice('Trap', 'trap')
	    .addChoice('Old', 'old')
    )
    .addIntegerOption(option =>
      option
        .setName('dauer')
        .setDescription('Wie lange soll ein Song gehen?')
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp(
        ':no_entry: Bitte betrete zuerst einen Sprachkanal!'
      );
    }

    if (interaction.client.playerManager.get(interaction.guildId)) {
      return interaction.followUp(
        `Diese Funktion ist während eines Songs nicht möglich!`
      );
    }

    if (interaction.client.triviaManager.get(interaction.guildId)) {
      return interaction.followUp('Es findet bereits ein Quiz statt!');
    }

    const numberOfSongs = interaction.options.get('songs')
      ? interaction.options.get('songs').value
      : 5;

    const lengthOfSongs = interaction.options.get('dauer')
      ? interaction.options.get('dauer').value
      : 30;

    const category = interaction.options.get('kategorie') === null ? "old" : interaction.options.get('kategorie').value;

    const jsonSongs = fs.readFileSync(
      '././resources/music/' + category + '.json',
      'utf8'
    );
    const videoDataArray = JSON.parse(jsonSongs).songs;
    // get random numberOfSongs videos from the array

    const randomLinks = getRandom(videoDataArray, numberOfSongs);
    interaction.client.triviaManager.set(
      interaction.guildId,
      new TriviaPlayer()
    );

    const triviaPlayer = interaction.client.triviaManager.get(
      interaction.guildId
    );

    randomLinks.forEach(link => {
      triviaPlayer.queue.push({
        url: link.url,
        singer: link.singer,
        title: link.title,
        length: lengthOfSongs,
        voiceChannel
      });
    });

    const membersInChannel = interaction.member.voice.channel.members;

    membersInChannel.each(user => {
      if (user.user.bot) return;
      triviaPlayer.score.set(user.user.username, 0);
    });

    // play and display embed that says trivia started and how many songs are going to be
    handleSubscription(interaction, triviaPlayer);
  }
};

async function handleSubscription(interaction, player) {
  const queue = player.queue;
  let voiceChannel = queue[0].voiceChannel;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  player.textChannel = interaction.channel;
  player.passConnection(connection);
  try {
    await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
  } catch (err) {
    console.error(err);
    await interaction.followUp({ content: 'Konnte deinem Channel nicht beitreten!' });
    return;
  }
  player.process(player.queue);

  const startTriviaEmbed = new MessageEmbed()
    .setColor('#ff7373')
    .setTitle(':notes: State Musik Quiz!')
    .setDescription(
      `:notes: Macht euch bereit! Es werden ${queue.length} Songs abgespielt und ihr habt ${queue[0].length} Sekunden
      um den Sänger/Band/Anime oder den Songnamen zu eraten. Viel Glück!
      Mit 'skip' könnt ihr einen Song überspringen.
      Das Quiz kann mit /end-quiz beendet werden!`
    );
  return interaction.followUp({ embeds: [startTriviaEmbed] });
}

function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError('getRandom: Die Anzahl ist zu groß!');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    // prettier-ignore
    result[n] = arr[(x in taken) ? taken[x] : x];
    // prettier-ignore
    taken[x] = (--len in taken) ? taken[len] : len;
    // prettier-ignore-end
  }
  return result;
}
