const { SlashCommandBuilder } = require('@discordjs/builders');
const Guild = require('../../utils/models/Guild');
const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-welcome-message')
    .setDescription('Set the server welcome message')
    .addChannelOption(option =>
      option
        .setName('welcome-channel')
        .setDescription('Kanal indem die Nachricht gepostet werden soll')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('embed-title')
        .setDescription('Wie soll der Titel lauten?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('top-image-text')
        .setDescription('Was soll über dem Bild stehen?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('bottom-image-text')
        .setDescription('Was soll unter dem Bild stehen?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('wallpaper-path')
        .setDescription('Wo liegt das Willkommens Bild?')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('image-width')
        .setDescription('Was für eine Bildbreite soll eingestellt werden?')
    )
    .addIntegerOption(option =>
      option
        .setName('image-height')
        .setDescription('Was für eine Bildhöhe soll eingestellt werden?')
    ),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId)
	  return interaction.reply(':x: Der Command ist nur für den Server Besitzer!');

    const channel = interaction.options.get('welcome-channel');
    const title = interaction.options.get('embed-title').value;
    const topImageText = interaction.options.get('top-image-text').value;
    const bottomImageText = interaction.options.get('bottom-image-text').value;
    const wallpaperUrl = interaction.options.get('wallpaper-path').value;
    const imageWidth = interaction.options.get('image-width') === null ? 700 : interaction.options.get('image-width').value;
    const imageHeight = interaction.options.get('image-height') === null ? 250 : interaction.options.get('image-height').value;

    if (channel.channel.type !== 'GUILD_TEXT') {
      return interaction.reply('Der Kanal muss ein Text Kanal sein!');
    }

	Guild.findOneAndUpdate({
      guildId: interaction.guild.id
    },
	{
      destination: channel.channel.id,
      embedTitle: title,
      topImageText: topImageText,
      bottomImageText: bottomImageText,
      wallpaperURL: wallpaperUrl,
      imageWidth: imageWidth,
      imageHeight: imageHeight
    },
	{
	  new: true, upsert: true
	},
	(error, data) => {
      if(error){
        console.log(error);
        return interaction.reply('Es ist etwas schief gelaufen!');
	  }
    });

    const avatarLink = `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png`
	const embed = new MessageEmbed()
      .setColor('#420626')
      .setTitle(`:white_check_mark: Willkommens Nachricht wurde gespeichert!`)
      .setDescription(
        'Mit /show-welcome-message kannst du eine Test Nachricht ausgeben!'
      )
      .addField('Message Destination', channel.name)
      .addField(`Title`, title)
      .addField(`Oberer Text`, topImageText)
      .addField(`Unterer Text`, bottomImageText)
      .addField(`Bild Größe`, imageWidth + ` X ` + imageHeight)
      .addField(`Bild Pfad`, wallpaperUrl)
      .setFooter(
        interaction.member.user.username,
		avatarLink
      )
      .setTimestamp();

    //Shows Local wallpaper when in Default
	try{
      if (wallpaperUrl.toLowerCase().includes('/home/master-bot/resources/welcome/')) {
        const attachment = new MessageAttachment(wallpaperUrl);
	    const picture = wallpaperUrl.replace(/^.*[\\\/]/, '');
        embed.setImage('attachment://' + picture);
        return interaction.reply({ embeds: [embed], files: [attachment] });
      }else{
        embed.setImage(wallpaperUrl);
        return interaction.reply({ embeds: [embed] });
	  }
	}catch(err){
	  console.log(err);
      return interaction.reply('Es ist etwas schief gelaufen!');
	}
  }
};
