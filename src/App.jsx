import { useState, useCallback, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   TEXAS HOLD'EM FOR KIDS — Ages 4-9
   Teaches real Texas Hold'em through toy-based metaphors & progressive levels
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── CARD CONSTANTS ────────────────────────────────────────────────────────
const SUITS = {
  "♥": { color: "#FF4757", name: "Hearts", emoji: "❤️" },
  "♦": { color: "#FF6B35", name: "Diamonds", emoji: "💎" },
  "♣": { color: "#2d3436", name: "Clubs", emoji: "🍀" },
  "♠": { color: "#2d3436", name: "Spades", emoji: "🖤" },
};
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RANK_NUM = { 2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14 };

// ─── TOY CURRENCY ──────────────────────────────────────────────────────────
const TOYS = [
  { id: "star",    emoji: "⭐", name: "Star",       value: 1 },
  { id: "car",     emoji: "🚗", name: "Toy Car",    value: 2 },
  { id: "unicorn", emoji: "🦄", name: "Unicorn",    value: 3 },
  { id: "gem",     emoji: "💎", name: "Gem",         value: 5 },
  { id: "crown",   emoji: "👑", name: "Crown",       value: 10 },
];

// ─── HAND RANKINGS (all 10 Hold'em hands) ──────────────────────────────────
const HAND_RANKS = [
  { rank:10, name:"Royal Flush",    emoji:"👑✨", desc:"A-K-Q-J-10, all same color!", color:"#FFD700", kidDesc:"The ULTIMATE treasure! Like finding a golden crown!" },
  { rank:9,  name:"Straight Flush", emoji:"🌈",   desc:"5 in a row, all same color!", color:"#FF6B81", kidDesc:"A rainbow of cards all in order — super rare!" },
  { rank:8,  name:"Four of a Kind", emoji:"🎯",   desc:"4 cards that match!",         color:"#e17055", kidDesc:"Like finding 4 matching toy cars!" },
  { rank:7,  name:"Full House",     emoji:"🏠",   desc:"3 matching + 2 matching!",    color:"#6c5ce7", kidDesc:"A full house — 3 friends + 2 more!" },
  { rank:6,  name:"Flush",          emoji:"🎨",   desc:"5 cards, all same color!",    color:"#00b894", kidDesc:"All the same color — like a matching outfit!" },
  { rank:5,  name:"Straight",       emoji:"🛤️",   desc:"5 cards in a row!",           color:"#0984e3", kidDesc:"Cards in order — like counting stairs!" },
  { rank:4,  name:"Three of a Kind",emoji:"🎲",   desc:"3 cards that match!",         color:"#fdcb6e", kidDesc:"3 matching toys — a triple treat!" },
  { rank:3,  name:"Two Pair",       emoji:"👟👟", desc:"2 matching + 2 more matching!",color:"#a29bfe", kidDesc:"Two pairs of matching socks!" },
  { rank:2,  name:"One Pair",       emoji:"👯",   desc:"2 cards that match!",         color:"#74b9ff", kidDesc:"Twins! Two cards that are the same!" },
  { rank:1,  name:"High Card",      emoji:"☝️",   desc:"Your biggest card!",          color:"#b2bec3", kidDesc:"No matches yet — your tallest card stands up!" },
];

// ─── LEVEL SYSTEM (4 Worlds) ───────────────────────────────────────────────
const WORLDS = [
  { name:"Card Kingdom",   emoji:"🏰", color:"#2ED573", bg:"linear-gradient(150deg,#d4fde4,#a8e6cf)", desc:"Learn your cards!" },
  { name:"Pattern Palace",  emoji:"🎪", color:"#6c5ce7", bg:"linear-gradient(150deg,#ede7ff,#c2c2ff)", desc:"Spot amazing patterns!" },
  { name:"Toy Market",      emoji:"🧸", color:"#FFA502", bg:"linear-gradient(150deg,#fff9e6,#ffecd2)", desc:"Trade & bet with toys!" },
  { name:"Champion Arena",  emoji:"🏆", color:"#FF4757", bg:"linear-gradient(150deg,#ffe8e0,#ffc2c7)", desc:"Become a champion!" },
];

const LEVELS = [
  // World 1: Card Kingdom — Learn cards, suits, values
  { id:1,  world:0, name:"Meet the Cards",     rounds:3, phase:"flop",  betting:false, quiz:"card-value",   desc:"Learn what each card is worth!" },
  { id:2,  world:0, name:"Red or Black?",      rounds:3, phase:"flop",  betting:false, quiz:"suit-color",   desc:"Sort cards by color!" },
  { id:3,  world:0, name:"Who's Taller?",      rounds:4, phase:"flop",  betting:false, quiz:"compare",      desc:"Which card is bigger?" },
  { id:4,  world:0, name:"Royal Friends",       rounds:4, phase:"flop",  betting:false, quiz:"face-cards",   desc:"Meet Jack, Queen, King, Ace!" },
  { id:5,  world:0, name:"Castle Challenge",    rounds:5, phase:"flop",  betting:false, quiz:"mixed-basic",  desc:"Show what you learned!" },
  // World 2: Pattern Palace — Hand recognition
  { id:6,  world:1, name:"Find the Twins",      rounds:3, phase:"flop",  betting:false, quiz:"spot-pair",    desc:"Spot matching cards!" },
  { id:7,  world:1, name:"Color Match",          rounds:4, phase:"turn",  betting:false, quiz:"spot-flush",   desc:"Find cards of the same suit!" },
  { id:8,  world:1, name:"Counting Stairs",      rounds:4, phase:"turn",  betting:false, quiz:"spot-straight",desc:"Cards in order — like stairs!" },
  { id:9,  world:1, name:"Full House Party",     rounds:4, phase:"river", betting:false, quiz:"spot-hand",    desc:"Three friends + two more!" },
  { id:10, world:1, name:"Pattern Master",       rounds:5, phase:"river", betting:false, quiz:"best-hand",    desc:"Find the best hand possible!" },
  // World 3: Toy Market — Betting with toys
  { id:11, world:2, name:"The Toy Box",          rounds:3, phase:"river", betting:true,  quiz:null,           desc:"Bet your toys wisely!" },
  { id:12, world:2, name:"Check or Bet?",        rounds:4, phase:"river", betting:true,  quiz:"bet-decision", desc:"When to bet, when to wait!" },
  { id:13, world:2, name:"Brave or Careful?",    rounds:4, phase:"river", betting:true,  quiz:"risk-reward",  desc:"Is it worth the risk?" },
  { id:14, world:2, name:"Bluff Busters",        rounds:4, phase:"river", betting:true,  quiz:"read-board",   desc:"What could they have?" },
  { id:15, world:2, name:"Market Boss",           rounds:5, phase:"river", betting:true,  quiz:null,           desc:"Use everything you know!" },
  // World 4: Champion Arena — Full game
  { id:16, world:3, name:"Real Deal",             rounds:4, phase:"river", betting:true,  quiz:null,           desc:"Play real Texas Hold'em!" },
  { id:17, world:3, name:"Position Power",        rounds:4, phase:"river", betting:true,  quiz:"position",     desc:"Where you sit matters!" },
  { id:18, world:3, name:"Read the Table",        rounds:5, phase:"river", betting:true,  quiz:"read-board",   desc:"Use the clues on the table!" },
  { id:19, world:3, name:"Tournament Time",       rounds:5, phase:"river", betting:true,  quiz:null,           desc:"Win the big tournament!" },
  { id:20, world:3, name:"Grand Champion",        rounds:7, phase:"river", betting:true,  quiz:"mixed-all",    desc:"The ultimate challenge!" },
];

// ─── BADGES ────────────────────────────────────────────────────────────────
const BADGE_DEFS = [
  { id:"first-win",     emoji:"🎉", name:"First Win!",       desc:"Win your first hand" },
  { id:"card-learner",  emoji:"📚", name:"Card Learner",     desc:"Complete Card Kingdom" },
  { id:"pattern-pro",   emoji:"🔍", name:"Pattern Pro",      desc:"Complete Pattern Palace" },
  { id:"toy-trader",    emoji:"🧸", name:"Toy Trader",       desc:"Complete Toy Market" },
  { id:"pair-spotter",  emoji:"👯", name:"Pair Spotter",     desc:"Find 10 pairs" },
  { id:"flush-finder",  emoji:"🎨", name:"Flush Finder",     desc:"Make a flush" },
  { id:"straight-star", emoji:"🛤️", name:"Straight Star",   desc:"Make a straight" },
  { id:"full-house",    emoji:"🏠", name:"House Builder",    desc:"Make a full house" },
  { id:"quiz-whiz",     emoji:"🧠", name:"Quiz Whiz",        desc:"Answer 20 quizzes right" },
  { id:"fire-streak",   emoji:"🔥", name:"Fire Streak!",     desc:"Win 5 hands in a row" },
  { id:"toy-rich",      emoji:"💎", name:"Toy Collector",    desc:"Collect 100 toys" },
  { id:"champion",      emoji:"👑", name:"Grand Champion",   desc:"Beat all 20 levels" },
];

// ─── SAVE / LOAD ───────────────────────────────────────────────────────────
const DEFAULT_SAVE = { toys:20, level:1, streak:0, bestStreak:0, badges:[], totalHands:0, quizCorrect:0, pairsFound:0, flushes:0, straights:0, fullHouses:0, totalToysEarned:0 };
const TOY_FLOOR = 10;

function loadGame() {
  try { return { ...DEFAULT_SAVE, ...JSON.parse(localStorage.getItem("holdem-kids")) }; }
  catch { return { ...DEFAULT_SAVE }; }
}
function saveGame(g) { localStorage.setItem("holdem-kids", JSON.stringify(g)); }

// ─── DECK & HAND EVALUATION ───────────────────────────────────────────────
function freshDeck() {
  const d = [];
  for (const s of Object.keys(SUITS)) for (const r of RANKS) d.push({ suit:s, rank:r });
  return d.sort(() => Math.random() - 0.5);
}

function isRed(c) { return c.suit === "♥" || c.suit === "♦"; }

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
  const without = getCombinations(rest, k);
  return [...withFirst, ...without];
}

