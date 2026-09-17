# Friends Expense & Debt Tracker (Vercel PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-backend, zero-auth Material Design 3 Expressive Progressive Web App for WhatsApp friend groups to track expenses, calculate net balances, simplify debt transactions via Greedy Cash Flow, settle debts in one click with WhatsApp confirmations, and celebrate with gamification.

**Architecture:** A static React (Vite + TypeScript) PWA that communicates directly with an auto-provisioned cloud REST JSON store (`npoint.io` / `jsonbin.io`) for room state. Local device storage preserves active profile and language choice. The UI is built using Tailwind CSS configured with Material Design 3 Expressive tokens and Google Sans typography.

**Tech Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas-Confetti, Vitest, Testing Library, vite-plugin-pwa.

## Global Constraints

- **Zero Backend / Cloud-First**: State is hosted on free REST JSON endpoints keyed by `?room=<binId>`. No custom server required.
- **Zero Auth**: Users identify themselves by selecting their name from the participant list.
- **Material Design 3 (Expressive)**: Strict usage of M3 tonal containers, `rounded-3xl` cards, `rounded-full` pills, elevation-3 floating FAB, and Google Sans typography.
- **Default Language**: Azerbaijani (`az`) is default; Russian (`ru`) and English (`en`) fully supported.
- **Currency**: Default AZN (`₼`) with customizable symbol.
- **Offline & PWA**: Service Worker caching, valid web manifest, standalone display mode, Web Notification API.

---

### Task 1: Project Scaffolding & Build Configuration

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: Working React 18 + Vite + TypeScript + Tailwind M3 build with Vitest test runner.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "friends-debt-pwa",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^22.13.10",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.21",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.2",
    "vite": "^6.2.1",
    "vite-plugin-pwa": "^1.2.0",
    "vitest": "^3.0.8"
  }
}
```

- [ ] **Step 2: Create Vite and TypeScript configurations (`vite.config.ts`, `tsconfig.json`, `vitest.config.ts`)**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Dostlar Xərcləri & Borclar',
        short_name: 'DostBorc',
        description: 'Dostlar üçün xərc və borc hesablama PWA',
        theme_color: '#006A60',
        background_color: '#F4FAF8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
```

