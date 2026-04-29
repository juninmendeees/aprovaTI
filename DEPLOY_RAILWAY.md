# Deploy Seguro na Railway (AprovaTI)

Este guia cobre backend (Spring Boot) + frontend (Vite/React) com variáveis seguras.

## 1) Pré-requisitos
- Repositório no GitHub
- Conta Railway
- Banco MySQL (Railway plugin)

## 2) Estrutura recomendada na Railway
Crie **2 services** no mesmo projeto Railway:
1. `aprovati-api` (backend Spring Boot, raiz do repo)
2. `aprovati-web` (frontend Vite, pasta `web/`)

E 1 banco MySQL plugin.

## 3) Variáveis do backend (`aprovati-api`)
Configure em **Variables**:

- `DB_URL` = JDBC da Railway (ex: `jdbc:mysql://...`)
- `DB_USERNAME` = usuário do banco
- `DB_PASSWORD` = senha do banco
- `APP_JWT_SECRET` = segredo base64 forte (gerar com `openssl rand -base64 48`)
- `OPENAI_API_KEY` = sua chave OpenAI
- `APP_CORS_ALLOWED_ORIGINS` = URL pública do frontend Railway (ex: `https://aprovati-web.up.railway.app`)

### Cobrança / Stripe (se `APP_BILLING_ENABLED=true`)
- `APP_BILLING_ENABLED` = `true`
- `APP_BILLING_TRIAL_DAYS` = ex.: `7`
- `APP_BILLING_SUCCESS_URL` = `https://<seu-frontend>/app/minha-assinatura?checkout=success`
- `APP_BILLING_CANCEL_URL` = `https://<seu-frontend>/app/minha-assinatura?checkout=cancel`
- `APP_BILLING_PORTAL_RETURN_URL` = `https://<seu-frontend>/app/minha-assinatura`
- `STRIPE_SECRET_KEY` = chave secreta (modo live ou test)
- `STRIPE_WEBHOOK_SECRET` = segredo do endpoint de webhook (`whsec_...`); na Railway use a URL pública da API + path configurado no Stripe
- `STRIPE_PRICE_ESSENCIAL`, `STRIPE_PRICE_ESSENCIAL_ANUAL`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_ANUAL`, `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_PREMIUM_ANUAL` = IDs `price_...` do Stripe

O blog público (`/blog`) é servido pelo mesmo frontend; não exige variáveis extras.

### Bootstrap do admin (apenas 1 vez)
Para criar admin automaticamente no primeiro boot:
- `APP_ADMIN_BOOTSTRAP_ENABLED=true`
- `APP_ADMIN_EMAIL=juniormendesjp@gmail.com`
- `APP_ADMIN_NAME=Junior Mendes`
- `APP_ADMIN_PASSWORD=Mudar@123`

Depois que subir e confirmar login admin:
- altere `APP_ADMIN_BOOTSTRAP_ENABLED=false`
- remova `APP_ADMIN_PASSWORD` (recomendado)

## 4) Variáveis do frontend (`aprovati-web`)
- `VITE_API_BASE_URL` = URL pública do backend
  - exemplo: `https://aprovati-api.up.railway.app`

## 5) Build/Start commands

### Backend (`aprovati-api`)
Railway geralmente detecta Java automaticamente.
Se precisar forçar:
- Build: `./mvnw -DskipTests package`
- Start: `java -jar target/*.jar`

### Frontend (`aprovati-web`)
Defina **Root Directory** como `web`.
Comandos:
- Build: `npm ci && npm run build`
- Start: `npm run preview -- --host 0.0.0.0 --port $PORT`

## 6) Checklist de segurança antes de produção
- Nunca commitar `.env` com segredos
- Rotacionar qualquer chave exposta anteriormente
- Garantir `APP_JWT_SECRET` forte e única por ambiente
- Usar HTTPS (Railway já provê)
- Desativar bootstrap admin após criação

## 7) Teste pós-deploy
1. Acesse frontend público
2. Faça login admin (`juniormendesjp@gmail.com`)
3. Entre em `/app/admin/importacao`
4. Suba prova + gabarito PDF
5. Confira resumo: total importadas e por assunto

## 8) Troubleshooting rápido
- `401/403`: token inválido ou role não-admin
- `CORS error`: `APP_CORS_ALLOWED_ORIGINS` incorreto
- `DB connection`: variáveis `DB_*` erradas
- `OpenAI error`: `OPENAI_API_KEY` ausente/inválida
