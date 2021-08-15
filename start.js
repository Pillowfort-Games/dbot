const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.commands = new Collection();

for (const file of fs.readdirSync('./commands').filter(file => file.endsWith('.js'))) {
    const command = require(`./commands/${file}`)

    client.commands.set(command.name.toLowerCase(), command)
}

client.on('ready', client => {
    console.log(`${client.user.username} has logged in.`);
});

client.on('messageCreate', async message => {
	if (!message.content.startsWith(process.env.prefix) || message.author.bot) return;
    const args = message.content.slice(process.env.prefix.length).trim().split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g);

    args.forEach((part, index) => {
        args[index] = args[index].replace(/([()[{}*+$^\\])/g, '');
        args[index] = args[index].replace(/"/g, '');
    });

    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;

    if (client.commands.get(command).args && !args.length) {
        if (client.commands.get(command).usage) return message.channel.send(`You didn't provide any arguments! Please provide the following argument or Follow the instructions:\n\n${rad.cmds.get(command).usage}`);

        return message.channel.send(`You didn't provide any arguments!`);
    };

    try {
        if (message.member.permissions.has(client.commands.get(command).perms)) {
            client.commands.get(command).execute(message, args);
        } else {
            throw new Error("Invalid Permissions");
        }
    } catch (e) {
        console.error(e);
    }
});

client.login(process.env.token);