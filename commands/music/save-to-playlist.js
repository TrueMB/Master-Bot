const { SlashCommandBuilder } = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const YouTube = require('youtube-sr').default;
const { getData } = require('spotify-url-info');
const { searchOne } = require('../../utils/music/searchOne');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('save-to-playlist')
    .setDescription('Speichere einen Song oder Playlist in deine eigene Playlist')
    .addStringOption(option =>
      option
        .setName('playlistname')
        .setDescription('In welche Playlist soll gespeichert werden?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription(
          'Welchen Song oder Playlist möchtest du hinzufügen?'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const playlistName = interaction.options.get('playlistname').value;
    const url = interaction.options.get('url').value;

    const userData = await Member.findOne({
      memberId: interaction.member.id
    }).exec();
    if (!userData) {
      return interaction.followUp('Du besitzt keine Playlists!');
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if (savedPlaylistsClone.length == 0) {
      return interaction.followUp('Du besitzt keine Playlists!');
    }

    if (!validateURL(url)) {
      return interaction.followUp(
        'Bitte gib einen Korrekt YouTube oder Spotify Link ein!'
      );
    }

    let found = false;
    let location;
    for (let i = 0; i < savedPlaylistsClone.length; i++) {
      if (savedPlaylistsClone[i].name == playlistName) {
        found = true;
        location = i;
        break;
      }
    }
    if (found) {
      let urlsArrayClone = savedPlaylistsClone[location].urls;
      processURL(url, interaction).then(processedURL => {
        if (!processedURL) return;
        if (Array.isArray(processedURL)) {
          urlsArrayClone = urlsArrayClone.concat(processedURL);
          savedPlaylistsClone[location].urls = urlsArrayClone;
          interaction.followUp(
            'Deine genannte Playlist wurde gespeichert!'
          );
        } else {
          urlsArrayClone.push(processedURL);
          savedPlaylistsClone[location].urls = urlsArrayClone;
          interaction.followUp(
            `**${savedPlaylistsClone[location].urls[savedPlaylistsClone[location].urls.length - 1].title}**
            wurde zu **${playlistName}** gespeichert`
          );
        }
        Member.updateOne(
          { memberId: interaction.member.id },
          { savedPlaylists: savedPlaylistsClone }
        ).exec();
      });
    } else {
      return interaction.followUp(`Du besitzt keine Playlist mit dem Namen: ${playlistName}`);
    }
  }
};

function validateURL(url) {
  return (
    url.match(/^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/) ||
    url.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/) ||
    url.match(/^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/) ||
    url.match(/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/)
  );
}

function constructSongObj(video, user) {
  let duration = video.durationFormatted;
  return {
    url: `https://www.youtube.com/watch?v=${video.id}`,
    title: video.title,
    rawDuration: video.duration,
    duration,
    thumbnail: video.thumbnail.url,
    memberDisplayName: user.username,
    memberAvatar: user.avatarURL('webp', false, 16)
  };
}

async function processURL(url, interaction) {
  return new Promise(async function(resolve, reject) {
    if (isSpotifyURL(url)) {
      getData(url)
        .then(async data => {
          if (data.tracks) {
            const spotifyPlaylistItems = data.tracks.items;
            const urlsArr = [];
            for (let i = 0; i < spotifyPlaylistItems.length; i++) {
              try {
                const video = await searchOne(spotifyPlaylistItems[i].track);
                urlsArr.push(constructSongObj(video, interaction.member.user));
              } catch (error) {
                console.error(error);
              }
            }
            resolve(urlsArr);
          } else {
            const video = await searchOne(data);
            resolve(constructSongObj(video, interaction.member.user));
          }
        })
        .catch(err => console.error(err));
    } else if (
      url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)
    ) {
      const playlist = await YouTube.getPlaylist(url).catch(function() {
        reject(':x: Playlist ist Privat oder existiert nicht!');
      });
      let videosArr = await playlist.fetch();
      videosArr = videosArr.videos;
      let urlsArr = [];
      for (let i = 0; i < videosArr.length; i++) {
        if (videosArr[i].private) {
          continue;
        } else {
          const video = videosArr[i];
          urlsArr.push(constructSongObj(video, interaction.member.user));
        }
      }
      resolve(urlsArr);
    } else {
      const video = await YouTube.getVideo(url).catch(function() {
        reject(':x: Es gab ein Problem mit deinem genannten Link!');
      });
      if (video.live) {
        reject("Live Streams sind leider nicht möglich!");
      }
      resolve(constructSongObj(video, interaction.member.user));
    }
  });
}

var isSpotifyURL = arg =>
  arg.match(/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/);
