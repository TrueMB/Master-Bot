const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

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
    ),
  execute(interaction, link, format) {

	  var path = '/home/Master-Bot/downloads/'

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
			  return interaction.reply(':x: Es ist ein Fehler aufgetreten!');
			})
			.on("end", function() {
			  return interaction.reply('Dein Song wurde heruntergeladen! (' + info.videoDetails.title + ')');
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
			  return interaction.reply(':x: Es ist ein Fehler aufgetreten!');
			})
			.on("end", function() {
			  return interaction.reply('Dein Video wurde heruntergeladen! (' + info.videoDetails.title + ')');
			});
		 });
	  }
  }
};
