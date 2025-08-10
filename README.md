# Sustainable Design Lab — SPA (Vercel-ready)

This is a Vite + React single-page app with client-side Model Builder.

## Deploy to Vercel (Beginner-friendly)
1. Create a GitHub account and a new repository.
2. Upload **all files** from this folder to that repo.
3. In Vercel, click **New Project** → select your repo → **Deploy**.
4. Done! Your URL will appear after the build.

### Important for Vercel
- This project includes `vercel.json` with a SPA **rewrite** so routes like `/demo` work after refresh.
- Build output is `dist/`.

## Run locally
```bash
npm install
npm run start
# open http://localhost:5173
```

## Notes
- The model builder uses simplified proxies for energy/embodied carbon for quick comparisons.
