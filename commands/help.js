const { MessageEmbed } = require('discord.js');
const commands = new Map();
const fs = require('fs');

for (const file of fs.readdirSync('.').filter(file => file.endsWith('.js'))) {
    const command = require(`./${file}`);
    if (!command.hide) return commands.set(command.name.toLowerCase(), command.description);
};

module.exports = {
    name: 'Help',
    description: 'Show all commands.',
    hide: true,
    perms: [],
    args: false,
    async execute(message, args) {
        const embi = new MessageEmbed()
            .setColor('#A30DAC')
            .setDescription('Commands');

        commands.forEach((cname, cdescription) => {
            embi.addFields({ name: cname, value: cdescription });
        });

        message.channel.send({ embeds: [embi] });
    }
}