const {
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
  createAudioResource,
  StreamType
} = require('@discordjs/voice');
const { setTimeout } = require('timers');
const ytdl = require('discord-ytdl-core');
const { MessageEmbed } = require('discord.js');
const { promisify } = require('util');
const wait = promisify(setTimeout);
const Member = require('../models/Member');

class TriviaPlayer {
  constructor() {
    this.connection = null;
    this.audioPlayer = createAudioPlayer();
    this.score = new Map();
    this.users = new Map();
    this.queue = [];
	this.queueMax = 0;
    this.textChannel;
    this.wasTriviaEndCalled = false;
  }

  passConnection(connection) {
    this.connection = connection;
    this.connection.on('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          try {
            await entersState(
              this.connection,
              VoiceConnectionStatus.Connecting,
              5000
            );
          } catch {
            this.connection.destroy();
          }
        } else if (this.connection.rejoinAttemps < 5) {
          await wait((this.connection.rejoinAttemps + 1) * 5000);
          this.connection.rejoin();
        } else {
          this.connection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        // when destroying connection (stop-trivia)
        this.stop();
      } else if (
        newState.status === VoiceConnectionStatus.Connecting ||
        newState.status === VoiceConnectionStatus.Signalling
      ) {
        try {
          await entersState(
            this.connection,
            VoiceConnectionStatus.Ready,
            20000
          );
        } catch {
          if (this.connection.state.status !== VoiceConnectionStatus.Destroyed)
            this.connection.destroy();
        }
      }
    });

    this.audioPlayer.on('stateChange', async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) { //Bot played song and goes in inactivity
        this.queue.shift();
        // Finished playing audio
        if (this.queue.length) {
          // play next song
          this.process(this.queue);
        } else {
          if (this.wasTriviaEndCalled) return;

          const sortedScoreMap = new Map(
            [...this.score.entries()].sort(function(a, b) {
              return b[1] - a[1];
            })
          );

          const usersArray = [...sortedScoreMap.entries()];

          // only save score if user was competing against someone
          if (usersArray.length > 1) {
            // fetch that users member id
            const collection = await this.textChannel.guild.members.search({
              query: usersArray[0][0],
              limit: 1
            });

            const user = collection.first();

            const essentials = {
              memberId: user.user.id,
              username: user.user.username,
              joinedAt: user.joinedAt
            };

            const userData = await Member.findOne({ memberId: user.id });

            if (!userData) {
              const userObject = {
                ...essentials,
                triviaAllTimeScore: usersArray[0][1]
              };

              const user = new Member(userObject);
              user.save();
            } else {
              await Member.findOneAndUpdate(
                { memberId: user.id },
                {
                  triviaAllTimeScore:
                    userData.triviaAllTimeScore + usersArray[0][1]
                }
              );
            }
          }

          const embed = new MessageEmbed()
            .setColor('#ff7373')
            .setTitle(`Musik Quiz Ergebnis:`)
            .setDescription(
              getLeaderBoard(Array.from(sortedScoreMap.entries()))
            );
          this.textChannel.send({ embeds: [embed] });

          // leave channel close connection and subscription
          if (this.connection._state.status !== 'destroyed') {
            this.connection.destroy();
            this.textChannel.client.triviaManager.delete(
              this.textChannel.guildId
            );
          }
        }
      } else if (newState.status === AudioPlayerStatus.Playing) { //BOT is currently playing a song
        // trivia logic
        let songNameFound = false;
        let songSingerFound = false;

        let skipCounter = 0;
        const skippedArray = [];

        const collector = this.textChannel.createMessageCollector({
          time: this.queue[0].length * 1000
        });

        collector.on('collect', msg => {
          if (!this.score.has(msg.author.username)) return;
          let guess = normalizeValue(msg.content);
          let title = normalizeValue(this.queue[0].title);
          let singer = normalizeValue(this.queue[0].singer);

          if (guess === 'skip') {
            if (skippedArray.includes(msg.author.username)) {
              return;
            }
            msg.react('☑');
            skippedArray.push(msg.author.username);
            skipCounter++;
            if (skipCounter > this.score.size * 0.6) {
              return collector.stop();
            }
            return;
          }

          // if user guessed both singer and song name
          if (guess.includes(singer) && guess.includes(title)) {
            if (
              (songSingerFound && !songNameFound) ||
              (songNameFound && !songSingerFound)
            ) {
              this.score.set(
                msg.author.username,
                this.score.get(msg.author.username) + 1
              );
              msg.react('☑');
              return collector.stop();
            }
            this.score.set(
              msg.author.username,
              this.score.get(msg.author.username) + 3
            );
            msg.react('☑');
            return collector.stop();
          }
          // if user guessed only the singer
          else if (guess.includes(singer)) {
            if (songSingerFound) return; // already been found
            songSingerFound = true;
            if (songNameFound && songSingerFound) {
              this.score.set(
                msg.author.username,
                this.score.get(msg.author.username) + 1
              );
              msg.react('☑');
              return collector.stop();
            }

            this.score.set(
              msg.author.username,
              this.score.get(msg.author.username) + 1
            );
            msg.react('☑');
          }
          // if user guessed song name
          else if (guess.includes(title)) {
            if (songNameFound) return; // if song name has already been found
            songNameFound = true;

            if (songNameFound && songSingerFound) {
              this.score.set(
                msg.author.username,
                this.score.get(msg.author.username) + 1
              );
              msg.react('☑');
              return collector.stop();
            }
            this.score.set(
              msg.author.username,
              this.score.get(msg.author.username) + 1
            );
            msg.react('☑');
          } else {
            // wrong answer
            return msg.react('❌');
          }
        });

        collector.on('end', () => {
          /*
            The reason for this if statement is that we don't want to get an
            empty embed returned via chat by the bot if end-trivia command was called
            */
          if (this.wasTriviaEndCalled) {
            this.wasTriviaEndCalled = false;
            return;
          }

          this.audioPlayer.stop();

          const sortedScoreMap = new Map(
            [...this.score.entries()].sort(function(a, b) {
              return b[1] - a[1];
            })
          );

          const song = `${capitalize_Words(
            this.queue[0].singer
          )}: ${capitalize_Words(this.queue[0].title)}`;

          const embed = new MessageEmbed()
            .setColor('#ff7373')
            .setTitle(`:musical_note: Der Song lautete:  ${song} (${this.queueMax - this.queue.length + 1}/${this.queueMax})`)
            .setDescription(
              getLeaderBoard(Array.from(sortedScoreMap.entries()))
            );

          this.textChannel.send({ embeds: [embed] });
          return;
        });
      }
    });

    this.audioPlayer.on('error', error => {
      if(typeof song === "undefined"){
         this.textChannel.send('Couldnt load the Song Data...');
	  }else{
		 console.error(error);
		 this.textChannel.send('Error with the video: ' + song.url + '\n' + song.singer + ' - ' + song.title);
	  }
    });

    this.connection.subscribe(this.audioPlayer);
  }

  stop() {
    this.queue.length = 0;
	this.queueMax = 0;
    this.audioPlayer.stop(true);
  }

  async process(queue) {
    const song = this.queue[0]; //Always first entry, since after the ending it gets shiftet away

    const randomStartTime = Math.floor(Math.random() * (120 - song.length + 1) /*+ songLength*/);
    try {
      const stream = ytdl(song.url, {
        //filter: 'audio',
        filter: 'audioonly',
        quality: 'highestaudio',
        fmt: 'mp3',
        //opusEncoded: true,
		seek: randomStartTime,
        highWaterMark: 1 << 25
      });
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary
      });
      this.audioPlayer.play(resource);
    } catch (err) {
		console.error(err);
      return this.process(queue);
    }
  }
}

var getLeaderBoard = arr => {
  if (!arr) return;
  if (!arr[0]) return; // issue #422
  let leaderBoard = '';

  leaderBoard = `👑   **${arr[0][0]}:** ${arr[0][1]}  Punkte`;

  if (arr.length > 1) {
    for (let i = 1; i < arr.length; i++) {
      leaderBoard =
        leaderBoard + `\n\n   ${i + 1}: ${arr[i][0]}: ${arr[i][1]}  Punkte`;
    }
  }
  return leaderBoard;
};

var capitalize_Words = str => {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

var normalizeValue = value =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^0-9a-zA-Z\s]/g, '') // remove non-alphanumeric characters
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase(); // remove duplicate spaces

module.exports = TriviaPlayer;
