const { SlashCommandBuilder } = require('@discordjs/builders');
const Member = require('../../utils/models/Member');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-from-playlist')
    .setDescription('Entferne einen Song aus deiner Playlist')
    .addStringOption(option =>
      option
        .setName('playlist')
        .setDescription(
          'Von welcher Playlist möchtest du einen Song entfernen?'
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('index')
        .setDescription(
          'Welche Position hat der Song, den du entfernen möchtest?'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const playlistName = interaction.options.get('playlist').value;
    const index = interaction.options.get('index').value;

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
      const urlsArrayClone = savedPlaylistsClone[location].urls;
      if (urlsArrayClone.length == 0) {
        interaction.followUp(`**${playlistName}** is empty!`);
        return;
      }
      if (index > urlsArrayClone.length) {
        interaction.followUp(
          `Die genannte Position ist größer als die Playlist Größe.`
        );
        return;
      }
      const title = urlsArrayClone[index - 1].title;
      urlsArrayClone.splice(index - 1, 1);
      savedPlaylistsClone[location].urls = urlsArrayClone;
      Member.updateOne(
        { memberId: interaction.member.id },
        { savedPlaylists: savedPlaylistsClone }
      ).exec();

      interaction.followUp(
        `**${title}** wurde von **${savedPlaylistsClone[location].name}** entfernt.`
      );
      return;
    } else {
      return interaction.followUp(`Du besitzt keine Playlist mit dem Namen: ${playlistName}`);
    }
  }
};
