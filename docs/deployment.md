# App Hub デプロイ手順

この手順は、ローカル動作確認を省略し、GitHub連携したVercel本番環境で確認する前提です。

## 1. GitHubへ反映

`.env` は `.gitignore` 済みなので、コミット対象に含めません。

```bash
git status --short
git add .
git commit -m "Initial App Hub implementation"
git push -u origin main
```

## 2. Neonでテーブルを作成

Neon Consoleで対象Projectを開き、SQL Editorで以下を実行します。

```sql
create table if not exists app_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  description text,
  category text,
  status text not null default 'active',
  icon text,
  memo text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`updated_at` はアプリ側のPrisma `@updatedAt` で更新します。

## 3. VercelへImport

1. Vercel Dashboardで `Add New...` → `Project` を選ぶ。
2. GitHubの `kooooyooooo/app-hub` をImportする。
3. Framework Presetは `Next.js` の自動検出で進める。
4. Environment Variablesに以下を設定する。

```text
DATABASE_URL = Neonの接続文字列
APP_PASSWORD = App Hubログイン用パスワード
```

`DATABASE_URL` はNeonのpooled connection stringで問題ありません。

## 4. Deploy

Vercelの `Deploy` を押します。

Build Commandは未変更で問題ありません。

```bash
npm run build
```

デプロイ後、発行されたURLを開き、`APP_PASSWORD` でログインして、アプリリンクの追加・編集・削除を確認します。

## 5. 本番で失敗した場合に見る場所

- Vercel: Project → Deployments → 対象Deployment → Build Logs / Runtime Logs
- Neon: SQL Editorで `select * from app_links;` を実行してデータ作成を確認

## 注意

- `.env` はGitHubへ上げない。
- VercelのEnvironment Variablesを変更したら再デプロイが必要。
- チャット等に貼った接続文字列が気になる場合は、NeonでDBロールのパスワードを再生成して差し替える。
