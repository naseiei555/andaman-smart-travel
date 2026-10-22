# Southern Thailand Travel — Android

The mobile app uses Ionic Angular and Capacitor. Ionic, Ionicons, and the
Capacitor App, Haptics, Keyboard, and Status Bar plugins are declared in
`package.json`. Capacitor discovers the installed plugins during sync.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` (the current Angular toolchain
  does not list Node.js 24.14.0 as supported)
- Android Studio with the Android SDK and a configured emulator or device

## Add or update the Android project

From this `mobile` directory, install dependencies and generate/sync the Android
project:

```sh
npm install
npm run android:sync
```

Open the generated native project in Android Studio:

```sh
npm run android:open
```

The Android project is in `android/`. After changing web app code, run
`npm run android:sync` before building or running the app from Android Studio.

Before release, configure `src/environments/environment.prod.ts` to use a
reachable HTTPS backend URL. Its current `http://localhost:3001` address points
to the Android device itself when the app runs natively.
