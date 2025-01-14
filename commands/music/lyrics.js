const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { PagesBuilder } = require('discord.js-pages');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { geniusLyricsAPI } = require('../../config.json');

// Skips loading if not found in config.json
if (!geniusLyricsAPI) return;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription(
      'Bekomme die Lyrics von dem aktuellen Song oder einer definierten Suche'
    )
    .addStringOption(option =>
      option
        .setName('songname')
        .setDescription('Zu welchem Song möchtest du die Lyrics?')
    ),

  async execute(interaction) {
    interaction.deferReply();
    const player = interaction.client.playerManager.get(interaction.guildId);
    const guildData = interaction.client.guildData.get(interaction.guildId);
    let songName = interaction.options.get('songname');
    if (!songName) {
      if (!player)
        return interaction.followUp(
          'Es wird aktuell kein Song abgespielt. Bitte Suche nach einem oder starte einen Song.'
        );
      if (guildData) {
        if (guildData.triviaData.isTriviaRunning)
          return interaction.followUp(
            ':x: Bitte versuche es nach dem Musik Quiz erneut.'
          );
      }
      songName = player.nowPlaying.title;
    } else {
      songName = songName.value;
    }

    try {
      const url = await searchSong(cleanSongName(songName));
      const songPageURL = await getSongPageURL(url);
      const lyrics = await getLyrics(songPageURL);

      const lyricsIndex = Math.round(lyrics.length / 4096) + 1;
      const lyricsArray = [];

      for (let i = 1; i <= lyricsIndex; ++i) {
        let b = i - 1;
        if (lyrics.trim().slice(b * 4096, i * 4096).length !== 0) {
          lyricsArray.push(
            new MessageEmbed()
              .setTitle(`Lyrics Seite #` + i)
              .setDescription(lyrics.slice(b * 4096, i * 4096))
          );
        }
      }

      new PagesBuilder(interaction)
        .setTitle(`${songName} lyrics`)
        .setPages(lyricsArray)
        .setColor('#9096e6')
        .setURL(songPageURL)
        .setAuthor(
          interaction.member.user.username,
          interaction.member.user.displayAvatarURL()
        )
        .build();
    } catch (error) {
      console.error(error);
      return interaction.followUp(
         'Es ist ein Fehler aufgetreten!'
      );
    }
  }
};

function cleanSongName(songName) {
  return songName
    .replace(/ *\([^)]*\) */g, '')
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    );
}

function searchSong(query) {
  return new Promise(async function(resolve, reject) {
    const searchURL = `https://api.genius.com/search?q=${encodeURI(query)}`;
    const headers = {
      Authorization: `Bearer ${geniusLyricsAPI}`
    };
    try {
      const body = await fetch(searchURL, { headers });
      const result = await body.json();
      const songPath = result.response.hits[0].result.api_path;
      resolve(`https://api.genius.com${songPath}`);
    } catch (e) {
      reject(':x: Es wurde keinen passenden Song für die Suche gefunden.');
    }
  });
}

function getSongPageURL(url) {
  return new Promise(async function(resolve, reject) {
    const headers = {
      Authorization: `Bearer ${geniusLyricsAPI}`
    };
    try {
      const body = await fetch(url, { headers });
      const result = await body.json();
      if (!result.response.song.url) {
        reject(':x: There was a problem finding a URL for this song');
      } else {
        resolve(result.response.song.url);
      }
    } catch (e) {
      console.log(e);
      reject('There was a problem finding a URL for this song');
    }
  });
}

function getLyrics(url) {
  return new Promise(async function(resolve, reject) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const $ = cheerio.load(text);
      let lyrics = $('.lyrics')
        .text()
        .trim();
      if (!lyrics) {
        $('.Lyrics__Container-sc-1ynbvzw-8')
          .find('br')
          .replaceWith('\n');
        lyrics = $('.Lyrics__Container-sc-1ynbvzw-8').text();
        if (!lyrics) {
          reject(
            'There was a problem fetching lyrics for this song, please try again'
          );
        } else {
          resolve(lyrics.replace(/(\[.+\])/g, ''));
        }
      } else {
        resolve(lyrics.replace(/(\[.+\])/g, ''));
      }
    } catch (e) {
      console.log(e);
      reject(
        'There was a problem fetching lyrics for this song, please try again'
      );
    }
  });
}
