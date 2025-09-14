module.exports = {
  apps: [
    {
      name: 'scraper-api',
      script: 'main.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart settings
      watch: false, // Disable in production
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',
      
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      
      // Environment variables
      env_file: '.env',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
    },
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-ec2-instance.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/scraper-layer.git',
      path: '/var/www/scraper-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
