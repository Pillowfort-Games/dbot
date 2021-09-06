const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'Queue',
    description: 'Show Queued items.',
    hide: false,
    perms: [],
    args: false,
    async execute(message, args) {
        const { queue } = await import('../sublist.mjs');
        let active = queue.find(queue => queue.active === true);
        if (active) {
            let desc = '';
            const embi = new MessageEmbed()
                .setTitle('Next 5 videos in queue')
                .setColor('#A30DAC');
            const embi2 = new MessageEmbed()
                .setTitle('Currently Playing')
                .setColor('#169E54');

            for (let num = 0; num != 6; num++) {
                if (num === 0) {
                    embi2.setDescription(`[${active.queued[num].name}](${active.queued[num].url})\nRequested by ${active.queued[num].requester}`);
                } else if(num !== 0 && active.queued.length > 1 && active.queued[num]) {
                    desc += `${num}. [${active.queued[num].name}](${active.queued[num].url})\nRequested by ${active.queued[num].requester}\n\n`;
                }
            }
            embi.setDescription(desc);
            message.channel.send({ embeds: [embi2] });
            active.queued.length > 1 ? message.channel.send({ embeds: [embi] }) : '';
        }
    }
}