function evaluateHand5(cards) {
  const sorted = [...cards].sort((a, b) => RANK_NUM[b.rank] - RANK_NUM[a.rank]);
  const vals = sorted.map(c => RANK_NUM[c.rank]);
  const suits = sorted.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const unique = [...new Set(vals)];

  // Check straight (including A-low: A-2-3-4-5)
  let isStraight = false, straightHigh = 0;
  if (unique.length === 5) {
    if (vals[0] - vals[4] === 4) { isStraight = true; straightHigh = vals[0]; }
    else if (vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2) {
      isStraight = true; straightHigh = 5; // wheel
    }
  }

  // Count ranks
  const counts = {};
  vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const groups = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  if (isFlush && isStraight && straightHigh === 14) return { rank:10, name:"Royal Flush", kickers:vals, cards:sorted };
  if (isFlush && isStraight) return { rank:9, name:"Straight Flush", kickers:[straightHigh], cards:sorted };
  if (groups[0][1] === 4) return { rank:8, name:"Four of a Kind", kickers:[+groups[0][0], +groups[1][0]], cards:sorted };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { rank:7, name:"Full House", kickers:[+groups[0][0], +groups[1][0]], cards:sorted };
  if (isFlush) return { rank:6, name:"Flush", kickers:vals, cards:sorted };
  if (isStraight) return { rank:5, name:"Straight", kickers:[straightHigh], cards:sorted };
  if (groups[0][1] === 3) return { rank:4, name:"Three of a Kind", kickers:[+groups[0][0], ...vals.filter(v => v !== +groups[0][0])], cards:sorted };
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const p1 = Math.max(+groups[0][0], +groups[1][0]), p2 = Math.min(+groups[0][0], +groups[1][0]);
    const kick = vals.find(v => v !== p1 && v !== p2);
    return { rank:3, name:"Two Pair", kickers:[p1, p2, kick], cards:sorted };
  }
  if (groups[0][1] === 2) return { rank:2, name:"One Pair", kickers:[+groups[0][0], ...vals.filter(v => v !== +groups[0][0])], cards:sorted };
  return { rank:1, name:"High Card", kickers:vals, cards:sorted };
}

function bestHand(holeCards, community) {
  const all = [...holeCards, ...community];
  if (all.length < 5) {
    // Evaluate what we can (for partial boards)
    if (all.length < 2) return { rank:0, name:"—", kickers:[], cards:all };
    // Pad evaluation for fewer cards
    const sorted = [...all].sort((a, b) => RANK_NUM[b.rank] - RANK_NUM[a.rank]);
    const vals = sorted.map(c => RANK_NUM[c.rank]);
    const counts = {};
    vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const groups = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    if (groups[0][1] >= 4) return { rank:8, name:"Four of a Kind", kickers:vals, cards:sorted };
    if (groups[0][1] === 3 && groups.length > 1 && groups[1][1] >= 2) return { rank:7, name:"Full House", kickers:vals, cards:sorted };
    if (groups[0][1] === 3) return { rank:4, name:"Three of a Kind", kickers:vals, cards:sorted };
    if (groups[0][1] === 2 && groups.length > 1 && groups[1][1] === 2) return { rank:3, name:"Two Pair", kickers:vals, cards:sorted };
    if (groups[0][1] === 2) return { rank:2, name:"One Pair", kickers:vals, cards:sorted };
    return { rank:1, name:"High Card", kickers:vals, cards:sorted };
  }
  const combos = getCombinations(all, 5);
  let best = null;
  for (const combo of combos) {
    const ev = evaluateHand5(combo);
    if (!best || ev.rank > best.rank || (ev.rank === best.rank && compareKickers(ev.kickers, best.kickers) > 0)) best = ev;
  }
  return best;
}

function compareKickers(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
}

function compareResults(pRes, dRes) {
  if (pRes.rank > dRes.rank) return "win";
  if (pRes.rank < dRes.rank) return "lose";
  const k = compareKickers(pRes.kickers, dRes.kickers);
  return k > 0 ? "win" : k < 0 ? "lose" : "push";
}

