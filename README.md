# DiaLafia PWA

DiaLafia is packaged as an installable Progressive Web App. On iPhone, deploy it over HTTPS, open it in Safari, then use Share > Add to Home Screen.

## Local setup

Prerequisite: Node.js 22 or newer.

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production check

```powershell
npm run build
npm start
```

The production server uses `process.env.PORT` when a host such as Render provides it, otherwise it falls back to port `3000`.

## Render settings

Use these values for a Render Web Service:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Node version: `>=22`

No API environment variables are required for the current PWA install flow.

## iPhone install check

After Render gives you the HTTPS URL:

1. Open the URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch DiaLafia from the home screen.
5. Turn on airplane mode and reopen the app to confirm the cached app shell loads.
