module.exports = {
    apps: [
        {
            name: 'bet-mentor-proxy',
            script: 'server/proxy.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
