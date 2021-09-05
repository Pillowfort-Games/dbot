const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'Help',
    description: 'Show all commands.',
    hide: true,
    perms: [],
    args: false,
    async execute(message, args) {
        const commands = new Map();

        for (const file of fs.readdirSync('./commands').filter(file => file.endsWith('.js'))) {
            const command = require(`./${file}`);
            if (!command.hide) commands.set(command.name.toLowerCase(), command.description);
        };

        const embi = new MessageEmbed()
            .setColor('#A30DAC')
            .setDescription('Commands');

        commands.forEach((cdescription, cname) => {
            embi.addFields({ name: `p!${cname}`, value: cdescription });
        });

        message.channel.send({ embeds: [embi] });
    }
}