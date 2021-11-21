const Guild = require('../utils/models/Guild');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Canvas = require('canvas');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {

    const guildData = await Guild.findOne({ guildId: member.guild.id });

    if (!guildData) return

    if (!guildData.status) return;

    const channelId = guildData.destination;

    const channel = await member.guild.channels.fetch(channelId);

    if (!channel) return;

    var applyText = (canvas, text) => {
      const ctx = canvas.getContext('2d');
      let fontSize = 70;

      do {
        ctx.font = `${(fontSize -= 10)}px Open Sans Light`; // This needs to match the family Name on line 65
      } while (ctx.measureText(text).width > canvas.width - 300);

      return ctx.font;
    };

    // Customizable Welcome Image Options
    var canvas = await Canvas.createCanvas(
      guildData.imageWidth,
      guildData.imageHeight
    );
    var ctx = canvas.getContext('2d');

    // Background Image Options
    var background = await Canvas.loadImage(guildData.wallpaperURL);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Background Image Border Options
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Upper Text Options
    ctx.font = '26px Open Sans Light'; // if the font register changed this needs to match the family Name on line 65
    ctx.fillStyle = '#FFFFFF'; // Main Color of the Text on the top of the welcome image
    ctx.fillText(
      guildData.topImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `Welcome to ${member.guild.name}`),
      canvas.width / 2.5,
      canvas.height / 3.5
    );
    ctx.strokeStyle = `#FFFFFF`; // Secondary Color of Text on the top of welcome for depth/shadow the stroke is under the main color
    ctx.strokeText(
      guildData.topImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `Welcome to ${member.guild.name}`),
      canvas.width / 2.5,
      canvas.height / 3.5
    );

    //Lower Text Options
    ctx.font = '80px Open Sans Light';
    ctx.font = applyText(canvas, `${member.displayName}`);
    ctx.fillStyle = '#FF0000'; // Main Color for the members name for the welcome image
    ctx.fillText(
      guildData.bottomImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `${member.displayName}`),
      canvas.width / 2.5,
      canvas.height / 1.8
    );
    ctx.strokeStyle = `#000000`; // Secondary Color for the member name to add depth/shadow to the text
    ctx.strokeText(
      guildData.bottomImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `${member.displayName}`),
      canvas.width / 2.5,
      canvas.height / 1.8
    );

    // Avatar Shape Options
    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true); // Shape option (circle)
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(
      member.user.displayAvatarURL({
        format: 'jpg'
      })
    );
    ctx.drawImage(avatar, 25, 25, 200, 200);
    // Image is Built and Ready
    const attachment = new MessageAttachment(
      canvas.toBuffer(),
      'welcome-image.png'
    );

    // Welcome Embed Report
    var embed = new MessageEmbed()
      .setColor(`RANDOM`)
      .setImage('attachment://welcome-image.png')
      .setFooter(`Neuer Member!`)
      .setTimestamp()
      .setTitle(
        guildData.embedTitle
          .replace(/\{serverName\}/gi, member.guild.name)
          .replace(/\{memberName\}/gi, member.displayName)
          .replace(
            'default',
            `:speech_balloon: Hey ${member.displayName}, You look new to ${member.guild.name}!`
          )
      );

      await channel.send(`${member}`);
      await channel.send({ embeds : [embed], files: [attachment] });
  }
};
