# voxa-logs

Real-time log viewer for the Voxa API — streaming Pino JSON logs from `journald` via Server-Sent Events, with a clean dark terminal-inspired UI and token-based authentication.

## Features

- 🔴 Live streaming of `voxa-api` logs via SSE (Server-Sent Events)
- 🎨 Dark UI with color-coded log levels, HTTP methods, status codes, and response times
- 🔐 Token authentication (query param or `Authorization: Bearer` header)
- 🔍 Filter by log level: All / Info / Warn / Error / Debug
- 🔄 Auto-scroll with smart detection
- ♻️ Automatic reconnection with exponential backoff (1s → 2s → 4s → 8s, max 30s)
- 📦 Zero dependencies — pure Node.js + vanilla JS

## Access

URL: **http://138.197.19.184:4000/**

Authenticate with the token stored in `.env` (`LOG_VIEWER_TOKEN`).

## Running Locally

```bash
# 1. Copy the env file and set your token
cp .env.example .env
# Edit .env and set LOG_VIEWER_TOKEN to a secret value

# 2. Start the server
node server.js
# or for development with hot reload:
node --watch server.js
```

## Token Authentication

The token can be passed in two ways:

1. **Query string:** `http://localhost:4000/events?token=<TOKEN>`
2. **Header:** `Authorization: Bearer <TOKEN>`

The frontend stores the token in `localStorage` so you only need to enter it once per browser.

## Updating the Token

1. Edit `.env` on the server: `nano .env`
2. Restart the service: `systemctl restart voxa-logs`
3. Share the new token with authorized users

## Viewing Viewer Logs

```bash
journalctl -u voxa-logs -f
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Frontend UI |
| `GET /events?token=<TOKEN>` | SSE stream of logs |
| `GET /health` | Health check → `{"status":"ok"}` |
