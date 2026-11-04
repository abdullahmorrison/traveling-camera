# Traveling Camera

One camera, passed person to person in real life. Each holder takes one photo, then hands the camera to someone in person by letting them scan a QR code. If nobody receives it within 7 days, the chain ends.

## Develop

Requires Node 22.12+ (CI uses the version in `.nvmrc`) and npm 11.

```sh
npm install
npm run dev
```

## Check

```sh
npm run lint     # prettier + eslint
npm run check    # svelte-check / typescript
npx vitest run   # unit tests
npx playwright test   # end-to-end, fake camera and GPS
```
