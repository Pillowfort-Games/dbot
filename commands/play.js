const { raw } = require('youtube-dl-exec');
const ytdl = require('ytdl-core-discord');
const ytfps = require('ytfps');
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
        function play(message, type, uri) {
            return new Promise(async (resolve, reject) => {
                let sp;
                let list = queue.find(queue => queue.active === true);

                const channel = message.member.voice.channel;

                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });

                if (!sublist.get(message.guild.id)) {
                    sublist.set(message.guild.id, 'pending');
                    ytdl.getInfo(type === 1 ? args[0] : uri).then(info => {
                        queue.push({
                            active: true,
                            queued: [{
                                name: info.videoDetails.title,
                                url: type === 1 ? args[0] : uri,
                                requester: message.member.displayName
                            }]
                        })
                    });
                    message.channel.send('Starting Player...').then(msg => { sp = msg.id })
                } else {
                    if (list.queued.find(item => item.url === args[0]) || list.queued.find(item => item.url === uri)) {
                        return resolve(message.channel.send('Item already in queue.'));
                    } else {
                        ytdl.getInfo(type === 1 ? args[0] : uri).then(info => {
                            list.queued.push({
                                name: info.videoDetails.title,
                                url: type === 1 ? args[0] : uri,
                                requester: message.member.displayName
                            })
                            if(type !== 3) {
                                const embi = new MessageEmbed()
                                    .setColor('#A30DAC')
                                    .setDescription(`Added [${info.videoDetails.title}](${type === 1 ? args[0] : uri}) to the queue.`);
                                message.channel.send({ embeds: [embi] });
                            }
                        })
                        return resolve();
                    }
                };

                const player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Pause,
                    },
                });
                const resource = await createYTDLAudioResource(type === 1 ? args[0] : uri);

                resolve(player.play(resource));

                const subscription = connection.subscribe(player);
                sublist.set(message.guild.id, subscription);
                player.on('stateChange', async ( opstate, npstate ) => {
                    let list = queue.find(queue => queue.active === true);
                    if (npstate.status === AudioPlayerStatus.Playing && opstate.status != AudioPlayerStatus.Paused) {
                        if (sp) message.channel.messages.fetch(sp).then(oldmsg => { oldmsg.delete(); sp = null; });
                        const lm = message.channel.lastMessage;
                        const embi = new MessageEmbed()
                            .setColor('#A30DAC')
                            .setDescription(`Now Playing: [${list.queued[0].name}](${list.queued[0].url}) requested by ${list.queued[0].requester}`);
                                
                        list.queued.shift();
                        if (lm.author.id === '876492893873918003' && lm.embeds[0]) {
                            return resolve(lm.edit({ embeds: [embi] }));
                        } else {
                            return resolve(message.channel.send({ embeds: [embi] }));
                        }
                    } else if (npstate.status === AudioPlayerStatus.Idle && opstate.status !== AudioPlayerStatus.Idle) {
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
                    }
                })
            })
        };
        if(message.member.voice.channel && message.member.voice.channel.type === 'GUILD_VOICE' && check(args[0])) {
            if(args[0].includes('playlist')) {
                ytfps(args[0]).then(async content => {
                    for (const vid of content['videos']) {
                        await play(message, 3, vid.url);
                    }

                    const embi = new MessageEmbed()
                        .setColor('#A30DAC')
                        .setDescription(`Added ${content['video_count']} videos from [${content['title']}](${args[0]})`);
                            
                    message.channel.send({ embeds: [embi] });
                })
            } else {
                await play(message, 1);
            }
        } else if (!message.member.voice.channel) {
            message.channel.send('Please be in a voice channel to use this command.');
        } else if (message.member.voice.channel.type === 'GUILD_VOICE' && args[0].length >= 3 && !check(args[0])) {
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
                            .setCustomId(item.id)
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

                    msg.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 5000 }).then(async i => {
                        await play(message, 2, 'https://www.youtube.com/watch?v=' + i.customId);
                        msg.delete();
                    }).catch(e => {
                        console.log('Interaction timeout.');
                    });
                });
            });
        } else if (message.member.voice.channel.type === 'GUILD_VOICE' && !check(args[0])){
            message.channel.send('You didn\'t provide a valid youtube url.');
        }
    }
};