// ─── QUIZ GENERATOR ────────────────────────────────────────────────────────
function generateQuiz(type, hole, community, dealerHole) {
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const allCards = [...hole, ...community];

  switch (type) {
    case "card-value": {
      const c = rand(allCards);
      const v = RANK_NUM[c.rank];
      const w1 = Math.min(14, v + randInt(1, 3)), w2 = Math.max(2, v - randInt(1, 3));
      const opts = [v, w1, w2].filter((x, i, a) => a.indexOf(x) === i).sort(() => Math.random() - 0.5);
      return { q: `How much is ${c.rank}${c.suit} worth?`, emoji: "🔢", options: opts.map(String), answer: opts.indexOf(v), explain: c.rank === "A" ? "Ace is the highest — worth 14!" : ["J","Q","K"].includes(c.rank) ? `${c.rank} is a royal card!` : `${c.rank} is worth ${v}!` };
    }
    case "suit-color": {
      const c = rand(allCards);
      const red = isRed(c);
      return { q: `Is ${c.rank}${c.suit} red or black?`, emoji: "🎨", options: ["Red ❤️", "Black 🖤"], answer: red ? 0 : 1, explain: red ? `${SUITS[c.suit].name} are red!` : `${SUITS[c.suit].name} are black!` };
    }
    case "compare": {
      if (allCards.length < 2) return null;
      const [a, b] = [allCards[0], allCards[1]];
      const va = RANK_NUM[a.rank], vb = RANK_NUM[b.rank];
      const bigger = va >= vb ? 0 : 1;
      return { q: `Which is bigger: ${a.rank}${a.suit} or ${b.rank}${b.suit}?`, emoji: "⚖️", options: [`${a.rank}${a.suit} (=${va})`, `${b.rank}${b.suit} (=${vb})`], answer: bigger, explain: `${va >= vb ? a.rank : b.rank} is worth ${Math.max(va, vb)}!` };
    }
    case "face-cards": {
      const faces = [["J","Jack",11],["Q","Queen",12],["K","King",13],["A","Ace",14]];
      const [r, n, v] = rand(faces);
      const w = [v + randInt(1,2), v - randInt(1,2)].filter(x => x >= 2 && x <= 14);
      const opts = [v, ...w].slice(0, 3).sort(() => Math.random() - 0.5);
      return { q: `How strong is the ${n} (${r})?`, emoji: "👑", options: opts.map(String), answer: opts.indexOf(v), explain: `The ${n} is worth ${v}!` };
    }
    case "spot-pair": {
      const hand = bestHand(hole, community);
      const hasPair = hand.rank >= 2;
      return { q: "Can you spot a pair (two matching cards)?", emoji: "👀", options: ["Yes! I see a pair! 👯", "No pairs here 🤷"], answer: hasPair ? 0 : 1, explain: hasPair ? `Great eye! ${hand.name}!` : "No matching pairs this time!" };
    }
    case "spot-flush": {
      const suitCounts = {};
      allCards.forEach(c => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1; });
      const maxSuit = Math.max(...Object.values(suitCounts));
      const close = maxSuit >= 3;
      return { q: `Do you see 3 or more cards of the same suit?`, emoji: "🎨", options: ["Yes! Same suit! 🎨", "Not yet! 🔍"], answer: close ? 0 : 1, explain: close ? `${maxSuit} cards of the same suit — that could become a Flush!` : "Keep looking — a Flush needs 5 of the same suit!" };
    }
    case "spot-straight": {
      const vals = [...new Set(allCards.map(c => RANK_NUM[c.rank]))].sort((a, b) => a - b);
      let maxRun = 1, run = 1;
      for (let i = 1; i < vals.length; i++) { if (vals[i] === vals[i-1]+1) { run++; maxRun = Math.max(maxRun, run); } else run = 1; }
      const close = maxRun >= 3;
      return { q: "Do you see 3 or more cards in a row (like stairs)?", emoji: "🛤️", options: ["Yes! Staircase! 🛤️", "Not quite 🤔"], answer: close ? 0 : 1, explain: close ? `${maxRun} cards in a row — a Straight needs 5!` : "No staircase yet. A Straight is 5 in a row!" };
    }
    case "spot-hand":
    case "best-hand": {
      const hand = bestHand(hole, community);
      const info = HAND_RANKS.find(h => h.name === hand.name) || HAND_RANKS[9];
      const wrong1 = HAND_RANKS[Math.min(9, HAND_RANKS.findIndex(h => h.name === hand.name) + randInt(1, 3))];
      const wrong2 = HAND_RANKS[Math.max(0, HAND_RANKS.findIndex(h => h.name === hand.name) - randInt(1, 2))];
      const opts = [info.name, wrong1.name, wrong2.name].filter((x, i, a) => a.indexOf(x) === i).sort(() => Math.random() - 0.5);
      return { q: "What's the best hand you can make?", emoji: "🏆", options: opts, answer: opts.indexOf(info.name), explain: `${info.emoji} ${info.name} — ${info.kidDesc}` };
    }
    case "bet-decision": {
      const hand = bestHand(hole, community);
      const strong = hand.rank >= 4;
      return { q: `You have ${hand.name}. Should you bet more toys?`, emoji: "🧸", options: ["Yes! Bet big! 🚀", "Better to be careful 🐢"], answer: strong ? 0 : 1, explain: strong ? `${hand.name} is strong — worth betting!` : `${hand.name} is okay, but be careful with your toys!` };
    }
    case "risk-reward": {
      const toyCount = randInt(5, 20);
      const betSize = randInt(3, 8);
      const good = betSize <= toyCount * 0.3;
      return { q: `You have ${toyCount} toys. Bet ${betSize}?`, emoji: "⚖️", options: [`Sure! ${betSize} isn't too many! 👍`, `Too risky! Save my toys! 🛡️`], answer: good ? 0 : 1, explain: good ? `Smart! ${betSize} out of ${toyCount} is a safe bet!` : `${betSize} out of ${toyCount} is a lot — save your toys for a better hand!` };
    }
    case "read-board": {
      const suitCounts = {};
      community.forEach(c => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1; });
      const flushDanger = Math.max(...Object.values(suitCounts)) >= 3;
      return { q: "Look at the shared cards. Could someone have a Flush?", emoji: "🔍", options: ["Yes! Lots of same suit! ⚠️", "Nah, all mixed up! ✅"], answer: flushDanger ? 0 : 1, explain: flushDanger ? "Watch out! Many cards of the same suit — someone might have a Flush!" : "All mixed suits — a Flush is unlikely!" };
    }
    case "position": {
      return { q: "In poker, when is it best to bet?", emoji: "🪑", options: ["Go last — see what others do! 👀", "Go first — be brave! 💪"], answer: 0, explain: "Going last is the best! You get to see what everyone else does first — like being the detective!" };
    }
    default: { // mixed-basic, mixed-all
      const pool = type === "mixed-basic" ? ["card-value","suit-color","compare","face-cards"] : ["spot-pair","spot-flush","best-hand","bet-decision","read-board","risk-reward"];
      return generateQuiz(rand(pool), hole, community, dealerHole);
    }
  }
}

