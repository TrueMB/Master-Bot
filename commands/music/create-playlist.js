const { SlashCommandBuilder } = require('@discordjs/builders');
const Member = require('../../utils/models/Member');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-playlist')
    .setDescription('Erstelle eine Playlist und spiele sie jeder Zeit ab!')
    .addStringOption(option =>
      option
        .setName('playlistname')
        .setDescription(
          'Wie lautet der Name deiner Playlist?'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const playlistName = interaction.options.get('playlistname').value;
    // check if the user exists in the db
    const userData = await Member.findOne({
      memberId: interaction.member.id
    }).exec(); // a clone object
    if (!userData) {
      const userObject = {
        memberId: interaction.member.id,
        username: interaction.member.user.username,
        joinedAt: interaction.member.joinedAt,
        savedPlaylists: [{ name: playlistName, urls: [] }]
      };
      const user = new Member(userObject);
      user.save(function onErr(err) {
        if (err)
          return interaction.reply(
            'Es ist ein Fehler aufgetreten!'
          );
      });
      interaction.reply(`Es wurde eine neue Playlist: **${playlistName}** erstellt.`);
      return;
    }
    // make sure the playlist name isn't a duplicate
    if (
      userData.savedPlaylists.filter(function searchForDuplicate(playlist) {
        return playlist.name == playlistName;
      }).length > 0
    ) {
      interaction.reply(
        `Es existiert bereits eine Playlist mit dem Namen: **${playlistName}**!`
      );
      return;
    }

    // create and save the playlist in the DB
    userData.savedPlaylists.push({ name: playlistName, urls: [] });
    try {
      await Member.updateOne({ memberId: interaction.member.id }, userData);
      interaction.reply(`Es wurde eine neue Playlist: **${playlistName}** erstellt.`);
    } catch (e) {
      console.error(e);
      return interaction.reply(
          'Es ist ein Fehler aufgetreten!'
      );
    }
  }
};
