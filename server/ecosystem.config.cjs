// pm2 ecosystem file — TrackOS Server
// Usage :
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'trackos-server',
      script: './src/index.js',
      cwd: '/var/www/trackos-server',
      instances: 1,           // Socket.IO nécessite 1 instance (ou sticky sessions)
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/pm2/trackos-error.log',
      out_file: '/var/log/pm2/trackos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_memory_restart: '256M',
    },
  ],
};
