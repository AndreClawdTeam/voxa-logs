# CLAUDE.md — voxa-logs

## Architecture

**Stack:** Node.js HTTP nativo + SSE + journalctl + HTML/CSS/JS vanilla  
**Zero dependências npm** — o projeto usa apenas módulos nativos do Node.js.

```
Client browser ──── GET /events?token=... ──── server.js ──── journalctl (spawn)
                          (SSE stream)                              │
                                                             voxa-api.service
                                                           (stdout JSON Pino)
```

### server.js

- `http.createServer` — servidor HTTP puro, sem Express ou qualquer framework
- `child_process.spawn('journalctl', [...])` — abre pipe com journalctl em modo `-f` (follow)
- Cada chunk do stdout do journalctl é dividido por `\n`, e cada linha é enviada como `data: <linha>\n\n` (formato SSE)
- Quando o cliente desconecta (`req.on('close')`), o processo journalctl é morto (`journal.kill()`)
- Token validado via query param `?token=<TOKEN>` ou header `Authorization: Bearer <TOKEN>`

### public/index.html

- Frontend completo em um único arquivo HTML
- `EventSource` API para receber SSE do `/events`
- Parse de JSON Pino com fallback para texto raw
- Token salvo em `localStorage`
- Reconexão automática com exponential backoff

## Auth

A única barreira de segurança é o `LOG_VIEWER_TOKEN`.

- Configurado via variável de ambiente `LOG_VIEWER_TOKEN` no `.env`
- Verificado em TODA requisição ao `/events` — sem exceções
- **Nunca remover a validação de token** — este endpoint expõe logs internos da API

## Adicionando Novos Serviços

Para monitorar outro serviço (ex: `voxa-web`), o approach recomendado é:

1. Adicionar um endpoint adicional, ex: `/events/voxa-web`
2. Duplicar a lógica de SSE com `journalctl -u voxa-web ...`
3. Ou aceitar um query param `?service=voxa-web` e validar contra uma whitelist de serviços permitidos

**Nunca** permitir que o cliente passe o nome do serviço sem validação — journalctl pode expor logs do sistema inteiro.

## Variáveis de Ambiente

| Var | Padrão | Descrição |
|-----|--------|-----------|
| `PORT` | `4000` | Porta de escuta |
| `LOG_VIEWER_TOKEN` | (obrigatório) | Token de acesso — qualquer string secreta |

## ⚠️ Avisos Importantes

1. **Nunca commitar `.env`** — o token é a única barreira de segurança
2. **Nunca expor o token** em logs, URLs compartilhadas ou código
3. **Nunca remover a validação de token** do endpoint `/events`
4. O journalctl pode exigir permissões de grupo `systemd-journal` — o usuário `clawdbot` já está no grupo
5. O serviço roda como `clawdbot` — não elevar para root sem necessidade
