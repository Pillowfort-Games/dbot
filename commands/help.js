module.exports = {
    name: 'Help',
    description: 'Show all commands.',
    hide: true,
    perms: [],
    args: false,
    async execute(message, args) {
        const { queue } = await import('../sublist.mjs');
        let active = queue.find(queue => queue.active === true);
        if (active) {
            
        }
    }
}