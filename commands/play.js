const { raw } = require('youtube-dl-exec');
const ytdl = require('ytdl-core-discord');
const { MessageEmbed } = require('discord.js');
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

function check(url) {
    var youtube = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
    if(youtube.test(url)) return true
    return false
}

module.exports = {
	name: 'Play',
	description: 'Play a youtube video in voice channel',
	hide: false,
	perms: [],
	args: true,
	async execute(message, args) {
        const { sublist } = await import('../sublist.mjs');
        if(message.member.voice.channel && message.member.voice.channel.type === 'GUILD_VOICE' && check(args[0])) {
            let sp;
            const channel = message.member.voice.channel;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            if(!sublist.get(message.guild.id)) {
                message.channel.send('Starting Player...').then(msg => { sp = msg.id })
            } else {

            };

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
            const resource = await createYTDLAudioResource(args[0]);

            player.on(AudioPlayerStatus.Buffering, async playerstate => {
                await ytdl.getInfo(args[0]).then(info => {
                    message.channel.messages.fetch(sp).then(oldmsg => {
                        const embi = new MessageEmbed()
                            .setColor('#A30DAC')
                            .setDescription(`Now Playing: [${info.videoDetails.title}](${args[0]}) requested by ${message.member.displayName}`);

                        oldmsg.delete().then(msg => { message.channel.send({ embeds: [embi] }) });
                    });
                });
            });

            player.play(resource);

            const subscription = connection.subscribe(player);
            sublist.set(message.guild.id, subscription);
            player.on(AudioPlayerStatus.Idle, playerstate => {
                subscription.unsubscribe();
                connection.disconnect();
                sublist.delete(message.guild.id);
            })
        } else if(!message.member.voice.channel) {
            message.channel.send('Please be in a voice channel to use this command.');
        } else if(message.member.voice.channel.type === 'GUILD_VOICE' && !check(args[0])) {
            message.channel.send('You didn\'t provide a valid youtube url.');
        };
	}
};