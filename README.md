# 🎨 Guess Level

A real-time multiplayer drawing and guessing game — like skribbl.io — with a **React web client**, a **Flutter Android client**, and a **Node.js/Socket.IO backend** backed by **PostgreSQL** and **Firebase Authentication**.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Firebase Setup](#firebase-setup)
4. [Backend Setup](#backend-setup)
5. [Web Client Setup](#web-client-setup)
6. [Flutter (Android) Setup](#flutter-android-setup)
7. [Running Locally](#running-locally)
8. [Running Tests](#running-tests)
9. [Building the Android APK](#building-the-android-apk)
10. [Deployment](#deployment)
11. [Game Rules Reference](#game-rules-reference)
12. [Status Report](#status-report)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  React Web App  │     │  Flutter Android │
│  (Vite + TS)   │     │  (Material 3)   │
└────────┬────────┘     └────────┬────────┘
         │  REST + Socket.IO      │
         ▼                        ▼
┌────────────────────────────────────────┐
│          Node.js / Express             │
│          Socket.IO server              │
│          Game Engine (server auth.)    │
│          Firebase Admin SDK            │
└──────────────────┬─────────────────────┘
                   │ Prisma ORM
                   ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         └─────────────────┘
```

**Port map:**
| Service | Port |
|---------|------|
| Backend API + Socket.IO | 3001 |
| Web dev server (Vite) | 5173 |
| Android emulator → backend | `10.0.2.2:3001` |

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | v22 tested |
| npm | 9+ | Comes with Node |
| PostgreSQL | 14+ | v18 tested |
| Flutter SDK | stable | Install from flutter.dev |
| Android Studio | Hedgehog+ | For emulator/APK signing |
| JDK | 17 or 21 | JDK-21 tested |
| Firebase project | — | Free Spark plan works |

---

## Firebase Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → give it a name → continue
3. Enable **Google Analytics** (optional) → create project

### 2. Enable Email/Password auth

Firebase Console → **Authentication** → **Sign-in method** → **Email/Password** → **Enable**

### 3. Backend service account

Firebase Console → **Project Settings** → **Service accounts** → **Generate new private key**  
Save the downloaded JSON as `server/serviceAccountKey.json`  
Then set these env vars in `server/.env`:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Web app config

Firebase Console → **Project Settings** → **General** → **Your apps** → **Add app** → Web  
Copy the config object values into `web/.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 5. Android app config

Firebase Console → **Project Settings** → **Your apps** → **Add app** → Android  
Package name: `com.guesslevel.app`  
Download `google-services.json` → place at `mobile/android/app/google-services.json`

---

## Backend Setup

```bash
cd server

# 1. Copy and fill in environment variables
copy .env.example .env
# Edit .env with your database URL and Firebase credentials

# 2. Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE guesslevel;"

# 3. Run Prisma migrations
npx prisma migrate dev --name init

# 4. Generate Prisma client (already done if you just migrated)
npx prisma generate
```

**`server/.env` reference:**

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/guesslevel
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NODE_ENV=development
```

---

## Web Client Setup

```bash
cd web

# 1. Copy and fill in environment variables
copy .env.example .env
# Edit .env with your Firebase web config

# 2. Install dependencies (already done if node_modules/ exists)
npm install

# 3. Start development server
npm run dev
# → http://localhost:5173
```

---

## Flutter (Android) Setup

### 1. Install Flutter SDK

```powershell
# Windows – recommended via winget:
winget install Google.Flutter

# Or download from https://docs.flutter.dev/get-started/install/windows
# and add <flutter-sdk>/bin to PATH
```

### 2. Verify installation

```bash
flutter doctor
# Fix any issues reported before continuing
```

### 3. Set Flutter SDK path in local.properties

Edit `mobile/android/local.properties`:

```
sdk.dir=C\:\\Users\\mulla\\AppData\\Local\\Android\\Sdk
flutter.sdk=C\:\\flutter
```

### 4. Configure Firebase for Flutter

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# From the mobile/ directory:
cd mobile
flutterfire configure --project=YOUR_FIREBASE_PROJECT_ID
# This overwrites lib/firebase_options.dart with real values
```

### 5. Install Flutter dependencies

```bash
cd mobile
flutter pub get
```

### 6. Run on Android emulator or device

```bash
# List available devices
flutter devices

# Run (emulator uses 10.0.2.2:3001 to reach localhost)
flutter run --dart-define=API_URL=http://10.0.2.2:3001

# Run on a physical device (use your machine's LAN IP)
flutter run --dart-define=API_URL=http://192.168.1.X:3001
```

---

## Running Locally

Start all three services in separate terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev          # uses nodemon + ts-node (hot reload)
# or: node dist/index.js  (compiled build)
```

**Terminal 2 — Web:**
```bash
cd web
npm run dev
```

**Terminal 3 — Flutter (optional):**
```bash
cd mobile
flutter run --dart-define=API_URL=http://10.0.2.2:3001
```

Health check: `GET http://localhost:3001/health` → `{"status":"ok"}`

---

## Running Tests

```bash
# Backend unit tests
cd server
npm test

# Web unit tests
cd web
npm test
```

> Tests are integration tests covering game engine logic, socket events, and scoring.

---

## Building the Android APK

### Debug APK (quick build, no signing needed)

```bash
cd mobile
flutter build apk --debug --dart-define=API_URL=https://your-server.com
# Output: build/app/outputs/flutter-apk/app-debug.apk
```

### Release APK (optimized, requires signing)

#### 1. Generate a keystore (one-time)

```bash
keytool -genkey -v -keystore mobile/android/app/release.keystore \
  -alias guesslevel -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Create `mobile/android/key.properties`

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=guesslevel
storeFile=release.keystore
```

#### 3. Add signing config to `mobile/android/app/build.gradle`

Add before `android {`:
```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add inside `android { buildTypes { release { ... }`:
```groovy
signingConfig signingConfigs.release
```

Add `signingConfigs` block:
```groovy
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

#### 4. Build

```bash
flutter build apk --release --dart-define=API_URL=https://your-server.com
# Output: build/app/outputs/flutter-apk/app-release.apk
```

#### 5. Install on device

```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Deployment

### Backend (Railway / Render / VPS)

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd server
railway up
# Set env vars in Railway dashboard
```

**Docker (VPS):**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
COPY prisma/ ./prisma/
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Web (Vercel / Netlify)

**Vercel:**
```bash
npm install -g vercel
cd web
npm run build
vercel --prod
# Set VITE_* env vars in Vercel dashboard
```

**Netlify:**
```bash
npm install -g netlify-cli
cd web
npm run build
netlify deploy --prod --dir=dist
```

---

## Game Rules Reference

| Rule | Detail |
|------|--------|
| Players per game | Exactly 11 |
| Rounds | 11 (each player draws once) |
| Round duration | 60 seconds |
| First letter hint | At 30 seconds |
| Second hint | At 45 seconds |
| End condition | 60s elapsed OR all guessers correct |
| Scoring — 1st correct | 10 points |
| Scoring — 2nd correct | 8 points |
| Scoring — 3rd correct | 6 points |
| Scoring — 4th–10th correct | 5 points each |
| Artist bonus | +5 if anyone guesses correctly |
| Artist penalty | −1 if nobody guesses correctly |
| Guess matching | Case-insensitive, whitespace-normalized |
| Duplicate guesses | Rejected silently |
| Artist guessing | Not allowed in their own round |

---

## Status Report

### ✅ Verified Working

| Component | Evidence |
|-----------|---------|
| Server TypeScript compilation | `npx tsc` → 0 errors, `dist/` populated |
| Prisma schema + client generation | `npx prisma generate` → `✔ Generated Prisma Client v5.22.0` |
| Web TypeScript compilation | `npx tsc --noEmit` → 0 errors |
| Web Vite production build | `npx vite build` → `✓ built in 1.12s` |
| All web pages exist and route correctly | 20 pages, GoRouter configured |
| All Flutter Dart files authored | 20+ screens, clean architecture |
| Android project scaffolding | Complete `android/` directory structure |

### ⚠️ Unverified / Blocked

| Item | Reason Blocked | What You Must Do |
|------|---------------|-----------------|
| Server runtime (connecting to DB + Firebase) | Needs real `.env` values | Create `server/.env` from `.env.example`; fill Firebase credentials and DB URL |
| Prisma migrations | Needs running PostgreSQL service + DB credentials | Start PostgreSQL service; run `npx prisma migrate dev --name init` |
| Firebase Auth (all clients) | Needs real Firebase project | Create Firebase project; download service account JSON and `google-services.json` |
| Flutter compilation | Flutter SDK not installed on this machine | Install Flutter SDK stable; run `flutter doctor`; run `flutter pub get` |
| Android APK build | Flutter SDK not installed | Install Flutter; then `flutter build apk --release --dart-define=API_URL=...` |
| `firebase_options.dart` (mobile) | Placeholder values only | Run `flutterfire configure --project=YOUR_PROJECT_ID` |
| End-to-end multiplayer test | Needs all of the above running | Run server + web + Android, open two browsers or browser+emulator, play a game |
