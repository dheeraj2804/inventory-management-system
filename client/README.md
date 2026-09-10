# StockSync frontend

See the [project README](../README.md) for architecture, live API setup, data models, and limitations.

## Explore locally

```bash
npm ci
npm run dev
```

Open [the login page](http://localhost:3000/login) and select **Explore the demo**. Demo data lives only in your browser and requires no backend. Sign in with your own account to connect to the live API.

## Production preview

```bash
npm run build
npm run start
```

Production mode enables route prefetching and avoids development compilation delays.

## Checks

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

Browser tests run against a production preview on port 3100. Tests edit only isolated demo data and block outbound API requests during the demo workflow test.

Set `NEXT_PUBLIC_API_URL` in `.env.local` to override the default live API URL, `http://localhost:5001/api`. This setting is public; it must not contain secrets.