- [ ] **Step 3: Create Tailwind CSS and PostCSS config with M3 Expressive tokens (`tailwind.config.js`, `postcss.config.js`)**

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', '"Google Sans Text"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        md: {
          primary: '#006A60',
          'on-primary': '#FFFFFF',
          'primary-container': '#70F7E5',
          'on-primary-container': '#00201C',
          secondary: '#4A635F',
          'on-secondary': '#FFFFFF',
          'secondary-container': '#CCE8E2',
          'on-secondary-container': '#05201C',
          tertiary: '#456179',
          'on-tertiary': '#FFFFFF',
          'tertiary-container': '#CCE5FF',
          'on-tertiary-container': '#001D31',
          error: '#BA1A1A',
          'on-error': '#FFFFFF',
          'error-container': '#FFDAD6',
          'on-error-container': '#410002',
          background: '#F4FAF8',
          'on-background': '#161D1C',
          surface: '#F4FAF8',
          'on-surface': '#161D1C',
          'surface-variant': '#DAE5E1',
          'on-surface-variant': '#3F4947',
          outline: '#6F7977',
          'surface-container-lowest': '#FFFFFF',
          'surface-container-low': '#EEF5F2',
          'surface-container': '#E8EFEC',
          'surface-container-high': '#E2EAE6',
          'surface-container-highest': '#DCE4E1',
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `index.html` with Google Sans typography and entry point**

`index.html`:
```html
<!DOCTYPE html>
<html lang="az">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Dostlar Xərcləri - Friends Expense Tracker</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@400;500;700&family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-md-background text-md-on-background font-sans antialiased selection:bg-md-primary-container selection:text-md-on-primary-container">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Run package installation and verify build setup**

Run: `npm install`
Run: `npm run build`
Expected: Successful compile of static bundle into `dist/`.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold React Vite PWA with Tailwind M3 Expressive config"
```

---

### Task 2: Core Domain Types & Debt Simplification Algorithm

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/debtCalculator.ts`
- Create: `src/utils/debtCalculator.test.ts`
- Create: `src/test/setup.ts`

**Interfaces:**
- Produces: `calculateBalances(participants, expenses, settlements)`, `simplifyDebts(participants, expenses, settlements, currency, lang)`

- [ ] **Step 1: Write failing unit tests for Debt Simplification (`src/utils/debtCalculator.test.ts`)**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateBalances, simplifyDebts } from './debtCalculator';
import { Participant, Expense, Settlement } from '../types';

describe('Debt Calculator & Simplification', () => {
  const participants: Participant[] = [
    { id: '1', name: 'Elvin', avatarColor: '#006A60' },
    { id: '2', name: 'Rauf', avatarColor: '#456179' },
    { id: '3', name: 'Çingiz', avatarColor: '#705D00' }
  ];

  it('calculates net balances for equal split expense correctly', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Tarqovıda kofe',
        amount: 30,
        payerId: '1', // Elvin paid 30
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'], // 10 each
        createdAt: Date.now()
      }
    ];

    const balances = calculateBalances(participants, expenses, []);
    expect(balances['1']).toBe(20); // Elvin is +20
    expect(balances['2']).toBe(-10); // Rauf owes 10
    expect(balances['3']).toBe(-10); // Chingiz owes 10
  });

  it('simplifies triangular debt correctly (A->B and B->C => A->C)', () => {
    // Expense 1: Rauf paid 15 for Elvin (Elvin owes Rauf 15)
    // Expense 2: Chingiz paid 15 for Rauf (Rauf owes Chingiz 15)
    // Net: Elvin: -15, Rauf: 0, Chingiz: +15
    // Simplified: Elvin -> Chingiz 15
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Lunch',
        amount: 15,
        payerId: '2', // Rauf
        date: '2026-09-17',
        splitMode: 'custom',
        involvedParticipantIds: ['1'],
        customSplits: [{ participantId: '1', amount: 15 }],
        createdAt: 1
      },
      {
        id: 'e2',
        title: 'Coffee',
        amount: 15,
        payerId: '3', // Chingiz
        date: '2026-09-17',
        splitMode: 'custom',
        involvedParticipantIds: ['2'],
        customSplits: [{ participantId: '2', amount: 15 }],
        createdAt: 2
      }
    ];

    const transfers = simplifyDebts(participants, expenses, [], '₼', 'az');
    expect(transfers).toHaveLength(1);
    expect(transfers[0].fromParticipantId).toBe('1'); // Elvin
    expect(transfers[0].toParticipantId).toBe('3');   // Chingiz
    expect(transfers[0].amount).toBe(15);
    expect(transfers[0].explanation.az).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/debtCalculator.test.ts`
Expected: FAIL ("Cannot find module '../types' or './debtCalculator'")

- [ ] **Step 3: Implement `src/types/index.ts` and `src/utils/debtCalculator.ts`**

Implement complete types, balance calculator with settlement offsets, and greedy min-cash-flow algorithm with multi-language explanation generator (`az`, `ru`, `en`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/debtCalculator.test.ts`
Expected: PASS with 100% assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/types src/utils src/test
git commit -m "feat: implement domain types and debt simplification algorithm"
```

---

### Task 3: Cloud REST JSON Storage Provider & Live Sync Hook

**Files:**
- Create: `src/api/storage.ts`
- Create: `src/api/storage.test.ts`
- Create: `src/hooks/useRoomStore.ts`

**Interfaces:**
- Produces:
  - `createRoom(initialState: RoomState): Promise<string>`
  - `fetchRoomState(roomId: string): Promise<RoomState>`
  - `saveRoomState(roomId: string, state: RoomState): Promise<boolean>`
  - Hook `useRoomStore(roomId)` returning `{ room, isLoading, isSyncing, error, addExpense, editExpense, deleteExpense, settleDebt, addParticipant, updateGroupName, refetch }`

- [ ] **Step 1: Write failing tests for storage service (`src/api/storage.test.ts`)**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRoomState, saveRoomState } from './storage';
import { RoomState } from '../types';

describe('Storage API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches room state successfully', async () => {
    const mockState: RoomState = {
      id: 'test-room',
      groupName: 'Dostlar',
      currency: '₼',
      participants: [],
      expenses: [],
      settlements: [],
      updatedAt: Date.now()
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockState
    } as Response);

    const result = await fetchRoomState('test-room');
    expect(result.groupName).toBe('Dostlar');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/api/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/api/storage.ts` and `src/hooks/useRoomStore.ts`**

Implement robust zero-config cloud storage with `npoint.io` and `jsonbin.org` fallback endpoints, automatic retry, optimistic updates, and background polling every 10 seconds.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/api/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api src/hooks
git commit -m "feat: implement cloud REST JSON storage client and reactive room hook"
```

---

### Task 4: i18n Localization Engine (AZ Default, RU, EN)

**Files:**
- Create: `src/i18n/translations.ts`
- Create: `src/i18n/I18nContext.tsx`
- Create: `src/i18n/i18n.test.ts`

**Interfaces:**
- Produces: `useI18n()` hook returning `{ lang, setLang, t(key, params), formatMoney(amount, currency) }`

- [ ] **Step 1: Write failing tests for i18n context (`src/i18n/i18n.test.ts`)**

```typescript
import { describe, it, expect } from 'vitest';
import { translations, getTranslation } from './translations';

describe('i18n Translations', () => {
  it('contains required keys for az, ru, en and defaults to az', () => {
    expect(getTranslation('az', 'app.title')).toBe('Dostlar Xərcləri');
    expect(getTranslation('ru', 'app.title')).toBe('Расходы друзей');
    expect(getTranslation('en', 'app.title')).toBe('Friends Expenses');
  });

  it('interpolates parameters correctly', () => {
    const text = getTranslation('az', 'settle.success_msg', { debtor: 'Elvin', receiver: 'Rauf', amount: '20 ₼' });
    expect(text).toContain('Elvin');
    expect(text).toContain('Rauf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement comprehensive dictionaries in `src/i18n/translations.ts` and `src/i18n/I18nContext.tsx`**

Include full coverage for all views, titles, buttons, settlement messages, WhatsApp sharing templates, gamification badges, help dialog, and error states.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/i18n
git commit -m "feat: add comprehensive i18n localization engine (AZ default, RU, EN)"
```

---

### Task 5: Material Design 3 Expressive UI Foundations & Atomic Components

**Files:**
- Create: `src/components/common/Button.tsx`
- Create: `src/components/common/Card.tsx`
- Create: `src/components/common/Dialog.tsx`
- Create: `src/components/common/Badge.tsx`
- Create: `src/components/common/Avatar.tsx`
- Create: `src/components/common/SegmentedButton.tsx`

**Interfaces:**
- Produces: Modular M3 components adhering to Google M3 Expressive guidelines (tonal surfaces, pill buttons, standard elevation, accessibility).

- [ ] **Step 1: Implement atomic M3 components with TypeScript props and interactive states**

Implement `Button`, `Card`, `Dialog` (with backdrop blur and smooth entrance animation), `Badge`, `Avatar` with auto initials and vibrant tonal palette colors, and `SegmentedButton`.

- [ ] **Step 2: Verify type safety and component export**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/common
git commit -m "feat: implement Material Design 3 Expressive UI atom components"
```

---

### Task 6: App Header, Participant Manager & Hero Balance Card

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/HeroBalance.tsx`
- Create: `src/components/dialogs/ParticipantDialog.tsx`
- Create: `src/components/dialogs/CurrencyDialog.tsx`

**Interfaces:**
- Produces: Header with profile selector ("Mən — [Ad] ▾"), share room button, lang picker, notification toggle, and Hero balance card reflecting active user's net status.

- [ ] **Step 1: Implement `Header.tsx` with room link copy and profile picker**
- [ ] **Step 2: Implement `HeroBalance.tsx` with dynamic status (Positive Green, Negative Amber/Red, Zero Teal)**
- [ ] **Step 3: Implement `ParticipantDialog.tsx` for adding new friends to group**
- [ ] **Step 4: Verify rendering and build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/components/dialogs
git commit -m "feat: implement Header, Participant Manager and Hero Balance Card"
```

---

### Task 7: Expense Management, Split Calculator & Tarixçə (History) Tab

**Files:**
- Create: `src/components/dialogs/ExpenseDialog.tsx`
- Create: `src/components/tabs/HistoryTab.tsx`
- Create: `src/components/dialogs/DeleteConfirmDialog.tsx`

**Interfaces:**
- Produces: Equal split checkbox selector with auto remainder handling, Flexible split manual input, and chronological history list with Edit/Delete capabilities.

- [ ] **Step 1: Implement `ExpenseDialog.tsx` with Equal vs Custom Split modes**
- [ ] **Step 2: Implement `HistoryTab.tsx` with date grouped expense cards and edit/delete actions**
- [ ] **Step 3: Verify build and calculations**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/dialogs/ExpenseDialog.tsx src/components/dialogs/DeleteConfirmDialog.tsx src/components/tabs/HistoryTab.tsx
git commit -m "feat: implement Expense dialog with flexible split and History tab"
```

---

### Task 8: Transfers Tab, One-Click Settle-Up, WhatsApp Sharing & Confetti

**Files:**
- Create: `src/utils/whatsapp.ts`
- Create: `src/utils/whatsapp.test.ts`
- Create: `src/utils/notifications.ts`
- Create: `src/components/dialogs/SettleDialog.tsx`
- Create: `src/components/tabs/TransfersTab.tsx`

**Interfaces:**
- Produces:
  - `generateSettleWhatsAppUrl(settlement, debtorName, receiverName, currency, appUrl, lang)`
  - `generateSummaryWhatsAppUrl(roomName, expenses, transfers, participants, currency, appUrl, lang)`
  - Confetti burst animation via `canvas-confetti`
  - Web Notification trigger

- [ ] **Step 1: Write failing unit test for WhatsApp generator (`src/utils/whatsapp.test.ts`)**

```typescript
import { describe, it, expect } from 'vitest';
import { generateSettleWhatsAppUrl, generateSummaryWhatsAppUrl } from './whatsapp';

describe('WhatsApp Deep Link Generator', () => {
  it('generates valid settle message URL with emoji and room link in AZ', () => {
    const url = generateSettleWhatsAppUrl('Elvin', 'Rauf', 25, '₼', 'https://friends-debt.vercel.app?room=123', 'az');
    expect(url).toContain('https://wa.me/?text=');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Borc bağlandı');
    expect(decoded).toContain('Elvin ➡️ 25 ₼ ➡️ Rauf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/whatsapp.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement WhatsApp link generators, Web Notifications, Confetti triggers, and `TransfersTab.tsx`**
- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/whatsapp.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/whatsapp.ts src/utils/whatsapp.test.ts src/utils/notifications.ts src/components/dialogs/SettleDialog.tsx src/components/tabs/TransfersTab.tsx
git commit -m "feat: implement Transfers tab, WhatsApp settlement integration and Confetti effects"
```

---

### Task 9: Gamification ("Şərəf Lövhəsi") & Help / Info Modal

**Files:**
- Create: `src/utils/gamification.ts`
- Create: `src/utils/gamification.test.ts`
- Create: `src/components/tabs/HallOfFameTab.tsx`
- Create: `src/components/dialogs/HelpDialog.tsx`

**Interfaces:**
- Produces:
  - `computeBadges(participants, expenses, settlements)` awarding "Gecənin sponsoru", "İldırım ödəyici", "Sabah ataram bəy", "Məclisin canı".
  - Help Dialog with iOS/Android installation guide, how it works, debt simplification explainer, and trust security model.

- [ ] **Step 1: Write failing unit test for gamification badges (`src/utils/gamification.test.ts`)**

```typescript
import { describe, it, expect } from 'vitest';
import { computeBadges } from './gamification';

describe('Gamification Engine', () => {
  it('awards "Gecənin sponsoru" to participant with highest spending', () => {
    const participants = [{ id: '1', name: 'Elvin' }, { id: '2', name: 'Rauf' }];
    const expenses = [
      { id: 'e1', payerId: '1', amount: 100, date: '2026-09-17', title: 'Dinner', splitMode: 'equal', involvedParticipantIds: ['1', '2'], createdAt: 1 }
    ];
    const badges = computeBadges(participants, expenses, []);
    expect(badges['1']).toContainEqual(expect.objectContaining({ id: 'sponsor' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/gamification.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `gamification.ts`, `HallOfFameTab.tsx`, and `HelpDialog.tsx`**
- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/gamification.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/gamification.ts src/utils/gamification.test.ts src/components/tabs/HallOfFameTab.tsx src/components/dialogs/HelpDialog.tsx
git commit -m "feat: implement Hall of Fame gamification engine and M3 Help modal"
```

---

### Task 10: Complete App Assembly, PWA Assets, Production Build & Vercel Documentation

**Files:**
- Create: `src/App.tsx`
- Create: `public/pwa-192x192.png`
- Create: `public/pwa-512x512.png`
- Create: `public/favicon.ico`
- Create: `public/apple-touch-icon.png`
- Create: `vercel.json`
- Create: `README.md`

**Interfaces:**
- Produces: Integrated PWA application with all views, tab navigation, floating FAB, PWA offline caching, and ready-to-deploy Vercel configuration.

- [ ] **Step 1: Assemble all components and tabs into `src/App.tsx`**
- [ ] **Step 2: Generate PWA icons and web manifest assets**
- [ ] **Step 3: Create `vercel.json` and comprehensive `README.md`**
- [ ] **Step 4: Run full test suite and production build**

Run: `npm test`
Run: `npm run build`
Expected: All unit tests pass, and Vite builds clean production bundle in `dist/`.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: complete Friends Expense & Debt Tracker PWA assembly and documentation"
```
