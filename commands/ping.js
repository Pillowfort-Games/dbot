module.exports = {
	name: 'Ping',
	description: 'Pong!',
	hide: true,
	perms: [],
	args: false,
	execute(message, args) {
		message.reply('Boop!');
	}
};