# Sip 💧

A playful water tracker for iOS, built with Expo (React Native + TypeScript), styled after WaterLlama.

## Features

- **Water orb** that fills with animated waves and bubbles as you drink, and bursts into confetti when you hit your goal
- **Quick add** for 8 drink types (water, tea, coffee, juice, milk, soda, sports drinks, smoothies) with small, medium and large glass presets (editable in Settings) or a custom amount. Non-water drinks count by their hydration factor (coffee 80%, soda 70%, …)
- **Daily goal** you can set by hand or from your body weight (33 ml per kg)
- **Streaks**, best streak, 7-day average, weekly chart and a 30-day history
- **Reminders**: local notifications every 1-4 hours within a time window
- ml or oz, haptic feedback, everything stored on the device

## Run it on your iPhone

1. Install **Expo Go** from the App Store.
2. On your computer (Node 20+):
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with the iPhone camera. Your phone and computer need to be on the same Wi-Fi (or use `npx expo start --tunnel`).

To install it as a real app without a computer running, build with EAS: `npx eas-cli@latest build --platform ios --profile preview` (needs an Apple Developer account).

## Project layout

```
src/app/            Expo Router screens (Today, History, Settings tabs)
src/components/     Water orb, glass icons and shared UI
src/lib/            Store (AsyncStorage), drinks, stats/streaks, reminders, units
```

`npm run typecheck` runs the TypeScript checks.