// ─── REUSABLE COMPONENTS ───────────────────────────────────────────────────
function Confetti({ on }) {
  if (!on) return null;
  const colors = ["#FF4757","#FFA502","#2ED573","#1E90FF","#FF6B81","#ECCC68","#a29bfe","#fd79a8","#FFD700"];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      {Array.from({length:70},(_,i)=>(
        <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:"-30px",width:10+Math.random()*12,height:10+Math.random()*12,background:colors[i%colors.length],borderRadius:i%3===0?"50%":"3px",animation:`cffall ${1.5+Math.random()*2}s ${Math.random()*0.8}s ease-in forwards`,transform:`rotate(${Math.random()*360}deg)`}}/>
      ))}
    </div>
  );
}

function CardSprite({ card, hidden=false, highlight=false, small=false, used=false }) {
  const s = SUITS[card.suit];
  const w = small ? 60 : 80, h = small ? 88 : 118;
  return (
    <div style={{
      width:w, height:h,
      background: hidden ? "linear-gradient(135deg,#6c5ce7,#a29bfe)" : "white",
      borderRadius: small ? 12 : 16,
      boxShadow: highlight ? "0 0 0 4px #FFD700, 0 8px 24px rgba(255,215,0,0.4)" : used ? "0 0 0 3px #2ED57388, 0 6px 16px rgba(0,0,0,0.15)" : "0 4px 14px rgba(0,0,0,0.15)",
      border: `2px solid ${highlight ? "#FFD700" : "rgba(255,255,255,0.9)"}`,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      position:"relative", flexShrink:0,
      animation: highlight ? "pulse 1.2s infinite" : "none",
      opacity: used ? 0.7 : 1,
    }}>
      {hidden ? <span style={{fontSize: small ? 24 : 32}}>🎴</span> : (
        <>
          <div style={{position:"absolute",top:small?3:5,left:small?5:7,lineHeight:1}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:small?13:16,color:s.color}}>{card.rank}</div>
            <div style={{fontSize:small?10:12,color:s.color}}>{card.suit}</div>
          </div>
          <div style={{fontSize:small?28:36,color:s.color,lineHeight:1}}>{card.suit}</div>
          <div style={{position:"absolute",bottom:small?3:5,right:small?5:7,textAlign:"right",transform:"rotate(180deg)",lineHeight:1}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:small?13:16,color:s.color}}>{card.rank}</div>
            <div style={{fontSize:small?10:12,color:s.color}}>{card.suit}</div>
          </div>
        </>
      )}
    </div>
  );
}

function ToyDisplay({ toys }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.85)",borderRadius:20,padding:"6px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
      <span style={{fontSize:18}}>🧸</span>
      <span style={{fontFamily:"'Fredoka One',cursive",fontSize:17,color:"#FFA502"}}>{toys}</span>
      <span style={{fontSize:11,fontWeight:800,color:"#636e72"}}>toys</span>
    </div>
  );
}

function ProgressBar({ current, total, color="#2ED573" }) {
  return (
    <div style={{width:"100%",height:14,background:"rgba(0,0,0,0.08)",borderRadius:10,overflow:"hidden",position:"relative"}}>
      <div style={{width:`${Math.min(100,(current/total)*100)}%`,height:"100%",background:color,borderRadius:10,transition:"width 0.4s ease"}}/>
      <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",fontSize:10,color:"white",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{current}/{total}</span>
    </div>
  );
}

