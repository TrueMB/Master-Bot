const { SlashCommandBuilder } = require('@discordjs/builders');
const Member = require('../../utils/models/Member');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-playlist')
    .setDescription('Entferne eine Playlist')
    .addStringOption(option =>
      option
        .setName('playlistname')
        .setDescription('Welche Playlist möchtest du entfernen?')
        .setRequired(true)
    ),
  async execute(interaction) {
    const playlistName = interaction.options.get('playlistname').value;
    // check if user has playlists or if user is saved in the DB
    const userData = await Member.findOne({
      memberId: interaction.member.id
    }).exec();

    if (!userData) {
      interaction.reply('Du besitzt keine Playlists!');
      return;
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if (savedPlaylistsClone.length == 0) {
      interaction.reply('Du besitzt keine Playlists!');
      return;
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
      savedPlaylistsClone.splice(location, 1);
      await Member.updateOne(
        { memberId: interaction.member.id },
        { savedPlaylists: savedPlaylistsClone }
      );
      interaction.reply(
        `**${playlistName}** wurde von deinen Playlists entfernt!`
      );
    } else {
      interaction.reply(`Du besitzt keine Playlist mit dem Namen: ${playlistName}`);
    }
  }
};
