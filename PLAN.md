# Texas Hold'em for Kids — Project Plan & Progress

## Vision
Teach **real Texas Hold'em** to kids aged 4–9 through progressive levels, toy-based currency, and dynamic quizzes — then ship as an iOS app.

---

## Phase 1: Core Game Engine [DONE]
- [x] Standard 52-card deck with shuffle
- [x] Full 5-from-7 hand evaluation (C(7,5) = 21 combinations)
- [x] All 10 hand rankings: Royal Flush → High Card
- [x] Proper kicker/tiebreaker logic
- [x] Community card flow: Preflop → Flop (3) → Turn (4th) → River (5th)
- [x] Showdown comparison with win/lose/push outcomes
- [x] Partial-board evaluation (for Flop-only levels)

## Phase 2: Level System & Progression [DONE]
- [x] 4 worlds × 5 levels = 20 levels
- [x] World 1 "Card Kingdom" — card values, suits, colors (Flop only)
- [x] World 2 "Pattern Palace" — pairs, flushes, straights (adds Turn/River)
- [x] World 3 "Toy Market" — betting with toys (bet/check/fold)
- [x] World 4 "Champion Arena" — full Hold'em + position + board reading
- [x] World map with locked/unlocked/completed visual states
- [x] Per-level progress bar (X of Y rounds)
- [x] Level completion → auto-advance

## Phase 3: Quiz Engine [DONE]
- [x] Dynamic generation from actual dealt cards
- [x] 15 quiz types: card-value, suit-color, compare, face-cards, spot-pair, spot-flush, spot-straight, spot-hand, best-hand, bet-decision, risk-reward, read-board, position, mixed-basic, mixed-all
- [x] Correct/wrong feedback with kid-friendly explanations
- [x] Quiz rewards (+1 toy per correct answer)

## Phase 4: Gamification [DONE]
- [x] Toy currency (stars, cars, unicorns, gems, crowns) — replaces chips/money
- [x] Toy floor of 10 (never go broke)
- [x] 12 collectible badges
- [x] Streak system (every 3 wins = bonus toy)
- [x] localStorage persistence (toys, level, badges, stats)
- [x] Confetti celebrations on wins
- [x] Encouraging language throughout

## Phase 5: Betting Mechanics [DONE]
- [x] Simplified bet/check/fold UI
- [x] Blind posting (1 toy per hand in betting levels)
- [x] Pot tracking and display
- [x] Dealer auto-matches bets
- [x] Fold = "Smart fold! Save your toys!"

## Phase 6: UI/UX Polish [DONE]
- [x] Home screen with Adventure / Free Play / Badges / Hand Guide
- [x] Hand guide — all 10 rankings with kid metaphors
- [x] Card deal animations (dealpop)
- [x] Community card reveal animations per stage
- [x] Hand rank badges on player/dealer hands
- [x] Free Play mode (full Hold'em, no levels)
- [x] Responsive layout (mobile-first, 500px max-width)

## Phase 7: Deployment [DONE]
- [x] Vercel production deployment
- [x] PWA service worker + manifest
- [x] GitHub push (main branch)

---

## Phase 8: iOS App [PLANNED]
- [ ] Replace placeholder icons (icon-192.png, icon-512.png) with real art
- [ ] `npm run build && npx cap sync ios && npx cap open ios`
- [ ] Add `@capacitor/haptics` for card taps, wins, wrong answers
- [ ] Add `@capacitor/splash-screen` for branded launch image
- [ ] Test on iPhone simulator + real device
- [ ] Rename bundle ID to `com.cardfun.holdemkids` in capacitor.config.ts
- [ ] App Store screenshots: iPhone 15 Pro + iPad Pro
- [ ] App Store submission: Education > Ages 5 & Under, Rating 4+, no data collection

## Phase 9: Content & Polish [PLANNED]
- [ ] Sound effects (card deal, win jingle, wrong buzz) — use Web Audio API
- [ ] More quiz variety (e.g., "What are the odds?", "Count your outs")
- [ ] Animated card flip transitions (CSS 3D transforms)
- [ ] Dealer AI personality (shows "thinking" messages, reacts to hands)
- [ ] Achievement notifications (toast-style popups)
- [ ] Tutorial overlay for first-time players
- [ ] Kid-friendly avatars (pick your character)

## Phase 10: Advanced Features [FUTURE]
- [ ] Multiplayer (2 kids on same device, turn-based)
- [ ] Parent dashboard (see child's progress, quiz accuracy)
- [ ] More poker variants (Omaha simplified?)
- [ ] Leaderboard (local, no server)
- [ ] Daily challenge mode
- [ ] Accessibility: VoiceOver support, high contrast mode

---

## Architecture Summary

```
Screen: home → map → play → quiz → reward → (loop)
                       ↓
Phase:  idle → preflop → flop → turn → river → showdown → result
```

**Key files:**
- `src/App.jsx` — entire game (single-file component)
- `index.html` — PWA meta tags, safe-area insets
- `public/sw.js` — service worker
- `public/manifest.json` — PWA manifest

**State persistence:** localStorage key `holdem-kids`
**Deployment:** Vercel (auto-deploys from `main`)
**Live:** https://poker-for-toddler.vercel.app
