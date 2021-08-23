const { getVoiceConnection, AudioPlayer, createAudioPlayer } = require('@discordjs/voice');

module.exports = {
	name: 'Pause',
	description: 'Pause playback',
	hide: false,
	perms: [],
	args: false,
	async execute(message, args) {
        const connection = getVoiceConnection(message.guild.id);
        const { sublist } = await import('../sublist.mjs');
        if(message.member.voice.channel.type === 'GUILD_VOICE' && connection) {
            const sub = sublist.get(message.guild.id);
            sub.player.pause();
			message.channel.send('Player was paused.');
        }
	}
};