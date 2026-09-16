# Relay online (Cloudflare free)

Chat + galeria entre redes, sem servidor próprio. Vídeos NÃO viajam (só metadados).

## 1. Conta (1 vez)

1. Crie a conta free em `dash.cloudflare.com/sign-up` (só email, sem cartão).
2. Neste terminal, na pasta `cloudflare/`:
   ```
   npx wrangler login
   ```

## 2. Recursos (1 vez)

```
npx wrangler r2 bucket create unicfilm-media
npx wrangler d1 create unicfilm-db
npx wrangler d1 execute unicfilm-db --file schema.sql
```

Copie o `database_id` mostrado e cole em `wrangler.toml` no lugar de `PREENCHER-D1-ID`.

## 3. Segredo da equipe (1 vez)

É o "PIN da internet": quem tiver o código entra no chat/galeria online.

```
npx wrangler secret put TEAM_SECRET
```

Digite um código forte (ex: `unicfilm-2026-xxxx`). Guarde para distribuir à equipe.

## 4. Publicar

```
npx wrangler deploy
```

Anote a URL, ex: `https://unicfilm-relay.sua-conta.workers.dev`.

## 5. Ligar no app

No app: Ferramentas → Rede Local → cartão **Online (Cloudflare)** → cole a URL do Worker + o código da equipe → Conectar.

## Limites do free (suficiente p/ 5 pessoas)

- Worker: 100 mil requisições/dia (cada conexão conta 1; mensagens não contam)
- R2: 10 GB de imagens, sem taxa de tráfego
- D1: 5 GB de histórico
