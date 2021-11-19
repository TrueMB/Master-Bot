const { SlashCommandBuilder } = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('display-playlist')
    .setDescription('Zeigt eine Playlist an')
    .addStringOption(option =>
      option
        .setName('playlistname')
        .setDescription(
          'Welche Playlist möchtest du dir anzeigen lassen?'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    interaction.deferReply();
    const playlistName = interaction.options.get('playlistname').value;
    // check if user has playlists or if user is saved in the DB
    const userData = await Member.findOne({
      memberId: interaction.member.id
    }).exec();
    if (!userData) {
      interaction.followUp('Du hast keine Playlists!');
      return;
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if (savedPlaylistsClone.length == 0) {
      interaction.followUp('Du hast keine Playlists!');
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
      let urlsArrayClone = savedPlaylistsClone[location].urls;
      if (urlsArrayClone.length == 0) {
        interaction.followUp(`**${playlistName}** ist leer!`);
        return;
      }
      const savedPlaylistEmbed = new MessageEmbed()
        .setColor('#ff7373')
        .setTitle(playlistName)
        .setTimestamp();
      urlsArrayClone = urlsArrayClone.slice(0, 24);
      const fields = [];
      for (let i = 0; i < urlsArrayClone.length; i++) {
        fields.push({
          name: `${i + 1}`,
          value: `${urlsArrayClone[i].title}`
        });
      }
      savedPlaylistEmbed.setFields(fields);

      interaction.followUp({ embeds: [savedPlaylistEmbed] });
    } else {
      interaction.followUp(`Du besitzt keine Playlist mit dem Namen: ${playlistName}`);
    }
  }
};
