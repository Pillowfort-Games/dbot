const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	name: 'Resume',
	description: 'Resume playback',
	hide: false,
	perms: [],
	args: false,
	async execute(message, args) {
        const connection = getVoiceConnection(message.guild.id);
        const { sublist } = await import('../sublist.mjs');
        if(message.member.voice.channel.type === 'GUILD_VOICE' && connection) {
            const sub = sublist.get(message.guild.id);
            sub.player.unpause();
			message.channel.send('Player has been resumed.');
        }
	}
};