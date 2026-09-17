# Dostlar Xərcləri & Borclar (Friends Expense & Debt Tracker) 💸

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/new)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-M3_Expressive-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A zero-backend, zero-auth, zero-config **Material Design 3 Expressive** Progressive Web App (PWA) specifically designed for WhatsApp friend groups to effortlessly log shared expenses, simplify complex debts using a Greedy Min-Cash-Flow algorithm, settle up in one tap with pre-filled WhatsApp receipts, and celebrate with fun gamification awards.

---

## 🌟 Key Features

### 🚀 Zero-Backend & Zero-Auth
- **No registration, passwords, or logins**: Operates on a mutual trust model among friends.
- **Link-based rooms**: Group state is keyed to `?room=<binId>`. Anyone with the link is automatically in the group.
- **Instant Profile Switcher**: Users tap "Mən — [Ad] ▾" to identify themselves without authentication. Preferences are persisted locally in device storage.

### 📐 Material Design 3 (M3) Expressive
- **Google M3 Expressive tokens**: Dynamic tonal surfaces (`surface-container-high`, `primary-container`, `secondary-container`), smooth pill shapes (`rounded-full`), and modern 24px/32px curved cards (`rounded-3xl`).
- **Google Sans typography**: Typographic hierarchy matching Google's latest Material 3 Expressive standards.
- **Adaptive Hero Balance Card**: Changes color dynamically based on your status:
  - 🟢 **Emerald**: You are owed money (`+X ₼`)
  - 🔴 **Rose/Amber**: You owe money (`-X ₼`)
  - 🔵 **Teal**: All settled up (`0 ₼ 🎉`)

### 🧠 Greedy Debt Simplification Algorithm
- Eliminates circular and triangular debts using an optimal graph cash flow reduction algorithm.
- **Example**: If A owes B 15 ₼, and B owes C 15 ₼, the system eliminates B as an intermediary, directing A to pay C directly 15 ₼.
- Every simplified transfer includes a localized **"Borclar necə optimallaşdırıldı?"** explanation accordion detailing the calculation.

### 📲 WhatsApp Deep Linking & Confetti Celebrations
- **One-tap Settle Receipts**: Generates pre-filled WhatsApp messages with formatted emojis and group room links.
- **One-tap Group Summary**: Generates a comprehensive breakdown of all group spending and pending transfers formatted for WhatsApp group chats.
- **Celebration Effects**: Realistic physics-based confetti bursts upon individual settlements, and grand multi-stage fireworks when the entire group settles all debts.

### 🏆 Gamification ("Şərəf Lövhəsi" / Hall of Fame)
- Automatically analyzes expenses and settlements to award dynamic badges:
  - 👑 **Gecənin sponsoru** (*Night Sponsor*): Participant who paid the highest total amount.
  - ⚡ **İldırım ödəyici** (*Lightning Payer*): Participant who settled debts most frequently.
  - ⏳ **"Sabah ataram" bəy** (*"I'll send it tomorrow" Gentleman*): Participant with the oldest unsettled debt.
  - 🎪 **Məclisin canı** (*Life of the Party*): Participant involved in the most group activities.
- Complete group metrics leaderboard and interactive badge spotlight.

### 🌐 Multilingual Localization (i18n)
- **Azerbaijani (`az`)** as first-class default language.
- Full parity support for **Russian (`ru`)** and **English (`en`)**.
- Instant language switcher in the top navigation header with persistent device memory.

### 📱 Progressive Web App (PWA) & Web Notifications
- **Installable** on iOS (Safari: "Add to Home Screen") and Android (Chrome: "Install App").
- **Offline Capability**: Caches static assets via Service Worker (Workbox) and displays an offline status indicator banner.
- **Web Push Notifications**: Local notifications confirm debt settlements when permissions are granted.

---

## 🏗️ Architecture & Cloud Storage

```
               Browser / PWA Client (React + Vite + TS)
            ┌────────────────────────────────────────────┐
            │  - I18n Context (AZ / RU / EN)             │
            │  - useRoomStore (Optimistic state + Poll) │
            │  - Debt Simplification & Gamification       │
            │  - Service Worker (Offline Cache)          │
            └──────────────────────┬─────────────────────┘
                                   │ HTTPS REST JSON
                                   ▼
                 Cloud REST JSON Provider (Free Tier)
            ┌────────────────────────────────────────────┐
            │  - Primary: api.npoint.io/<binId>          │
            │  - Fallback: api.jsonbin.io/v3/b/<binId>   │
            │  - Schema: RoomState (JSON)                │
            └────────────────────────────────────────────┘
```

### Zero-Config Auto-Provisioning
1. When a user first visits the web app without a `?room` query parameter in the URL:
   - The app auto-provisions a new cloud bin on `api.npoint.io` with a starter room template (`Dostlar`, starter participants, and AZN `₼` currency).
   - Once provisioned, the browser URL is updated to `/?room=<generatedId>` without reloading.
2. If network access is temporarily unavailable, the app falls back to a locally generated room ID (`local_<timestamp>`), allowing seamless offline usage.
3. Every state update uses **optimistic mutations** (instant UI feedback) with automatic rollback if the cloud request encounters a permanent error.
4. Background polling runs every 10 seconds and automatically syncs when the window regains focus or the network reconnects.

---

## 🚀 One-Click Vercel Deployment

