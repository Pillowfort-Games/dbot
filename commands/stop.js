const { MessageEmbed } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
module.exports = {
    name: 'Stop',
    description: 'Stop the player/clear the queue',
    hide: true,
    perms: [],
    args: false,
    async execute(message, args) {
        const { sublist, queue } = await import('../sublist.mjs');
        const connection = getVoiceConnection(message.guild.id);
        if(message.member.voice.channel.type === 'GUILD_VOICE' && connection) {
            const sub = sublist.get(message.guild.id);
            sub.player.stop();
            sub.unsubscribe();
            connection.disconnect();
            sublist.delete(message.guild.id);
            queue.length = 0;
            const embi = new MessageEmbed()
                .setColor('#A30DAC')
                .setTitle('Player has been stopped.');
            message.channel.send({ embeds: [embi] });
        }
    }
}