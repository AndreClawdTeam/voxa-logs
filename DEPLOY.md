# DEPLOY.md — voxa-logs

## Configuração de Deploy

| Parâmetro | Valor |
|-----------|-------|
| **Porta** | `4000` |
| **URL** | http://138.197.19.184:4000/ |
| **Serviço systemd** | `voxa-logs.service` |
| **Usuário** | `clawdbot` |
| **Working dir** | `/home/clawdbot/.openclaw/workspace/coding/voxa-logs/` |
| **Auth** | Token em `.env` (`LOG_VIEWER_TOKEN`) |

## Serviço systemd

Arquivo: `/etc/systemd/system/voxa-logs.service`

```ini
[Unit]
Description=Voxa Logs — Real-time log viewer
After=network.target voxa-api.service

[Service]
Type=simple
User=clawdbot
WorkingDirectory=/home/clawdbot/.openclaw/workspace/coding/voxa-logs
EnvironmentFile=/home/clawdbot/.openclaw/workspace/coding/voxa-logs/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Comandos Úteis

```bash
# Status
systemctl status voxa-logs

# Logs do viewer em si
journalctl -u voxa-logs -f

# Restart
systemctl restart voxa-logs

# Atualizar código
cd /home/clawdbot/.openclaw/workspace/coding/voxa-logs
git pull
systemctl restart voxa-logs

# Health check
curl -s http://localhost:4000/health
```

## Trocar o Token

```bash
# 1. Editar o .env
nano /home/clawdbot/.openclaw/workspace/coding/voxa-logs/.env

# 2. Reiniciar o serviço
systemctl restart voxa-logs

# 3. Comunicar o novo token aos usuários autorizados
```

## Dependências na VPS

- **voxa-api.service** — a fonte dos logs; o viewer funciona mesmo sem ele, mas o stream fica vazio
- **Node.js >= 18** — instalado em `/usr/bin/node`
- **journalctl** — disponível nativamente no Ubuntu

## ⚠️ O que JAMAIS Fazer

1. **Commitar o `.env`** — contém o token de acesso
2. **Expor o token** em logs, URLs públicas ou mensagens
3. **Remover a validação de token** do endpoint `/events`
4. **Abrir outra porta** sem atualizar o `VPS.md`
5. **Rodar como root** sem necessidade explícita
