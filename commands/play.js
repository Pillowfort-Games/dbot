const { raw } = require('youtube-dl-exec');
const ytdl = require('ytdl-core-discord');
const ytsearch = require('@citoyasha/yt-search');
const emoji = require('node-emoji');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
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
            { stdio: ['ignore', 'pipe', 'ignore'] }
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
    if (youtube.test(url)) return true
    return false
}

module.exports = {
    name: 'Play',
    description: 'Play a youtube video in voice channel',
    hide: false,
    perms: [],
    args: true,
    async execute(message, args) {
        const { sublist, queue } = await import('../sublist.mjs');
        async function play(message, type, uri) {
            let sp;
            let list = queue.find(queue => queue.active === true);

            const channel = message.member.voice.channel;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            if (!sublist.get(message.guild.id)) {
                message.channel.send('Starting Player...').then(msg => { sp = msg.id })
            } else {
                if (list) {
                    if (list.queued.find(item => item.url === args[0]) || list.queued.find(item => item.url === uri)) {
                        return message.channel.send('Item already in queue.');
                    } else {
                        list.queued.push({
                            url: type === 1 ? args[0] : uri,
                            requester: message.member.displayName
                        })
                        return message.channel.send('Debug Message: Added New Item.');
                    }
                } else {
                    queue.push({
                        active: true,
                        queued: [{
                            url: type === 1 ? args[0] : uri,
                            requester: message.member.displayName 
                        }]
                    });
                    return message.channel.send('Debug Message: Added First Item.');
                }
            };

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
            const resource = await createYTDLAudioResource(type === 1 ? args[0] : uri);

            player.on(AudioPlayerStatus.Buffering, async playerstate => {
                let list = queue.find(queue => queue.active === true);
                if (!list) {
                    ytdl.getInfo(type === 1 ? args[0] : uri).then(info => {
                        message.channel.messages.fetch(sp).then(oldmsg => {
                            const embi = new MessageEmbed()
                                .setColor('#A30DAC')
                                .setDescription(`Now Playing: [${info.videoDetails.title}](${type === 1 ? args[0] : uri}) requested by ${message.member.displayName}`);

                            oldmsg.delete().then(msg => { message.channel.send({ embeds: [embi] }) });
                        });
                    });
                } else {
                    ytdl.getInfo(list.queued[0].url).then(info => {
                        const embi = new MessageEmbed()
                            .setColor('#A30DAC')
                            .setDescription(`Now Playing: [${info.videoDetails.title}](${list.queued[0].url}) requested by ${list.queued[0].requester}`);
                        
                        list.queued.shift();
                        return message.channel.send({ embeds: [embi] });
                    });
                }
            });

            player.play(resource);

            const subscription = connection.subscribe(player);
            sublist.set(message.guild.id, subscription);
            player.on(AudioPlayerStatus.Idle, async playerstate => {
                let list = queue.find(queue => queue.active === true);
                if (list) {
                    if (list.queued.length > 0) {
                        const resource = await createYTDLAudioResource(list.queued[0].url);
                        player.play(resource);
                    } else {
                        subscription.unsubscribe();
                        connection.disconnect();
                        sublist.delete(message.guild.id);
                        queue.length = 0;
                        message.channel.send('Finished Playing...');
                    };
                } else {
                    subscription.unsubscribe();
                    connection.disconnect();
                    sublist.delete(message.guild.id);
                    message.channel.send('Finished Playing...');
                }
            })
        };
        if(message.member.voice.channel && message.member.voice.channel.type === 'GUILD_VOICE' && check(args[0])) {
            play(message, 1);
        } else if (!message.member.voice.channel) {
            message.channel.send('Please be in a voice channel to use this command.');
        } else if (message.member.voice.channel.type === 'GUILD_VOICE' && args[0].length > 3 && !check(args[0])) {
            let searchstring = args.join(' ');

            // Searches Youtube for the 5 top video results according to the string.
            ytsearch.search(searchstring, 5).then(async results => {
                const embi = new MessageEmbed()
                    .setColor('#A30DAC')
                    .setDescription('Here are the top 5 results:');

                const row = new MessageActionRow();

                let num = 1;

                for (const item of results) {
                    embi.addFields({ name:  num + '. ' + item.title, value: 'https://youtu.be/' + item.id });
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(num + ': ' + item.id)
                            .setLabel(emoji.get(num === 1 ? 'one' : num === 2 ? 'two' : num === 3 ? 'three' : num === 4 ? 'four' : num === 5 ? 'five' : ''))
                            .setStyle('SECONDARY')
                    );
                    num++;
                };

                message.channel.send({ embeds: [embi], components: [row] }).then(msg => {
                    const filter = i => {
                        i.deferUpdate();
                        return i.user.id === message.author.id;
                    };
                    
                    msg.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 15000 }).then(i => {
                        let result = i.customId.split(': ')[1];
                        result = 'https://www.youtube.com/watch?v=' + result;
                        play(message, 2, result);
                        msg.delete();
                    });
                });
            });
        } else if (message.member.voice.channel.type === 'GUILD_VOICE' && !check(args[0])){
            message.channel.send('You didn\'t provide a valid youtube url.');
        }
    }
};