function HandRankBadge({ result }) {
  if (!result || !result.name || result.name === "—") return null;
  const info = HAND_RANKS.find(h => h.name === result.name);
  if (!info) return null;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${info.color}18`,borderRadius:14,padding:"6px 14px",border:`2px solid ${info.color}33`,animation:"fadeup .3s ease"}}>
      <span style={{fontSize:20}}>{info.emoji}</span>
      <span style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:info.color}}>{info.name}</span>
    </div>
  );
}

// ─── SCREENS ───────────────────────────────────────────────────────────────
function HomeScreen({ game, onAdventure, onFreePlay, onBadges, onHandGuide }) {
  return (
    <div style={{textAlign:"center",padding:"16px 10px",animation:"fadeup .5s ease"}}>
      <div style={{fontSize:56,animation:"bounce 2s infinite",display:"inline-block"}}>🃏</div>
      <h1 style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(24px,6vw,40px)",color:"#2d3436",textShadow:"2px 2px 0 rgba(255,255,255,0.6)",lineHeight:1.2,margin:"4px 0"}}>Texas Hold'em</h1>
      <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(16px,3.5vw,22px)",color:"#6c5ce7",marginBottom:4}}>for Kids!</h2>
      <p style={{fontWeight:800,color:"#636e72",fontSize:14,marginBottom:16}}>Learn real poker with toy cars, gems & crowns!</p>

      <ToyDisplay toys={game.toys}/>

      <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
        <button className="btn" onClick={onAdventure} style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"16px 48px",fontSize:22,animation:"glow 1.8s infinite",boxShadow:"0 8px 24px rgba(255,107,53,.4)",width:"100%",maxWidth:300}}>
          🏰 Adventure!
        </button>
        <button className="btn" onClick={onFreePlay} style={{background:"linear-gradient(135deg,#2ED573,#00b894)",padding:"12px 36px",fontSize:17,width:"100%",maxWidth:300}}>
          🎮 Free Play
        </button>
        <div style={{display:"flex",gap:10,width:"100%",maxWidth:300}}>
          <button className="btn" onClick={onHandGuide} style={{flex:1,background:"rgba(255,255,255,0.85)",color:"#2d3436",padding:"10px 12px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)"}}>
            📖 Hands
          </button>
          <button className="btn" onClick={onBadges} style={{flex:1,background:"rgba(255,255,255,0.85)",color:"#2d3436",padding:"10px 12px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)"}}>
            🏅 {game.badges.length}/{BADGE_DEFS.length}
          </button>
        </div>
      </div>
      {game.level > 1 && (
        <p style={{marginTop:14,fontFamily:"'Fredoka One',cursive",fontSize:13,color:"#6c5ce7"}}>
          Level {game.level} — {LEVELS[Math.min(game.level, 20) - 1].name}
        </p>
      )}
    </div>
  );
}

function HandGuideScreen({ onBack }) {
  return (
    <div style={{padding:"10px 0",animation:"fadeup .4s ease"}}>
      <button className="btn" onClick={onBack} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"8px 16px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)",marginBottom:12}}>← Back</button>
      <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:"#2d3436",textAlign:"center",marginBottom:12}}>🃏 Poker Hands — Best to Worst!</h2>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {HAND_RANKS.map((h, i) => (
          <div key={h.name} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.9)",borderRadius:16,padding:"10px 14px",border:`2px solid ${h.color}33`}}>
            <div style={{width:32,height:32,borderRadius:10,background:h.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",fontSize:14,flexShrink:0}}>{10 - i}</div>
            <span style={{fontSize:26,flexShrink:0}}>{h.emoji}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:h.color}}>{h.name}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#636e72"}}>{h.kidDesc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff9e6",borderRadius:16,padding:14,marginTop:12,textAlign:"center",border:"2px solid #FFA50233"}}>
        <p style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#2d3436",lineHeight:1.6}}>
          🧸 In our game, you bet with <b>toy cars 🚗</b>, <b>gems 💎</b>, and <b>crowns 👑</b> instead of money!
          <br/>The higher your hand, the more toys you win!
        </p>
      </div>
    </div>
  );
}

function WorldMap({ game, onSelect, onBack }) {
  return (
    <div style={{padding:"10px 0",animation:"fadeup .4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <button className="btn" onClick={onBack} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"8px 16px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)"}}>← Back</button>
        <ToyDisplay toys={game.toys}/>
      </div>
      {WORLDS.map((w, wi) => (
        <div key={wi} style={{marginBottom:16,background:w.bg,borderRadius:22,padding:14,border:"3px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 24px rgba(0,0,0,0.08)"}}>
          <h3 style={{fontFamily:"'Fredoka One',cursive",fontSize:19,color:w.color,marginBottom:4}}>{w.emoji} {w.name}</h3>
          <p style={{fontSize:12,fontWeight:700,color:"#636e72",marginBottom:10}}>{w.desc}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {LEVELS.filter(l => l.world === wi).map(lvl => {
              const unlocked = lvl.id <= game.level, completed = lvl.id < game.level;
              return (
                <button key={lvl.id} className="btn" onClick={() => unlocked && onSelect(lvl.id)}
                  style={{width:72,height:72,borderRadius:16,background:completed?w.color:unlocked?"white":"rgba(0,0,0,0.08)",color:completed?"white":unlocked?w.color:"#b2bec3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,border:unlocked?`3px solid ${w.color}`:"3px solid transparent",opacity:unlocked?1:0.45,cursor:unlocked?"pointer":"default",boxShadow:unlocked?"0 4px 12px rgba(0,0,0,0.1)":"none"}}>
                  <span style={{fontFamily:"'Fredoka One',cursive",fontSize:18}}>{completed?"✅":unlocked?lvl.id:"🔒"}</span>
                  <span style={{fontSize:8,fontWeight:800,lineHeight:1.1,textAlign:"center",padding:"0 2px"}}>{lvl.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BadgesScreen({ game, onBack }) {
  return (
    <div style={{padding:"10px 0",animation:"fadeup .4s ease"}}>
      <button className="btn" onClick={onBack} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"8px 16px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)",marginBottom:12}}>← Back</button>
      <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:"#2d3436",textAlign:"center",marginBottom:12}}>🏅 Badge Collection</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
        {BADGE_DEFS.map(b => {
          const earned = game.badges.includes(b.id);
          return (
            <div key={b.id} style={{textAlign:"center",background:earned?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.04)",borderRadius:18,padding:"14px 10px",border:earned?"2px solid #2ED57344":"2px solid transparent",opacity:earned?1:0.45}}>
              <div style={{fontSize:36,marginBottom:4}}>{earned ? b.emoji : "❓"}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:earned?"#2d3436":"#b2bec3"}}>{earned ? b.name : "???"}</div>
              <div style={{fontSize:10,fontWeight:700,color:"#636e72",marginTop:2}}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizScreen({ quiz, onAnswer }) {
  const [picked, setPicked] = useState(null);
  if (!quiz) return null;
  const correct = picked === quiz.answer;
  return (
    <div style={{textAlign:"center",padding:"14px 0",animation:"fadeup .3s ease"}}>
      <span style={{fontSize:40,display:"inline-block",animation:"wiggle 1.2s infinite"}}>{quiz.emoji}</span>
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:19,color:"#2d3436",margin:"10px 0 14px",lineHeight:1.4}}>{quiz.q}</p>
      <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
        {quiz.options.map((opt, i) => (
          <button key={i} className="btn" disabled={picked !== null}
            onClick={() => { setPicked(i); setTimeout(() => onAnswer(i === quiz.answer), 1400); }}
            style={{width:"100%",maxWidth:300,padding:"13px 18px",fontSize:17,
              background: picked === null ? "white" : i === quiz.answer ? "#d4fde4" : picked === i ? "#ffe8e0" : "white",
              color:"#2d3436", border: picked === i ? (correct ? "3px solid #2ED573" : "3px solid #FF4757") : i === quiz.answer && picked !== null ? "3px solid #2ED573" : "3px solid rgba(0,0,0,0.06)",
              boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div style={{marginTop:12,padding:"10px 14px",borderRadius:16,background:correct?"#d4fde4":"#ffe8e0",animation:"fadeup .3s ease"}}>
          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:17,color:correct?"#2ED573":"#e17055"}}>{correct ? "⭐ Correct!" : "Not quite!"}</p>
          <p style={{fontSize:13,fontWeight:700,color:"#636e72",marginTop:4}}>{quiz.explain}</p>
        </div>
      )}
    </div>
  );
}

function BettingPanel({ toys, minBet, onBet, onCheck, onFold, canCheck }) {
  const bets = [1, 2, 5].filter(b => b <= toys && b >= minBet);
  return (
    <div style={{textAlign:"center",padding:"10px 0",animation:"fadeup .3s ease"}}>
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:"#6c5ce7",marginBottom:10}}>
        🧸 What do you want to do?
      </p>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        {canCheck && (
          <button className="btn" onClick={onCheck} style={{background:"linear-gradient(135deg,#74b9ff,#0984e3)",padding:"11px 20px",fontSize:15}}>
            ✋ Check
          </button>
        )}
        {bets.map(b => (
          <button key={b} className="btn" onClick={() => onBet(b)}
            style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"11px 20px",fontSize:15}}>
            🧸 Bet {b} {b === 1 ? "toy" : "toys"}
          </button>
        ))}
        <button className="btn" onClick={onFold} style={{background:"rgba(0,0,0,0.08)",color:"#636e72",padding:"11px 20px",fontSize:15}}>
          🏃 Fold
        </button>
      </div>
    </div>
  );
}

function RewardScreen({ toysEarned, newBadge, levelComplete, onContinue }) {
  return (
    <div style={{textAlign:"center",padding:"20px 10px",animation:"cpop .45s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div style={{fontSize:56,animation:"bounce .9s infinite",display:"inline-block"}}>🎉</div>
      <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:"#2ED573",marginTop:8}}>
        {levelComplete ? "Level Complete!" : "Great Hand!"}
      </h2>
      {toysEarned > 0 && (
        <div style={{margin:"14px 0",display:"flex",justifyContent:"center",gap:4}}>
          {Array.from({length:Math.min(toysEarned, 10)},(_,i)=>(
            <span key={i} style={{fontSize:30,animation:`cpop .4s ${i*0.1}s cubic-bezier(0.34,1.56,0.64,1) both`}}>🧸</span>
          ))}
        </div>
      )}
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:"#FFA502"}}>+{toysEarned} toys!</p>
      {newBadge && (
        <div style={{marginTop:12,background:"#fff9e6",borderRadius:18,padding:"12px 20px",display:"inline-block",border:"2px solid #FFA50244",animation:"fadeup .4s .2s ease both"}}>
          <span style={{fontSize:34}}>{newBadge.emoji}</span>
          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:"#2d3436"}}>New Badge: {newBadge.name}</p>
        </div>
      )}
      <div style={{marginTop:18}}>
        <button className="btn" onClick={onContinue} style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"14px 38px",fontSize:19,animation:"glow 1.8s infinite"}}>
          {levelComplete ? "🗺️ Next Level!" : "▶️ Continue"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
const OUTCOMES = {
  win:  { emoji:"🎉", msg:"You WIN! Amazing job!", color:"#00b894", bg:"#d4fde4" },
  lose: { emoji:"😮", msg:"Dealer wins this time!", color:"#e17055", bg:"#ffe8e0" },
  push: { emoji:"🤝", msg:"It's a tie! Great game!", color:"#6c5ce7", bg:"#ede7ff" },
  fold: { emoji:"🐢", msg:"Smart fold! Save your toys!", color:"#636e72", bg:"#f0f0f0" },
};

export default function App() {
  const [game, setGame] = useState(loadGame);
  const [screen, setScreen] = useState("home");
  // Play state
  const [deck, setDeck] = useState([]);
  const [hole, setHole] = useState([]);
  const [dealerHole, setDealerHole] = useState([]);
  const [community, setCommunity] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | preflop | flop | turn | river | showdown | result
  const [outcome, setOutcome] = useState("");
  const [confetti, setConfetti] = useState(false);
  const [pot, setPot] = useState(0);
  const [playerBet, setPlayerBet] = useState(0);
  const [dealerBet, setDealerBet] = useState(0);
  const [folded, setFolded] = useState(false);
  // Level play
  const [currentLevel, setCurrentLevel] = useState(null);
  const [roundNum, setRoundNum] = useState(0);
  const [roundToys, setRoundToys] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [freePlay, setFreePlay] = useState(false);
  // Reveal stage tracking
  const [revealedCommunity, setRevealedCommunity] = useState(0); // 0,3,4,5

  useEffect(() => { saveGame(game); }, [game]);

  const updateGame = useCallback((u) => {
    setGame(g => { const n = { ...g, ...u }; if (n.toys < TOY_FLOOR) n.toys = TOY_FLOOR; return n; });
  }, []);

  const checkNewBadges = useCallback((g) => {
    const earn = [];
    if (!g.badges.includes("first-win") && g.totalHands > 0) earn.push("first-win");
    if (!g.badges.includes("card-learner") && g.level > 5) earn.push("card-learner");
    if (!g.badges.includes("pattern-pro") && g.level > 10) earn.push("pattern-pro");
    if (!g.badges.includes("toy-trader") && g.level > 15) earn.push("toy-trader");
    if (!g.badges.includes("pair-spotter") && g.pairsFound >= 10) earn.push("pair-spotter");
    if (!g.badges.includes("flush-finder") && g.flushes > 0) earn.push("flush-finder");
    if (!g.badges.includes("straight-star") && g.straights > 0) earn.push("straight-star");
    if (!g.badges.includes("full-house") && g.fullHouses > 0) earn.push("full-house");
    if (!g.badges.includes("quiz-whiz") && g.quizCorrect >= 20) earn.push("quiz-whiz");
    if (!g.badges.includes("fire-streak") && g.streak >= 5) earn.push("fire-streak");
    if (!g.badges.includes("toy-rich") && g.totalToysEarned >= 100) earn.push("toy-rich");
    if (!g.badges.includes("champion") && g.level > 20) earn.push("champion");
    return earn;
  }, []);

  // ─── DEAL A NEW HAND ────
  const dealHand = useCallback(() => {
    const d = freshDeck();
    const h = [d.pop(), d.pop()];
    const dh = [d.pop(), d.pop()];
    const c = [d.pop(), d.pop(), d.pop(), d.pop(), d.pop()]; // all 5 community pre-dealt
    setDeck(d); setHole(h); setDealerHole(dh); setCommunity(c);
    setPhase("preflop"); setOutcome(""); setConfetti(false);
    setFolded(false); setRevealedCommunity(0);

    // Auto-post blinds for betting levels
    const lvl = currentLevel;
    if (lvl && lvl.betting) {
      const blind = 1;
      setPot(blind * 2); setPlayerBet(blind); setDealerBet(blind);
      updateGame({ toys: game.toys - blind });
    } else {
      setPot(0); setPlayerBet(0); setDealerBet(0);
    }
  }, [currentLevel, game.toys, updateGame]);

  const startLevel = useCallback((id) => {
    const lvl = LEVELS[id - 1];
    setCurrentLevel(lvl); setRoundNum(0); setRoundToys(0); setFreePlay(false);
    setScreen("play"); setPhase("idle");
  }, []);

  const startFreePlay = useCallback(() => {
    setCurrentLevel(null); setFreePlay(true); setScreen("play"); setPhase("idle");
  }, []);

  // ─── ADVANCE COMMUNITY CARDS ────
  const advancePhase = useCallback(() => {
    const lvl = currentLevel;
    const maxPhase = lvl ? lvl.phase : "river";

    if (phase === "preflop") {
      setRevealedCommunity(3); setPhase("flop");
      if (maxPhase === "flop") setTimeout(() => setPhase("showdown"), 800);
    } else if (phase === "flop") {
      setRevealedCommunity(4); setPhase("turn");
      if (maxPhase === "turn") setTimeout(() => setPhase("showdown"), 800);
    } else if (phase === "turn") {
      setRevealedCommunity(5); setPhase("river");
    } else if (phase === "river") {
      setPhase("showdown");
    }
  }, [phase, currentLevel]);

  // ─── BETTING ────
  const handleBet = useCallback((amount) => {
    const newPot = pot + amount + amount; // player + dealer match
    setPot(newPot);
    setPlayerBet(b => b + amount);
    setDealerBet(b => b + amount);
    updateGame({ toys: game.toys - amount });
    advancePhase();
  }, [pot, game.toys, updateGame, advancePhase]);

  const handleCheck = useCallback(() => { advancePhase(); }, [advancePhase]);

  const handleFold = useCallback(() => {
    setFolded(true); setOutcome("fold"); setPhase("result");
    setRoundToys(0);
  }, []);

  // Non-betting: just advance
  const handleContinuePhase = useCallback(() => { advancePhase(); }, [advancePhase]);

  // ─── SHOWDOWN ────
  useEffect(() => {
    if (phase !== "showdown") return;
    setRevealedCommunity(5);
    const timer = setTimeout(() => {
      const visComm = community.slice(0, revealedCommunity || 5);
      const pBest = bestHand(hole, visComm);
      const dBest = bestHand(dealerHole, visComm);
      const result = compareResults(pBest, dBest);
      setOutcome(result);
      setPhase("result");

      let earned = 0;
      if (result === "win") { earned = Math.max(pot, 3); setConfetti(true); setTimeout(() => setConfetti(false), 3200); }
      else if (result === "push") { earned = Math.max(Math.floor(pot / 2), 1); }

      // Streak
      const newStreak = result === "win" ? game.streak + 1 : 0;
      if (newStreak >= 3 && newStreak % 3 === 0) earned += 1;

      // Track hand types
      const handUpdates = {};
      if (pBest.rank >= 2) handUpdates.pairsFound = game.pairsFound + 1;
      if (pBest.rank === 6) handUpdates.flushes = game.flushes + 1;
      if (pBest.rank === 5) handUpdates.straights = game.straights + 1;
      if (pBest.rank === 7) handUpdates.fullHouses = game.fullHouses + 1;

      setRoundToys(earned);
      updateGame({
        totalHands: game.totalHands + 1,
        streak: newStreak,
        bestStreak: Math.max(game.bestStreak, newStreak),
        toys: game.toys + earned,
        totalToysEarned: game.totalToysEarned + earned,
        ...handUpdates,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── POST-RESULT ────
  const handleResultContinue = useCallback(() => {
    const lvl = currentLevel;
    if (freePlay) { setPhase("idle"); return; }
    if (!lvl) { setScreen("home"); return; }

    // Check for quiz
    if (lvl.quiz && !folded) {
      const visComm = community.slice(0, Math.min(revealedCommunity, 5));
      const q = generateQuiz(lvl.quiz, hole, visComm, dealerHole);
      if (q) { setQuiz(q); setScreen("quiz"); return; }
    }
    finishRound();
  }, [currentLevel, freePlay, folded, community, revealedCommunity, hole, dealerHole]);

  const handleQuizAnswer = useCallback((correct) => {
    if (correct) {
      updateGame({ quizCorrect: game.quizCorrect + 1, toys: game.toys + 1 });
      setRoundToys(t => t + 1);
    }
    setTimeout(() => { setQuiz(null); setScreen("play"); finishRound(); }, 600);
  }, [game]);

  const finishRound = useCallback(() => {
    if (!currentLevel) { setPhase("idle"); return; }
    const next = roundNum + 1;
    setRoundNum(next);
    if (next >= currentLevel.rounds) {
      const nextLvl = Math.max(game.level, currentLevel.id + 1);
      const newBadges = checkNewBadges({ ...game, level: nextLvl });
      const badge = newBadges.length > 0 ? BADGE_DEFS.find(b => b.id === newBadges[0]) : null;
      setNewBadge(badge);
      updateGame({ level: nextLvl, badges: [...game.badges, ...newBadges] });
      setScreen("reward");
    } else {
      setPhase("idle");
    }
  }, [currentLevel, roundNum, game, checkNewBadges, updateGame]);

  const handleRewardContinue = useCallback(() => {
    setNewBadge(null); setRoundToys(0);
    if (currentLevel && currentLevel.id < 20) startLevel(currentLevel.id + 1);
    else setScreen("home");
  }, [currentLevel, startLevel]);

  // ─── COMPUTED ────
  const visibleCommunity = community.slice(0, revealedCommunity);
  const pResult = useMemo(() => bestHand(hole, visibleCommunity), [hole, visibleCommunity]);
  const dResult = useMemo(() => bestHand(dealerHole, visibleCommunity), [dealerHole, visibleCommunity]);
  const lvl = currentLevel;
  const hasBetting = lvl ? lvl.betting : freePlay;
  const showResult = phase === "result";
  const res = OUTCOMES[outcome];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes cpop{0%{transform:scale(0) rotate(-15deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes cffall{0%{top:-30px;opacity:1}100%{top:110vh;opacity:0.4}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes wiggle{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
        @keyframes glow{0%,100%{box-shadow:0 6px 20px rgba(255,165,2,.4)}50%{box-shadow:0 6px 36px rgba(255,165,2,.8)}}
        @keyframes fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes dealpop{0%{transform:scale(0) translateY(30px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
        .btn{border:none;border-radius:22px;font-family:'Fredoka One',cursive;color:white;cursor:pointer;transition:transform .15s,box-shadow .15s;outline:none;-webkit-tap-highlight-color:transparent;}
        .btn:hover{transform:scale(1.06);}
        .btn:active{transform:scale(0.95);}
      `}</style>

      <Confetti on={confetti}/>

      <div style={{
        minHeight:"100vh",
        background: lvl ? WORLDS[lvl.world].bg : "linear-gradient(150deg,#c2e9fb 0%,#a1c4fd 45%,#ffecd2 100%)",
        fontFamily:"Nunito,sans-serif", padding:"14px 10px 30px",
        display:"flex", flexDirection:"column", alignItems:"center",
      }}>
        <div style={{width:"100%",maxWidth:500}}>

          {screen === "home" && <HomeScreen game={game} onAdventure={() => setScreen("map")} onFreePlay={startFreePlay} onBadges={() => setScreen("badges")} onHandGuide={() => setScreen("guide")}/>}
          {screen === "map" && <WorldMap game={game} onSelect={startLevel} onBack={() => setScreen("home")}/>}
          {screen === "badges" && <BadgesScreen game={game} onBack={() => setScreen("home")}/>}
          {screen === "guide" && <HandGuideScreen onBack={() => setScreen("home")}/>}

          {screen === "quiz" && quiz && (
            <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",borderRadius:28,padding:"20px 16px",boxShadow:"0 18px 50px rgba(0,0,0,0.13)",border:"3px solid rgba(255,255,255,0.85)"}}>
              <QuizScreen quiz={quiz} onAnswer={handleQuizAnswer}/>
            </div>
          )}

          {screen === "reward" && (
            <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",borderRadius:28,padding:"20px 16px",boxShadow:"0 18px 50px rgba(0,0,0,0.13)",border:"3px solid rgba(255,255,255,0.85)"}}>
              <RewardScreen toysEarned={roundToys} newBadge={newBadge} levelComplete={true} onContinue={handleRewardContinue}/>
            </div>
          )}

          {screen === "play" && (
            <>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <button className="btn" onClick={() => setScreen(freePlay ? "home" : "map")} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"7px 14px",fontSize:13,border:"2px solid rgba(255,255,255,0.9)"}}>←</button>
                <ToyDisplay toys={game.toys}/>
                {pot > 0 && (
                  <div style={{display:"flex",alignItems:"center",gap:4,background:"#FFD70033",borderRadius:16,padding:"5px 12px"}}>
                    <span style={{fontSize:14}}>🏆</span>
                    <span style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#FFA502"}}>{pot} in pot</span>
                  </div>
                )}
                {game.streak >= 3 && <span style={{fontFamily:"'Fredoka One',cursive",fontSize:12,color:"#FF4757",background:"#FF475722",borderRadius:12,padding:"3px 10px"}}>🔥 {game.streak}</span>}
              </div>

              {/* Level info */}
              {lvl && (
                <div style={{marginBottom:8}}>
                  <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:WORLDS[lvl.world].color}}>{WORLDS[lvl.world].emoji} Lvl {lvl.id}: {lvl.name}</p>
                  <p style={{fontSize:12,fontWeight:700,color:"#636e72",marginBottom:4}}>{lvl.desc}</p>
                  <ProgressBar current={roundNum} total={lvl.rounds} color={WORLDS[lvl.world].color}/>
                </div>
              )}
              {freePlay && <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#2ED573",marginBottom:8}}>🎮 Free Play — Texas Hold'em</p>}

              {/* BOARD */}
              <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",borderRadius:28,padding:"16px 14px",boxShadow:"0 18px 50px rgba(0,0,0,0.13)",border:"3px solid rgba(255,255,255,0.85)"}}>

                {/* IDLE — Deal button */}
                {phase === "idle" && (
                  <div style={{textAlign:"center",padding:"20px 0"}}>
                    <div style={{fontSize:50,animation:"wiggle 1.2s infinite",display:"inline-block",marginBottom:10}}>🃏</div>
                    <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#636e72",marginBottom:14}}>
                      {hasBetting ? "Blind: 1 toy per hand" : "Ready to play?"}
                    </p>
                    <button className="btn" onClick={dealHand} style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"16px 44px",fontSize:22,animation:"glow 1.8s infinite"}}>
                      🃏 Deal Cards!
                    </button>
                  </div>
                )}

                {phase !== "idle" && (
                  <>
                    {/* COMMUNITY CARDS */}
                    <section style={{marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <span style={{fontSize:18}}>🌟</span>
                        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#2d3436"}}>Shared Cards</span>
                        {revealedCommunity === 0 && <span style={{fontSize:11,fontWeight:800,color:"#b2bec3"}}>(coming soon!)</span>}
                        {revealedCommunity === 3 && <span style={{fontSize:11,fontWeight:800,color:"#6c5ce7"}}>Flop!</span>}
                        {revealedCommunity === 4 && <span style={{fontSize:11,fontWeight:800,color:"#6c5ce7"}}>Turn!</span>}
                        {revealedCommunity === 5 && <span style={{fontSize:11,fontWeight:800,color:"#6c5ce7"}}>River!</span>}
                      </div>
                      <div style={{display:"flex",gap:6,justifyContent:"center",minHeight:92}}>
                        {[0,1,2,3,4].map(i => (
                          <div key={i} style={{animation: i < revealedCommunity ? `dealpop .4s ${i*0.1}s ease both` : "none"}}>
                            {i < revealedCommunity ? (
                              <CardSprite card={community[i]} small/>
                            ) : (
                              <div style={{width:60,height:88,borderRadius:12,background:"rgba(0,0,0,0.06)",border:"2px dashed rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <span style={{fontSize:18,opacity:0.3}}>?</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                    <div style={{height:2,background:"rgba(0,0,0,0.06)",margin:"0 0 12px"}}/>

                    {/* DEALER */}
                    <section style={{marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <span style={{fontSize:18}}>🤖</span>
                        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:"#2d3436"}}>Dealer</span>
                        {phase !== "result" && <span style={{fontSize:11,fontWeight:800,color:"#b2bec3"}}>Hidden 🤫</span>}
                      </div>
                      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                        {dealerHole.map((c, i) => (
                          <CardSprite key={i} card={c} hidden={phase !== "result"} small/>
                        ))}
                      </div>
                      {phase === "result" && !folded && <div style={{marginTop:6,textAlign:"center"}}><HandRankBadge result={dResult}/></div>}
                    </section>

                    <div style={{height:2,background:"rgba(0,0,0,0.06)",margin:"0 0 12px"}}/>

                    {/* PLAYER */}
                    <section style={{marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <span style={{fontSize:18}}>⭐</span>
                        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:"#2d3436"}}>Your Cards</span>
                      </div>
                      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                        {hole.map((c, i) => (
                          <div key={i} style={{animation:`dealpop .4s ${i*0.15}s ease both`}}>
                            <CardSprite card={c}/>
                          </div>
                        ))}
                      </div>
                      {hole.length > 0 && <div style={{marginTop:6,textAlign:"center"}}><HandRankBadge result={pResult}/></div>}
                    </section>

                    {/* ACTION AREA */}
                    {!showResult && phase !== "showdown" && (
                      hasBetting ? (
                        <BettingPanel toys={game.toys} minBet={1}
                          onBet={handleBet} onCheck={handleCheck} onFold={handleFold}
                          canCheck={phase !== "preflop" || playerBet >= dealerBet}/>
                      ) : (
                        <div style={{textAlign:"center",padding:"10px 0",animation:"fadeup .3s ease"}}>
                          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#6c5ce7",marginBottom:10}}>
                            {revealedCommunity === 0 ? "See what the shared cards are!" : revealedCommunity < 5 ? "Ready for the next card?" : "Time for showdown!"}
                          </p>
                          <button className="btn" onClick={handleContinuePhase} style={{
                            background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"13px 36px",fontSize:18,
                            animation: revealedCommunity >= 5 || phase === "river" ? "glow 1.8s infinite" : "none",
                          }}>
                            {revealedCommunity === 0 ? "🃏 Show Flop!" : revealedCommunity === 3 ? "🃏 Show Turn!" : revealedCommunity === 4 ? "🃏 Show River!" : "👀 Showdown!"}
                          </button>
                        </div>
                      )
                    )}

                    {/* SHOWDOWN ANIMATION */}
                    {phase === "showdown" && (
                      <div style={{textAlign:"center",padding:12}}>
                        <div style={{fontSize:34,animation:"bounce .6s infinite",display:"inline-block"}}>🤔</div>
                        <p style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:"#6c5ce7",marginTop:4}}>Comparing hands...</p>
                      </div>
                    )}

                    {/* RESULT */}
                    {showResult && res && (
                      <div style={{textAlign:"center",padding:"16px 12px",background:res.bg,borderRadius:22,animation:"cpop .45s cubic-bezier(0.34,1.56,0.64,1)",border:`2px solid ${res.color}44`}}>
                        <div style={{fontSize:48,marginBottom:4,display:"inline-block",animation:outcome==="win"?"bounce .9s infinite":"none"}}>{res.emoji}</div>
                        <p style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:res.color,marginBottom:6}}>{res.msg}</p>
                        {!folded && (
                          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:10,flexWrap:"wrap"}}>
                            <div style={{background:"rgba(255,255,255,0.7)",borderRadius:14,padding:"6px 14px"}}>
                              <span style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:"#2d3436"}}>⭐ {pResult.name}</span>
                            </div>
                            <div style={{background:"rgba(255,255,255,0.7)",borderRadius:14,padding:"6px 14px"}}>
                              <span style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:"#2d3436"}}>🤖 {dResult.name}</span>
                            </div>
                          </div>
                        )}
                        {roundToys > 0 && <p style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:"#FFA502",marginBottom:8}}>+{roundToys} toys! 🧸</p>}
                        <button className="btn" onClick={handleResultContinue} style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"13px 36px",fontSize:18,animation:"glow 1.8s infinite"}}>
                          {freePlay ? "🎮 Play Again!" : "▶️ Next!"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <p style={{marginTop:14,fontWeight:800,color:"#636e72",fontSize:12,textAlign:"center"}}>
          <span style={{animation:"bounce 2s infinite",display:"inline-block"}}>💡</span>
          {" "}Texas Hold'em: 2 cards in your hand + 5 shared cards = pick your best 5!
        </p>
      </div>
    </>
  );
}