Deploy your own instance of Friends Expense & Debt Tracker in 60 seconds with zero server configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/raufaliyev/friends-debt)

### Manual Vercel CLI Deployment
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Routing Configuration (`vercel.json`)
The project includes a production-ready `vercel.json` handling Single-Page Application (SPA) rewrites, Service Worker cache headers, and modern security headers:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm 9+ or pnpm / yarn

### 1. Clone the repository
```bash
git clone https://github.com/raufaliyev/friends-debt.git
cd friends-debt
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run unit and integration tests
```bash
# Run tests once
npm test

# Run tests in interactive watch mode
npx vitest
```

### 5. Build for production
```bash
npm run build
```
The compiled, typechecked static bundle and Service Worker will be output to the `dist/` directory.

### 6. Preview production build locally
```bash
npm run preview
```

---

## 📁 Project Structure

```
friends-debt/
├── public/                     # Static PWA icon and manifest assets
│   ├── favicon.ico             # Multi-size Windows/browser favicon (16, 32, 48)
│   ├── favicon.svg             # Vector SVG logo
│   ├── apple-touch-icon.png    # 180x180 iOS home screen icon
│   ├── pwa-192x192.png         # 192x192 Android PWA icon
│   ├── pwa-512x512.png         # 512x512 High-res Android PWA icon
│   └── masked-icon.svg         # PWA maskable vector icon
├── src/
│   ├── api/                    # Cloud REST JSON storage client & retries
│   │   ├── storage.ts          # npoint.io / jsonbin.io client & local prefs
│   │   └── storage.test.ts
│   ├── components/
│   │   ├── common/             # Atomic M3 Expressive components
│   │   │   ├── Avatar.tsx      # Initials & tonal color avatars
│   │   │   ├── Badge.tsx       # M3 status chips & badge pills
│   │   │   ├── Button.tsx      # Filled, tonal, outlined, text M3 buttons
│   │   │   ├── Card.tsx        # Elevated, filled, outlined M3 cards
│   │   │   ├── Dialog.tsx      # Accessible modal with backdrop blur
│   │   │   └── SegmentedButton.tsx # M3 pill navigation tabs
│   │   ├── dialogs/            # Feature modals
│   │   │   ├── ExpenseDialog.tsx      # Add/edit expense with equal/custom split
│   │   │   ├── SettleDialog.tsx       # Settlement confirmation & WhatsApp
│   │   │   ├── ParticipantDialog.tsx  # Add friend with avatar palette
│   │   │   ├── CurrencyDialog.tsx     # Custom currency symbol picker
│   │   │   ├── HelpDialog.tsx         # How-to, PWA install guide & privacy
│   │   │   └── DeleteConfirmDialog.tsx # Recalculation warning modal
│   │   ├── layout/             # Shell components
│   │   │   ├── Header.tsx      # Profile selector, room copy, lang, controls
│   │   │   └── HeroBalance.tsx # Dynamic net balance card
│   │   └── tabs/               # Main application views
│   │       ├── TransfersTab.tsx   # Greedy debt simplification & WhatsApp
│   │       ├── HistoryTab.tsx     # Filterable chronological expenses & settlements
│   │       └── HallOfFameTab.tsx  # Gamification awards & leaderboard
│   ├── hooks/
│   │   ├── useRoomStore.ts     # Reactive store, polling, optimistic mutations
│   │   └── useRoomStore.test.ts
│   ├── i18n/
│   │   ├── I18nContext.tsx     # React i18n provider & formatMoney helper
│   │   ├── translations.ts     # Dictionaries for AZ, RU, EN
│   │   └── i18n.test.ts
│   ├── test/
│   │   └── setup.ts            # Vitest DOM & localStorage mocks
│   ├── types/
│   │   └── index.ts            # Core domain TypeScript interfaces
│   ├── utils/
│   │   ├── cn.ts               # clsx + twMerge utility
│   │   ├── confetti.ts         # canvas-confetti celebration triggers
│   │   ├── debtCalculator.ts   # Balances & Greedy Min-Cash-Flow engine
│   │   ├── gamification.ts     # Badges & statistical aggregations
│   │   ├── notifications.ts    # Web Push Notification API wrappers
│   │   └── whatsapp.ts         # WhatsApp deep link generators
│   ├── App.tsx                 # Root application assembly
│   ├── App.test.tsx            # End-to-end integration test suite
│   ├── index.css               # Tailwind CSS & Google Sans fonts
│   └── main.tsx                # React DOM root entrypoint
├── index.html                  # HTML entrypoint with PWA links
├── package.json
├── tailwind.config.js          # Material Design 3 Expressive color palette
├── tsconfig.json
├── vercel.json                 # Vercel SPA rewrites & security headers
├── vite.config.ts              # Vite + React + VitePWA plugin
└── vitest.config.ts
```

---

## 🔒 Privacy & Trust Security Model

- **No Passwords**: The app is designed for friends and trusted circles. Anyone with the URL can see and log expenses.
- **No Financial Data Stored**: No credit card numbers, bank credentials, or government IDs are requested or stored.
- **WhatsApp Direct**: Debt settlement occurs directly through peer-to-peer bank transfers (e.g. m10, Birbank, Leobank, Kaspi, Revolut, Zelle) or cash, and confirmation messages are sent directly between users on WhatsApp.

---

## 📄 License

Distributed under the **MIT License**. Free for personal and community use.
