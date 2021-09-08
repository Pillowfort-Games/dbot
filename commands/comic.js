const { MessageEmbed } = require('discord.js');
const bilibilicomics = require('bilibilicomics-api');
module.exports = {
    name: 'Comic',
    description: 'Search for comics on bilibilicomics.com',
    hide: false,
    perms: [],
    args: false,
    async execute(message, args) {
        bilibilicomics.Search(args.join(' ')).then(search => {
            const embi = new MessageEmbed()
                .setColor('#A30DAC')
                .setDescription(`By: ${search[0].authors.join(', ')} \n Genres: ${search[0].genres.join(', ')} \n [Open Comic](https://www.bilibilicomics.com/detail/mc${search[0].id})`)
                .setTitle(search[0].title)
                .setImage(search[0].hcover)
                .setFooter('Provided by BiliBiliComics', 'https://www.bilibilicomics.com/static/img/8e821bd00d01e.png');
            message.channel.send({ embeds: [embi] });
        })
    }
}