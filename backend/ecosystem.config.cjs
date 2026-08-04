// pm2 process config for the absensi backend.
// Secrets (JWT_SECRET) live in backend/.env (gitignored) and are loaded via
// Node's --env-file. Never hardcode secrets in this committed file.
module.exports = {
  apps: [
    {
      name: 'absensi-backend',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
        TZ: 'Asia/Jakarta',
        CORS_ORIGIN: 'https://absen.evrenhouse.online',
      },
    },
  ],
}
