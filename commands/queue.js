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
            
        }
    }
}