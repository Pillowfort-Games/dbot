const { Permissions } = require('discord.js');
module.exports = {
	name: 'Ping',
	description: 'Pong!',
	hide: true,
	perms: [Permissions.FLAGS.ADMINISTRATOR],
	args: false,
	execute(message, args) {
		message.reply('Boop!');
	}
};