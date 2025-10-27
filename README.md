# RAWLINS - Trading Calculator

Win Rate Calculator and Leverage Calculator with multi-language UI, dark mode, animated UI, and optional AI strategy analysis via OpenRouter.

## Features
- Win Rate calculator with compound interest simulation and trade history table
- Leverage calculator with position sizing, liquidation price, and optimal leverage estimator
- Language dropdown (EN/TR preloaded; extendable)
- Dark mode toggle
- Smooth animations and Tailwind CSS
- Secure server-side proxy for AI analysis (hides your API key)

## Project Structure
```
rawlins-trading-calculator/
├─ public/
│  ├─ index.html
│  ├─ css/
│  │  └─ styles.css
│  └─ js/
│     ├─ main.js
│     └─ translations.js
├─ server/
│  └─ server.js
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

## Local Development
1. Install Node.js 18+.
2. Copy the env file:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   # Copy-Item .env.example .env
   ```
3. Edit `.env` and set `OPENROUTER_API_KEY` with your key.
4. Install deps and start the server:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:5173 in your browser.

## AI Analysis Configuration
- The frontend calls `POST /api/ai` with your inputs.
- The server proxies to OpenRouter using `OPENROUTER_API_KEY` from `.env`.
- Model default: `google/gemini-2.0-flash-exp:free`. You can change it in `server/server.js`.

## Deploying
- This is a static frontend + Node server.
- Any Node host (Railway, Render, Fly.io, VPS) works. Set environment variable `OPENROUTER_API_KEY` in your host.

## Security Notes
- Never expose your API key in the frontend. The previous inline key has been removed.
- `.gitignore` excludes `.env`.

## Extending Translations
- Add more languages by extending `public/js/translations.js`.
- Keys map to UI elements with `data-translate` attributes.

## License
MIT
