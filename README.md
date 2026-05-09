# App Hub

個人用WebアプリやPWAをまとめる、深海ラウンジ風のプライベートアプリランチャーです。

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- Neon PostgreSQL
- Vercel

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

`.env` には以下を設定します。

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/app_hub?sslmode=require"
APP_PASSWORD="your-private-password"
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
npx prisma validate
```

## Notes

- 実際の `.env` やDB接続情報はコミットしません。
- Vercel本番環境では `DATABASE_URL` と `APP_PASSWORD` をEnvironment Variablesに設定します。
- 要求・要件定義は [docs/requirements.md](docs/requirements.md) に保存しています。
