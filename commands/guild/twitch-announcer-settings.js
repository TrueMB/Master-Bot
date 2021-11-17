const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const TwitchAPI = require('../../resources/twitch/twitch-api.js');
const Twitch = require('../../utils/models/Twitch');
const {
  twitchClientID,
  twitchClientSecret
} = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('twitch-announcer-settings')
    .setDescription('Kündigt Streams an')
    .addStringOption(option =>
      option
        .setName('twitchuser')
        .setDescription('Welchen Stream möchtest du ankündigen?')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('kanal')
        .setDescription('In welchem Kanal möchtest du den Stream ankündigen?')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('checkinterval')
        .setDescription('In welchem Kanal möchtest du den Stream ankündigen?')
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Ändere die Nachricht, die vor der Ankündigung steht.')
    ),
  execute(interaction) {

    let owner = await interaction.guild.fetchOwner();
    if(interaction.member != owner)
	  return interaction.reply(':x: Der Command ist nur für den Server Besitzer!');

    const twitchUser = interaction.options.get('twitchuser').value;
    const channel = interaction.options.get('kanal').value;
    const timer = interaction.options.get('checkinterval') === null ? 2 : interaction.options.get('checkinterval').value;
    const botMessage = interaction.options.get('message') === null ? "Hey @Twitch" : interaction.options.get('message').value;

    //Twitch Section
    const textFiltered = twitchUser.replace(/https\:\/\/twitch.tv\//g, '');
    try {
      var user = await TwitchAPI.getUserInfo(
        TwitchAPI.access_token,
        twitchClientID,
        textFiltered
      );
    } catch (exception) {
      interaction.reply(':x: ' + exception);
      return;
    }

  const twitchObject = {
      name: user.data[0].display_name,
      channelId: channel.id,
      channel: channel.name,
      message: botMessage,
      time: timer,
      savedName: interaction.member.nick,
      savedAvatar: interaction.member.avatar,
    };

    const embed = new MessageEmbed()
      .setAuthor(
        message.member.guild.name + ' Ankündigungs-Einstellungen',
        `https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png`,
        'https://twitch.tv/' + user.data[0].display_name
      )
      .setURL('https://twitch.tv/' + user.data[0].display_name)
      .setTitle(`Deine Einstellungen wurden gespeichert!`)
      .setDescription(
        'Denke daran  mit **/twitch-announcer** enable den Task zu aktivieren!'
      )
      .setColor('#6441A4')
      .setThumbnail(user.data[0].profile_image_url)
      .addField('Benachrichtigung', sayMsg)
      .addField(`Streamer`, user.data[0].display_name, true)
      .addField(`Kanal`, streamChannel.name, true)
      .addField(`Check Interval`, `***${timer}*** minute(s)`, true)
      .addField('Zuschauer:', user.data[0].view_count, true);
    if (user.data[0].broadcaster_type == '')
      embed.addField('Rang:', 'BASE!', true);
    else {
      embed
        .addField(
          'Rang:',
          user.data[0].broadcaster_type.toUpperCase() + '!',
          true
        )
        .setFooter(
          message.member.displayName,
          message.author.displayAvatarURL()
        )
        .setTimestamp();
    }

    //Send Response
    return interaction.reply({ embeds: [ embed ] });
  }
};
