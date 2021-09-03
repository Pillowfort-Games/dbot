const lyricsParse = require('lyrics-parse');
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
            lyricsParse(queue.queued[0].name).then(async lyrics => {
                if (lyrics) {
                    const embi = new MessageEmbed()
                        .setColor('#A30DAC')
                        .setDescription(lyrics)
                        .setFooter('Provided by Google', 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png');
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