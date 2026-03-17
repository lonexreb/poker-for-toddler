<p align="center">
  <img src="public/banner.svg" alt="Poker Fun! Learn Cards" width="100%"/>
</p>

<h1 align="center">🃏 Poker Fun! Learn Cards</h1>

<p align="center">
  <b>A colorful, gender-neutral poker game that teaches kids aged 4–8 card matching, pattern recognition, and basic strategy — through fun, gamified play.</b>
</p>

<p align="center">
  <a href="https://poker-for-toddler.vercel.app"><img src="https://img.shields.io/badge/▶_Play_Now-poker--for--toddler.vercel.app-FF6B35?style=for-the-badge&labelColor=2d3436" alt="Play Now"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ages-4--8-FF4757?style=for-the-badge&labelColor=2d3436" alt="Ages 4-8"/>
  <img src="https://img.shields.io/badge/react-18-61dafb?style=for-the-badge&logo=react&logoColor=white&labelColor=2d3436" alt="React 18"/>
  <img src="https://img.shields.io/badge/vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=2d3436" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/PWA-ready-FFA502?style=for-the-badge&labelColor=2d3436" alt="PWA Ready"/>
  <img src="https://img.shields.io/badge/iOS-capacitor-2ED573?style=for-the-badge&logo=capacitor&logoColor=white&labelColor=2d3436" alt="iOS Capacitor"/>
</p>

---

## How It Works

Each round, **you and the dealer** both get **2 cards**. Your goal is to make the **best hand** you can!

| Hand | Points | Example | What to Look For |
|------|--------|---------|-----------------|
| 👯 **Pair** | 3 pts | `5♥ + 5♣` | Two cards with the **same number**! |
| ❤️ **Red Match** | 2 pts | `3♥ + K♦` | Both cards are **red** (Hearts or Diamonds) |
| 🖤 **Black Match** | 2 pts | `7♣ + J♠` | Both cards are **black** (Clubs or Spades) |
| 🎰 **High Card** | 1 pt | `K♠ + 4♥` | No match — your **biggest card** counts |

### The Twist: You Can Swap!

Before the showdown, you can **swap one card** for a new one from the deck — or **keep both** if you like your hand. Then the dealer's cards are revealed and the best hand wins!

---

## Features

- **15-level adventure** across 3 themed worlds (Number Garden, Star Market, Mystery Mountain)
- **Dynamic quizzes** generated from actual dealt cards — comparing, adding, probability
- **Star currency** — earn from wins, quizzes, and streaks; spend on power-ups (peek, extra swap)
- **Entrepreneurial mechanics** — bet stars, invest ("plant stars to grow!"), trade for guaranteed rewards
- **7 collectible badges** — first-win, counting-star, number-wizard, star-trader, smart-swapper, fire-streak, card-champion
- **Streak system** — every 3 wins = bonus star, 5-streak = Fire Streak badge
- **Free Play mode** — endless rounds without level progression
- **Big, bright cards** with large touch targets (44×44px minimum)
- **One-card swap mechanic** — adds strategy even for little ones
- **Confetti celebrations** on wins
- **Progress persistence** — stars, level, badges saved to localStorage
- **No gambling language** — 100% child-safe
- **Works offline** as a PWA — install it on your home screen
- **iOS native ready** via Capacitor

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (LAN-accessible for mobile testing)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The dev server runs at **http://localhost:5174** and is accessible on your local network for testing on real devices.

---

## iOS Native Build

```bash
# First time only — generate Xcode project
npx cap add ios

# Sync web build into native shell
npm run build && npx cap sync ios

# Open in Xcode to build/run
npx cap open ios
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 18 + inline styles |
| **Build** | Vite 6 |
| **Font** | Fredoka One (display) + Nunito (body) |
| **PWA** | Custom service worker + web manifest |
| **iOS** | Capacitor 6 |
| **Animations** | CSS `@keyframes` — no JS animation libs |

---

## Project Structure

```
poker-for-toddler/
├── index.html          # Entry HTML with PWA meta tags + safe-area insets
├── package.json
├── vite.config.js      # Vite config (LAN-exposed on :5174)
├── public/
│   ├── banner.svg      # Project banner
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Service worker (network-first nav, cache-first assets)
│   ├── icon-192.png    # App icon 192×192
│   └── icon-512.png    # App icon 512×512
└── src/
    ├── main.jsx        # React 18 entry point
    └── App.jsx         # Entire game — single-file component (~580 lines)
```

---

## Design Decisions

- **Single-file component** — the game is small and benefits from locality
- **Inline styles** — keeps animations co-located with components
- **Simplified poker hands** — real poker has too many hands for toddlers; we use 3 tiers (Pair > Color Match > High Card) that teach pattern recognition
- **No state management library** — `useState` + `useCallback` is all we need
- **No router** — single-screen app

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| 🔴 Red | `#FF4757` | Hearts, alerts |
| 🟠 Orange | `#FFA502` | CTAs, highlights |
| 🟢 Green | `#2ED573` | Wins, success |
| 🔵 Blue | `#1E90FF` | Info, accents |
| 🟣 Purple | `#6c5ce7` | Card backs, hints |

---

## Also Check Out

**[Blackjack for Toddler](../blackjack-for-toddler)** — the sister game that teaches numbers and addition through simplified Blackjack!

---

<p align="center">
  Made with ❤️ for tiny card sharks
</p>
