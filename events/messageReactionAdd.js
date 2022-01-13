const selfRoles = require('../selfRoles.json');
const {
	ReactionMessage,
	ReactionChannel
} = require('../config.json');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {

	if(reaction.message.id != ReactionMessage)
	    return;

    if (selfRoles[reaction.emoji.name] != null){

	    const selfRole = reaction.message.guild.roles.cache.find(
		    role => role.name === selfRoles[reaction.emoji.name]
		);

		if (!selfRole)
		    return console.error('Es ist ein Fehler mit den Self Roles aufgetreten.');

		var member = reaction.message.guild.members.cache.get(user.id);

		if (member.roles.cache.some(role => role.name === selfRole.name)) {
			member.roles.remove(selfRole);
			member.send(`Du hast dir die Gruppe ${selfRole.name} weggenommen!`).catch(error => {});
		}else{
			member.roles.add(selfRole);
			member.send(`Du hast dir die Gruppe ${selfRole.name} gegeben!`).catch(error => {});
		}
	}
	reaction.users.remove(user);
  }
};
