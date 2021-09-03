const findLyrics = require('@j0r6it0/lyricsfinder');
const { MessageEmbed } = require('discord.js');
module.exports = {
    name: 'Lyrics',
    description: 'Show Lyrics of current song.',
    hide: false,
    perms: [],
    args: false,
    async execute(message, args) {
        const { queue } = await import('../sublist.mjs');
        let active = queue.find(queue => queue.active === true);
        if (active) {
            findLyrics(active.queued[0].name).then(async lyrics => {
                const lyric = lyrics;
                if (lyric) {
                    const embi = new MessageEmbed()
                        .setColor('#A30DAC')
                        .setDescription(lyric)
                        .setFooter('Provided by Genius', 'https://assets.genius.com/images/default-api-app-image.png');
                    message.channel.send({ embeds: [embi] });
                } else {
                    const embi = new MessageEmbed()
                        .setColor('#A30DAC')
                        .setDescription(`No Lyrics Found.`);
                    message.channel.send({ embeds: [embi] });
                }
            });
        }
    }
}