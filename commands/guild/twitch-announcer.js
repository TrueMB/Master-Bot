const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const TwitchAPI = require('../../resources/twitch/twitch-api.js');
const Twitch = require('../../utils/models/Twitch');
const probe = require('probe-image-size');
const Canvas = require('canvas');
const {
  twitchClientID,
  twitchClientSecret
} = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('twitch-announcer')
    .setDescription('Kündigt Streams an')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Was möchstest du mit dem Twitch Ankündiger machen?')
	    .addChoice('Enable', 'enable')
		.addChoice('Disable', 'disable')
	    .addChoice('Check', 'check')
        .setRequired(true)
	)
    .addStringOption(option =>
      option
        .setName('twitchuser')
        .setDescription('Welchen Twitch User möchtest du ankündigen?')
        .setRequired(true)
    ),
  async execute(interaction) {

    let owner = await interaction.guild.fetchOwner();
    if(interaction.member != owner)
	  return interaction.reply(':x: Der Command ist nur für den Server Besitzer!');

    const twitchUser = interaction.options.get('twitchuser').value;
    const status = interaction.options.get('status').value;

    // Grab the Entry from the Database
    const twitchData = await Twitch.findOne({
       guildId: interaction.guild.id,
       name: twitchUser
    }).exec();

    var embedID;
    let currentGame;

    // Error Missing DB
    if (twitchData == undefined) {
      interaction.reply(
        ':no_entry: Es wurden keine Einstellungen gefunden. Bitte mach zuerst **/twitch-announcer-settings**`'
      );
      return;
    }
    interaction.deferReply();
    try {
      var user = await TwitchAPI.getUserInfo(
        TwitchAPI.access_token,
        twitchClientID,
        `${twitchData.name}`
      );
    } catch (e) {
      interaction.followUp(':x: ' + e);
      return;
    }

    // Enable Embed
    const enabledEmbed = new MessageEmbed()
      .setAuthor(
        interaction.member.guild.name + ' Ankündigungs-Einstellungen',
        `https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png`,
        'https://twitch.tv/' + user.data[0].display_name
      )
      .setTitle(`:white_check_mark: Twitch Ankündigungen aktiviert!`)
      .setColor('#6441A4')
      .setThumbnail(user.data[0].profile_image_url)
      .addField('Benachrichtigung', `${twitchData.message}`)
      .addField(`Streamer`, `${twitchData.name}`, true)
      .addField(`Channel`, `${twitchData.channel}`, true)
      .addField(`Check Interval`, `***${twitchData.timer}*** Minute(n)`, true)
      .addField('Zuschauer Anzahl:', user.data[0].view_count + '', true);
    if (user.data[0].broadcaster_type == '')
      enabledEmbed.addField('Rang:', 'BASE!', true);
    else {
      enabledEmbed
        .addField(
          'Rang:',
          user.data[0].broadcaster_type.toUpperCase() + '!',
          true
        )
        .setFooter(
           twitchData.savedName,
           twitchData.avatarLink
        )
        .setTimestamp(twitchData.date);
    }

    // Disable Embed
    const disabledEmbed = new MessageEmbed()
      .setAuthor(
        interaction.member.guild.name + ' Ankündigungs-Einstellungen',
        `https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png`,
        'https://twitch.tv/' + user.data[0].display_name
      )
      .setTitle(`:x: Twitch Announcer Disabled!`)
      .setColor('#6441A4')
      .setThumbnail(user.data[0].profile_image_url)
      .addField('Benachrichtigung', `${twitchData.message}`)
      .addField(`Streamer`, `${twitchData.name}`, true)
      .addField(`Channel`, `${twitchData.channel}`, true)
      .addField(`Check Interval`, `***${twitchData.timer}*** Minute(n)`, true)
      .addField('Zuschauer Anzahl:', user.data[0].view_count + '', true);
    if (user.data[0].broadcaster_type == '')
      disabledEmbed.addField('Rang:', 'BASE!', true);
    else {
      disabledEmbed
        .addField(
          'Rang:',
          user.data[0].broadcaster_type.toUpperCase() + '!',
          true
        )
        .setFooter(twitchData.savedName, twitchData.savedAvatar)
        .setTimestamp(twitchData.date);
    }

    // Check Twitch Announcer Status
    if (status == 'check') {
      if (interaction.client.twitchData.isRunning) {
        interaction.followUp({ embeds: [enabledEmbed] });
      } else {
        interaction.followUp({ embeds: [disabledEmbed] });
      }
      return;
    }

    // Enable Twitch Announcer
    if (status == 'enable') {
      if (interaction.client.twitchData.isRunning == false) {
        var failedAttempts = 0;
        interaction.client.twitchData.isRunning = true;
        interaction.client.twitchData.Interval = setInterval(async function() {
          const announcedChannel = interaction.guild.channels.cache.find(
            channel => channel.id == twitchData.channelId
          );

          try {
            var streamInfo = await TwitchAPI.getStream(
              TwitchAPI.access_token,
              twitchClientID,
              user.data[0].id
            );
          } catch (e) {
            ++failedAttempts;
            if (failedAttempts == 5) {
              interaction.client.twitchData.isRunning = false;
              interaction.client.twitchData.Interval = clearInterval(
                interaction.client.twitchData.Interval
              );
              interaction.followUp(':x: Twitch Ankündiger wurde aufgrund eines Fehlers gestoppt.\n' + e);
            }
            return;
          }

          // Set Status to Offline
          if (
            !streamInfo.data[0] &&
            interaction.client.twitchData.embedStatus == 'sent'
          ) {
            interaction.client.twitchData.embedStatus = 'offline';
          }
          // Set Status To Online
          if (
            interaction.client.twitchData.embedStatus != 'sent' &&
            streamInfo.data[0]
          ) {
            interaction.client.twitchData.embedStatus = 'online';
          }

          // Online Status
          if (interaction.client.twitchData.embedStatus == 'online') {
            currentGame = streamInfo.data[0].game_name;

            try {
              user = await TwitchAPI.getUserInfo(
                TwitchAPI.access_token,
                twitchClientID,
                `${twitchData.name}`
              );
            } catch (e) {
              ++failedAttempts;
              if (failedAttempts == 5) {
                interaction.client.twitchData.isRunning = false;
                interaction.client.twitchData.Interval = clearInterval(
                  interaction.client.twitchData.Interval
                );
                interaction.followUp(':x: Twitch Ankündiger wurde aufgrund eines Fehlers gestoppt.\n' + e);
              }
              return;
            }

            try {
              var gameInfo = await TwitchAPI.getGames(
                TwitchAPI.access_token,
                twitchClientID,
                streamInfo.data[0].game_id
              );

              var result = await probe(
                gameInfo.data[0].box_art_url.replace(/-{width}x{height}/g, '')
              );
              var canvas = Canvas.createCanvas(result.width, result.height);
              var ctx = canvas.getContext('2d');
              // Since the image takes time to load, you should await it
              var background = await Canvas.loadImage(
                gameInfo.data[0].box_art_url.replace(/-{width}x{height}/g, '')
              );
              // This uses the canvas dimensions to stretch the image onto the entire canvas
              ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
              // Use helpful Attachment class structure to process the file for you
              var attachment = new MessageAttachment(
                canvas.toBuffer(),
                'box_art.png'
              );
            } catch (e) {
              ++failedAttempts;
              if (failedAttempts == 5) {
                interaction.client.twitchData.isRunning = false;
                interaction.client.twitchData.Interval = clearInterval(
                  interaction.client.twitchData.Interval
                );
                interaction.followUp(':x: Twitch Ankündiger wurde aufgrund eines Fehlers gestoppt.\n' + e);
              }
              return;
            }

            // Online Embed
            const onlineEmbed = new MessageEmbed()
              .setAuthor(
                `Twitch Ankündigung: ${user.data[0].display_name} ist Online!`,
                user.data[0].profile_image_url,
                'https://twitch.tv/' + user.data[0].display_name
              )
              .setURL('https://twitch.tv/' + user.data[0].display_name)
              .setTitle(
                user.data[0].display_name + ' spielt ' + currentGame
              )
              .addField('Stream Titel:', streamInfo.data[0].title)
              .addField('Spiel:', streamInfo.data[0].game_name, true)
              .addField('Zuschauer:', streamInfo.data[0].viewer_count + '', true)
              .setColor('#6441A4')
              .setFooter(
                'Stream gestartet',
                'https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png' // Official icon link from Twitch.tv
              )
              .setImage(
                streamInfo.data[0].thumbnail_url
                  .replace(/{width}x{height}/g, '1280x720')
                  .concat('?r=' + Math.floor(Math.random() * 10000 + 1)) // to ensure the image updates when refreshed
              )
              .setTimestamp(streamInfo.data[0].started_at)
              //.attachFiles(attachment)
              .setThumbnail('attachment://box_art.png');

            if (user.data[0].broadcaster_type == '')
              onlineEmbed.addField('Rang:', 'BASE!', true);
            else {
              onlineEmbed.addField(
                'Rang:',
                user.data[0].broadcaster_type.toUpperCase() + '!',
                true
              );
            }

            // Online Send
            try {
              if (twitchData.message.toLowerCase() != 'none') {
                await announcedChannel.send(twitchData.message),
                  await announcedChannel.send( { embeds: [onlineEmbed], files: [attachment] }).then(result => {
                    embedID = result.id;
                  });
              } else {
                await announcedChannel.send( { embeds: [onlineEmbed], files: [attachment] }).then(result => {
                  embedID = result.id;
                });
              }
            } catch (error) {
              ++failedAttempts;
              if (failedAttempts == 5) {
                interaction.followUp(':x: Konnte keine Nachricht geschickt werden.');
                console.log(error);
                interaction.client.twitchData.isRunning = false;
                interaction.client.twitchData.Interval = clearInterval(
                  interaction.client.twitchData.Interval
                );
              }
              return;
            }
            // Change Embed Status
            interaction.client.twitchData.embedStatus = 'sent';
          }

          // Offline Status
          if (interaction.client.twitchData.embedStatus == 'offline') {
            try {
              user = await TwitchAPI.getUserInfo(
                TwitchAPI.access_token,
                twitchClientID,
                `${twitchData.name}`
              );
            } catch (e) {
              ++failedAttempts;
              if (failedAttempts == 5) {
                interaction.client.twitchData.isRunning = false;
                interaction.client.twitchData.Interval = clearInterval(
                  interaction.client.twitchData.Interval
                );
                interaction.followUp(':x: Twitch Ankündiger wurde aufgrund eines Fehlers gestoppt.\n' + e);
              }
              return;
            }

            const offlineEmbed = new MessageEmbed()
              .setAuthor(
                `Twitch Ankündigung: ${user.data[0].display_name} ist Offline`,
                user.data[0].profile_image_url,
                'https://twitch.tv/' + user.data[0].display_name
              )
              .setTitle(
                user.data[0].display_name + ' hat ' + currentGame + ' gespielt'
              )
              .setColor('#6441A4')
              .setTimestamp()
              .setFooter(
                'Stream beendet',
                'https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png'
              )
              .setThumbnail('attachment://box_art.png');

            // Incase the there is no Profile Description
            if (!user.data[0].description == '') {
              offlineEmbed.addField(
                'Profil Beschreibung:',
                user.data[0].description
              );
            }
            offlineEmbed.addField(
              'Zuschauer Anzahl:',
              user.data[0].view_count + '',
              true
            );
            if (user.data[0].broadcaster_type == '')
              offlineEmbed.addField('Rang:', 'BASE!', true);
            else {
              offlineEmbed.addField(
                'Rang:',
                user.data[0].broadcaster_type.toUpperCase() + '!',
                true
              );
            }

            // Offline Edit
            try {
              await announcedChannel.messages
                .fetch({
                  around: embedID,
                  limit: 1
                })
                .then(msg => {
                  const fetchedMsg = msg.first();
                  fetchedMsg.edit( {embeds: [offlineEmbed]} );
                });
            } catch (error) {
              ++failedAttempts;
              if (failedAttempts == 5) {
                interaction.followUp(':x: Konnte Nachricht nicht bearbeiten');
                console.log(error);
                interaction.client.twitchData.isRunning = false;
                interaction.client.twitchData.Interval = clearInterval(
                  interaction.client.twitchData.Interval
                );
              }
              return;
            }
            // Change Embed Status
            interaction.client.twitchData.embedStatus = 'end';
          }
          // Reset Fail Counter
          failedAttempts = 0;
        }, twitchData.timer * 60000); //setInterval() is in MS and needs to be converted to minutes
      }
      interaction.followUp({ embeds: [enabledEmbed] });
      return;
    }

    // Disable Twitch Announcer
    if (status == 'disable') {
      interaction.client.twitchData.isRunning = false;
      interaction.client.twitchData.Interval = clearInterval(
        interaction.client.twitchData.Interval
      );
      interaction.followUp({ embeds: [disabledEmbed] });
      return;
    }
  }
};