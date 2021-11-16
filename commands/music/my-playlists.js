const { SlashCommandBuilder } = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('my-playlists')
    .setDescription('Listet deine Playlists auf'),

  async execute(interaction) {
    interaction.deferReply();

    const userData = await Member.findOne({
      memberId: interaction.member.id
    }).exec();
    if (!userData) {
      interaction.followUp('Du besitzt keine Playlists!');
      return;
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if (savedPlaylistsClone.length == 0) {
      interaction.followUp('Du besitzt keine Playlists!');
      return;
    }
    const fields = [];
    savedPlaylistsClone.forEach((playlist, i) =>
      fields.push({ name: `${i + 1}`, value: playlist.name, inline: true })
    );

    const playlistsEmbed = new MessageEmbed()
      .setTitle('Deine Playlists:')
      .setFields(fields)
      .setTimestamp();

    interaction.followUp({ embeds: [playlistsEmbed] });
  }
};
