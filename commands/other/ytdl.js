const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ytdl')
    .setDescription('Downloade Youtube Videos.')
    .addStringOption(option =>
      option
        .setName('link')
        .setDescription('Welches Video soll ich herunterladen?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('format')
        .setDescription('In welchem Format soll heruntergeladen werden?')
		.addChoice('MP3', 'mp3')
	    .addChoice('MP4', 'mp4')
    ),
  async execute(interaction) {
      let owner = await interaction.guild.fetchOwner();
      if(interaction.member != owner)
		 return interaction.reply(':x: Der Command ist nur für den Server Besitzer!');

      const link = interaction.options.get('link').value;
      const format = interaction.options.get('format') === null ? null : interaction.options.get('format').value;
	  var path = '/home/Master-Bot/downloads/'

      interaction.deferReply();

	  if(format == null || format.toLowerCase() === 'mp3'){

		 await ytdl.getInfo(link, { quality: 'highestaudio' })

		 .then(info => {

		  var stream = ytdl.downloadFromInfo(info, {
			quality: 'highestaudio'
		  });

		  var title = info.videoDetails.title.replace(/[^\w\s!?]/g,'');

		  ffmpeg(stream)
			.audioBitrate(160)
			.withAudioCodec("libmp3lame")
			.toFormat("mp3")
			.saveToFile(path + 'Music/' + title + '.mp3')
			.on("error", function(err) {
			  console.log('error', err)
			  return interaction.editReply(':x: Es ist ein Fehler aufgetreten!');
			})
			.on("end", function() {
			  return interaction.editReply('Dein Song wurde heruntergeladen! (' + info.videoDetails.title + ')');
			});
		 });
	  }else if(format.toLowerCase() === 'mp4'){

		 await ytdl.getInfo(link, { quality: 'highest' })

		 .then(info => {

		  var stream = ytdl.downloadFromInfo(info, {
			quality: 'highest'
		  });

		  var title = info.videoDetails.title.replace(/[^\w\s!?]/g,'');

		  ffmpeg(stream)
			.audioBitrate(160)
            .videoCodec('libx264')
			.withAudioCodec("libmp3lame")
			.toFormat("mp4")
			.saveToFile(path + 'Video/' + title + '.mp4')
			.on("error", function(err) {
			  console.log('error', err)
			  return interaction.editReply(':x: Es ist ein Fehler aufgetreten!');
			})
			.on("end", function() {
			  return interaction.editReply('Dein Video wurde heruntergeladen! (' + info.videoDetails.title + ')');
			});
		 });
	  }
  }
};
