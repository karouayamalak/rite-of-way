/**
 * PM2 Cluster Configuration for Rite of Way API
 *
 * Usage (after building):
 *   npm run build
 *   pm2 start pm2.config.js
 *   pm2 save          (persist across reboots)
 *   pm2 startup       (auto-start on OS boot)
 *
 * Useful pm2 commands:
 *   pm2 list          - see all running processes
 *   pm2 logs          - tail logs from all workers
 *   pm2 reload all    - zero-downtime rolling restart
 *   pm2 stop all      - stop all workers gracefully
 *   pm2 delete all    - remove from pm2 registry
 */

module.exports = {
  apps: [
    {
      name: 'rite-of-way-api',
      script: './dist/index.js',

      // Cluster mode: spawns one process per CPU core.
      // Node.js single-threaded model means this is the correct way to use all cores.
      instances: 'max',
      exec_mode: 'cluster',

      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Memory limit per worker — restart if it exceeds 512mb (likely a leak).
      max_memory_restart: '512M',

      // Graceful shutdown: give in-flight requests 10s to complete before killing.
      kill_timeout: 10000,

      // Wait 3s before declaring a restart as failed (avoids crash loops on startup errors).
      min_uptime: 3000,

      // Auto-restart up to 10 times before giving up (prevents runaway restart loops).
      max_restarts: 10,

      // Merge all worker logs into a single stream for easier debugging.
      merge_logs: true,

      // Log file paths
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
