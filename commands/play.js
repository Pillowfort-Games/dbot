const { raw } = require('youtube-dl-exec');
const { AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, demuxProbe } = require('@discordjs/voice');

function createYTDLAudioResource(url) {
    return new Promise((resolve, reject) => {
        const process = raw(
            url,
            {
                o: '-',
                q: '',
                f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                r: '100K',
            },
            { stdio: ['ignore', 'pipe', 'ignore'] },
        );
        if (!process.stdout) {
            reject(new Error('No stdout'));
            return;
        }
        const stream = process.stdout;
        const onError = (error) => {
            if (!process.killed) process.kill();
            stream.resume();
            reject(error);
        };
        process
            .once('spawn', () => {
                demuxProbe(stream)
                    .then((probe) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
                    .catch(onError);
            })
            .catch(onError);
    });
}

module.exports = {
	name: 'Play',
	description: 'Play a youtube video in voice channel',
	hide: false,
	perms: [],
	args: true,
	async execute(message, args) {
        const { sublist } = await import('../sublist.mjs');
        if(message.member.voice.channel.type === 'GUILD_VOICE') {

            const channel = message.member.voice.channel;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            const resource = await createYTDLAudioResource(args[0]);
            player.play(resource);
            message.channel.send('Now Playing: ' + args[0]);

            const subscription = connection.subscribe(player);
            sublist.set(message.guild.id, subscription);
            player.on(AudioPlayerStatus.Idle, playerstate => {
                subscription.unsubscribe();
                connection.disconnect();
            })
        }
	}
};