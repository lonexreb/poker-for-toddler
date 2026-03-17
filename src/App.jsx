import { useState, useCallback, useEffect, useRef } from "react";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const SUITS = {
  "♥": { color: "#FF4757", name: "Hearts" },
  "♦": { color: "#FF6B35", name: "Diamonds" },
  "♣": { color: "#2d3436", name: "Clubs" },
  "♠": { color: "#2d3436", name: "Spades" },
};
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RANK_VALUE = { A:11, K:10, Q:10, J:10, 10:10, 9:9, 8:8, 7:7, 6:6, 5:5, 4:4, 3:3, 2:2 };
const RANK_NUM = { A:14, K:13, Q:12, J:11, 10:10, 9:9, 8:8, 7:7, 6:6, 5:5, 4:4, 3:3, 2:2 };

const WORLDS = [
  { name: "Number Garden", emoji: "🌻", color: "#2ED573", bg: "linear-gradient(150deg,#d4fde4 0%,#a8e6cf 100%)" },
  { name: "Star Market", emoji: "⭐", color: "#FFA502", bg: "linear-gradient(150deg,#fff9e6 0%,#ffecd2 100%)" },
  { name: "Mystery Mountain", emoji: "🏔️", color: "#6c5ce7", bg: "linear-gradient(150deg,#ede7ff 0%,#c2c2ff 100%)" },
];

const LEVELS = [
  // World 1: Number Garden — Calculation
  { id:1, name:"Counting Seeds",rounds:3,world:0,quiz:null,features:[],desc:"Learn to play!" },
  { id:2, name:"Which is Bigger?",rounds:3,world:0,quiz:"pick-card",features:[],desc:"Compare card values!" },
  { id:3, name:"Adding Up",rounds:5,world:0,quiz:"addition",features:[],desc:"Add your card values!" },
  { id:4, name:"Face Card Friends",rounds:4,world:0,quiz:"face-value",features:[],desc:"Meet J, Q, K, and A!" },
  { id:5, name:"Garden Boss",rounds:5,world:0,quiz:"mixed-calc",features:["peek"],desc:"Use Peek to win!" },
  // World 2: Star Market — Entrepreneurial
  { id:6, name:"The Star Shop",rounds:4,world:1,quiz:null,features:["bet"],desc:"Safe or risky?" },
  { id:7, name:"Peek or Save?",rounds:4,world:1,quiz:null,features:["peek","extra-swap"],desc:"Spend stars wisely!" },
  { id:8, name:"Growing Stars",rounds:5,world:1,quiz:null,features:["invest"],desc:"Plant stars to grow!" },
  { id:9, name:"Trading Post",rounds:4,world:1,quiz:null,features:["trade"],desc:"Trade for a sure thing?" },
  { id:10,name:"Market Boss",rounds:5,world:1,quiz:null,features:["bet","peek","invest"],desc:"Use all your tools!" },
  // World 3: Mystery Mountain — Uncertainty
  { id:11,name:"What Could It Be?",rounds:4,world:2,quiz:null,features:["dealer-peek"],desc:"See 1 dealer card!" },
  { id:12,name:"Guess the Card",rounds:4,world:2,quiz:"probability",features:["dealer-peek"],desc:"What card is likely?" },
  { id:13,name:"The Smart Swap",rounds:5,world:2,quiz:"swap-decision",features:["dealer-peek"],desc:"Should you swap?" },
  { id:14,name:"Read the Clues",rounds:5,world:2,quiz:"clue",features:["dealer-peek"],desc:"Use clues to decide!" },
  { id:15,name:"Grand Challenge",rounds:7,world:2,quiz:"mixed-all",features:["peek","invest","dealer-peek"],desc:"The final test!" },
];

const BADGE_DEFS = [
  { id:"first-win", name:"First Win!", emoji:"🏆", desc:"Win your first round" },
  { id:"counting-star", name:"Counting Star", emoji:"🔢", desc:"Complete World 1" },
  { id:"number-wizard", name:"Number Wizard", emoji:"🧙", desc:"Answer 10 quizzes right" },
  { id:"star-trader", name:"Star Trader", emoji:"💰", desc:"Complete World 2" },
  { id:"smart-swapper", name:"Smart Swapper", emoji:"🧠", desc:"Win 5 rounds without swapping" },
  { id:"fire-streak", name:"Fire Streak!", emoji:"🔥", desc:"Get a 5-win streak" },
  { id:"card-champion", name:"Card Champion", emoji:"👑", desc:"Complete all 15 levels" },
];

const DEFAULT_SAVE = { stars:5, level:1, xp:0, streak:0, bestStreak:0, badges:[], totalRounds:0, quizCorrect:0, noSwapWins:0 };
const STAR_FLOOR = 3;

// ─── HELPERS ───────────────────────────────────────────────────────────────
function freshDeck() {
  const d = [];
  for (const s of Object.keys(SUITS))
    for (const r of RANKS)
      d.push({ suit: s, rank: r });
  return d.sort(() => Math.random() - 0.5);
}

function isRed(c) { return c.suit === "♥" || c.suit === "♦"; }

function scoreHand(hand) {
  if (hand.length < 2) return { type:"none", label:"", points:0, emoji:"" };
  const [a, b] = hand;
  if (a.rank === b.rank) return { type:"pair", label:`Pair of ${a.rank}s!`, points:3, emoji:"👯" };
  if ((isRed(a) && isRed(b)) || (!isRed(a) && !isRed(b)))
    return { type:"color", label: isRed(a) ? "Red Cards!" : "Black Cards!", points:2, emoji: isRed(a) ? "❤️" : "🖤" };
  const high = RANK_NUM[a.rank] > RANK_NUM[b.rank] ? a : b;
  return { type:"high", label:`High Card: ${high.rank}`, points:1, emoji:"🃠" };
}

function compareHands(p, d) {
  const ps = scoreHand(p), ds = scoreHand(d);
  if (ps.points > ds.points) return "win";
  if (ps.points < ds.points) return "lose";
  const pH = Math.max(RANK_NUM[p[0].rank], RANK_NUM[p[1].rank]);
  const dH = Math.max(RANK_NUM[d[0].rank], RANK_NUM[d[1].rank]);
  return pH > dH ? "win" : pH < dH ? "lose" : "push";
}

function loadGame() {
  try { return { ...DEFAULT_SAVE, ...JSON.parse(localStorage.getItem("poker-save")) }; }
  catch { return { ...DEFAULT_SAVE }; }
}
function saveGame(g) { localStorage.setItem("poker-save", JSON.stringify(g)); }

function generateQuiz(type, playerHand, dealerHand, deck) {
  const p = playerHand, d = dealerHand;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  if (type === "pick-card") {
    const c1 = p[0], c2 = p[1];
    const v1 = RANK_VALUE[c1.rank], v2 = RANK_VALUE[c2.rank];
    const bigger = v1 >= v2 ? c1 : c2;
    return {
      q: `Which card is worth more? 🤔`,
      options: [`${c1.rank}${c1.suit} (=${v1})`, `${c2.rank}${c2.suit} (=${v2})`],
      answer: v1 >= v2 ? 0 : 1,
      explain: `${bigger.rank} is worth ${RANK_VALUE[bigger.rank]}!`,
    };
  }
  if (type === "addition") {
    const v1 = RANK_VALUE[p[0].rank], v2 = RANK_VALUE[p[1].rank];
    const sum = v1 + v2;
    const wrong1 = sum + randInt(1, 3), wrong2 = Math.max(1, sum - randInt(1, 3));
    const opts = [sum, wrong1, wrong2].sort(() => Math.random() - 0.5);
    return {
      q: `${p[0].rank} (=${v1}) + ${p[1].rank} (=${v2}) = ? ➕`,
      options: opts.map(String),
      answer: opts.indexOf(sum),
      explain: `${v1} + ${v2} = ${sum}! Great counting!`,
    };
  }
  if (type === "face-value") {
    const card = rand([...p, ...d]);
    const val = RANK_VALUE[card.rank];
    const wrong1 = val + randInt(1, 3), wrong2 = Math.max(1, val - randInt(1, 2));
    const opts = [val, wrong1, wrong2].sort(() => Math.random() - 0.5);
    return {
      q: `How much is ${card.rank}${card.suit} worth? 🎴`,
      options: opts.map(String),
      answer: opts.indexOf(val),
      explain: card.rank === "A" ? "Ace is worth 11!" : ["J","Q","K"].includes(card.rank) ? `${card.rank} is a face card — worth 10!` : `${card.rank} is worth ${val}!`,
    };
  }
  if (type === "probability" || type === "clue") {
    const visible = d[0];
    const visVal = RANK_VALUE[visible.rank];
    const pSum = RANK_VALUE[p[0].rank] + RANK_VALUE[p[1].rank];
    const likely = pSum > visVal + 7 ? "yes" : "no";
    return {
      q: `Dealer shows ${visible.rank}${visible.suit}. Think you'll win? 🤔`,
      options: ["Yes, probably! 👍", "No, probably not 👎"],
      answer: likely === "yes" ? 0 : 1,
      explain: likely === "yes" ? `Your cards add up to ${pSum} — that's strong!` : `The dealer's ${visible.rank} looks tough — be careful!`,
    };
  }
  if (type === "swap-decision") {
    const ps = scoreHand(p);
    const shouldKeep = ps.type === "pair";
    return {
      q: `You have ${ps.label} Should you swap? 🔄`,
      options: ["Keep both! ✋", "Swap one! 🔄"],
      answer: shouldKeep ? 0 : 1,
      explain: shouldKeep ? "A pair is great — keep it!" : "No pair yet — try swapping for a better hand!",
    };
  }
  // mixed-calc, mixed-all: randomly pick from available types
  const pool = type === "mixed-calc" ? ["pick-card","addition","face-value"]
    : ["pick-card","addition","face-value","probability","swap-decision"];
  return generateQuiz(rand(pool), playerHand, dealerHand, deck);
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────
function Confetti({ on }) {
  if (!on) return null;
  const colors = ["#FF4757","#FFA502","#2ED573","#1E90FF","#FF6B81","#ECCC68","#a29bfe","#fd79a8"];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      {Array.from({length:60},(_,i)=>(
        <div key={i} style={{
          position:"absolute",left:`${Math.random()*100}%`,top:"-30px",
          width:10+Math.random()*10,height:10+Math.random()*10,
          background:colors[i%8],borderRadius:i%3===0?"50%":"3px",
          animation:`cffall ${1.5+Math.random()*1.5}s ${Math.random()*0.8}s ease-in forwards`,
          transform:`rotate(${Math.random()*360}deg)`,
        }}/>
      ))}
    </div>
  );
}

function CardSprite({ card, hidden=false, isNew=false, glow=false }) {
  const s = SUITS[card.suit];
  return (
    <div style={{
      width:90, height:130,
      background: hidden ? "linear-gradient(135deg,#6c5ce7,#a29bfe)" : "white",
      borderRadius:16, boxShadow: glow ? "0 0 0 4px #FFA502, 0 12px 32px rgba(0,0,0,0.25)" : isNew ? "0 0 0 4px #2ED573, 0 12px 32px rgba(0,0,0,0.25)" : "0 6px 20px rgba(0,0,0,0.18)",
      border:"3px solid rgba(255,255,255,0.9)", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0,
      animation: isNew ? "cpop 0.45s cubic-bezier(0.34,1.56,0.64,1)" : "none",
    }}>
      {hidden ? <span style={{fontSize:38}}>🎴</span> : (
        <>
          <div style={{position:"absolute",top:6,left:8,lineHeight:1}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:s.color}}>{card.rank}</div>
            <div style={{fontSize:13,color:s.color}}>{card.suit}</div>
          </div>
          <div style={{fontSize:42,color:s.color,lineHeight:1}}>{card.suit}</div>
          <div style={{position:"absolute",bottom:6,right:8,textAlign:"right",transform:"rotate(180deg)",lineHeight:1}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:s.color}}>{card.rank}</div>
            <div style={{fontSize:13,color:s.color}}>{card.suit}</div>
          </div>
        </>
      )}
    </div>
  );
}

function ProgressBar({ current, total, color="#2ED573" }) {
  return (
    <div style={{width:"100%",height:14,background:"rgba(0,0,0,0.08)",borderRadius:10,overflow:"hidden",position:"relative"}}>
      <div style={{width:`${(current/total)*100}%`,height:"100%",background:color,borderRadius:10,transition:"width 0.4s ease"}}/>
      <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",fontSize:10,color:"white",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{current}/{total}</span>
    </div>
  );
}

function StarDisplay({ stars }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.8)",borderRadius:20,padding:"6px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
      <span style={{fontSize:20}}>⭐</span>
      <span style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:"#FFA502"}}>{stars}</span>
    </div>
  );
}

// ─── HOME SCREEN ───────────────────────────────────────────────────────────
function HomeScreen({ game, onPlay, onMap, onBadges, onFreePlay }) {
  return (
    <div style={{textAlign:"center",padding:"20px 10px",animation:"fadeup .5s ease"}}>
      <div style={{fontSize:64,animation:"bounce 2s infinite",display:"inline-block"}}>🃏</div>
      <h1 style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(26px,6vw,42px)",color:"#2d3436",textShadow:"2px 2px 0 rgba(255,255,255,0.6)",lineHeight:1.2,marginTop:4}}>Poker Fun!</h1>
      <p style={{fontWeight:800,color:"#636e72",fontSize:15,margin:"8px 0 20px"}}>Learn cards, patterns & smart thinking!</p>
      <StarDisplay stars={game.stars}/>
      <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
        <button className="btn" onClick={onPlay} style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"16px 48px",fontSize:24,animation:"glow 1.8s infinite",boxShadow:"0 8px 24px rgba(255,107,53,.4)",width:"100%",maxWidth:300}}>
          🗺️ Adventure!
        </button>
        <button className="btn" onClick={onFreePlay} style={{background:"linear-gradient(135deg,#2ED573,#00b894)",padding:"12px 36px",fontSize:18,boxShadow:"0 6px 16px rgba(46,213,115,.3)",width:"100%",maxWidth:300}}>
          🎮 Free Play
        </button>
        <button className="btn" onClick={onBadges} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"10px 30px",fontSize:16,boxShadow:"0 4px 12px rgba(0,0,0,0.08)",border:"2px solid rgba(255,255,255,0.9)",width:"100%",maxWidth:300}}>
          🏅 Badges ({game.badges.length}/{BADGE_DEFS.length})
        </button>
      </div>
      {game.level > 1 && (
        <p style={{marginTop:16,fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#6c5ce7"}}>
          Level {game.level} — {LEVELS[Math.min(game.level,15)-1].name}
        </p>
      )}
    </div>
  );
}

// ─── WORLD MAP ─────────────────────────────────────────────────────────────
function WorldMap({ game, onSelectLevel, onBack }) {
  return (
    <div style={{padding:"10px 0",animation:"fadeup .4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button className="btn" onClick={onBack} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"8px 16px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)"}}>← Back</button>
        <StarDisplay stars={game.stars}/>
      </div>
      {WORLDS.map((w, wi) => (
        <div key={wi} style={{marginBottom:20,background:w.bg,borderRadius:22,padding:16,border:"3px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 24px rgba(0,0,0,0.08)"}}>
          <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:w.color,marginBottom:10}}>
            {w.emoji} {w.name}
          </h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {LEVELS.filter(l => l.world === wi).map(lvl => {
              const unlocked = lvl.id <= game.level;
              const completed = lvl.id < game.level;
              return (
                <button key={lvl.id} className="btn" onClick={() => unlocked && onSelectLevel(lvl.id)}
                  style={{
                    width:80, height:80, borderRadius:18,
                    background: completed ? w.color : unlocked ? "white" : "rgba(0,0,0,0.1)",
                    color: completed ? "white" : unlocked ? w.color : "#b2bec3",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    gap:2, border: unlocked ? `3px solid ${w.color}` : "3px solid transparent",
                    opacity: unlocked ? 1 : 0.5, cursor: unlocked ? "pointer" : "default",
                    boxShadow: unlocked ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                  }}>
                  <span style={{fontFamily:"'Fredoka One',cursive",fontSize:22}}>{completed ? "✅" : unlocked ? lvl.id : "🔒"}</span>
                  <span style={{fontSize:9,fontWeight:800,lineHeight:1.1,textAlign:"center"}}>{lvl.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BADGES SCREEN ─────────────────────────────────────────────────────────
function BadgesScreen({ game, onBack }) {
  return (
    <div style={{padding:"10px 0",animation:"fadeup .4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button className="btn" onClick={onBack} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"8px 16px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)"}}>← Back</button>
        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:"#2d3436"}}>🏅 Badges</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {BADGE_DEFS.map(b => {
          const earned = game.badges.includes(b.id);
          return (
            <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,background:earned?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.05)",borderRadius:16,padding:"12px 16px",border:earned?"2px solid #2ED57344":"2px solid transparent",opacity:earned?1:0.5}}>
              <span style={{fontSize:36}}>{earned ? b.emoji : "❓"}</span>
              <div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:earned?"#2d3436":"#b2bec3"}}>{earned ? b.name : "???"}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#636e72"}}>{b.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QUIZ SCREEN ───────────────────────────────────────────────────────────
function QuizScreen({ quiz, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const correct = picked === quiz.answer;
  return (
    <div style={{textAlign:"center",padding:"16px 0",animation:"fadeup .3s ease"}}>
      <span style={{fontSize:42,display:"inline-block",animation:"wiggle 1.2s infinite"}}>🧠</span>
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#2d3436",margin:"10px 0 16px",lineHeight:1.4}}>{quiz.q}</p>
      <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
        {quiz.options.map((opt, i) => (
          <button key={i} className="btn" disabled={picked !== null}
            onClick={() => { setPicked(i); setTimeout(() => onAnswer(i === quiz.answer), 1200); }}
            style={{
              width:"100%", maxWidth:320, padding:"14px 20px", fontSize:18,
              background: picked === null ? "white" : i === quiz.answer ? "#d4fde4" : picked === i ? "#ffe8e0" : "white",
              color:"#2d3436", border: picked === i ? (correct ? "3px solid #2ED573" : "3px solid #FF4757") : i === quiz.answer && picked !== null ? "3px solid #2ED573" : "3px solid rgba(0,0,0,0.08)",
              boxShadow:"0 4px 12px rgba(0,0,0,0.08)",
            }}>
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div style={{marginTop:14,padding:"10px 16px",borderRadius:16,background:correct?"#d4fde4":"#ffe8e0",animation:"fadeup .3s ease"}}>
          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:correct?"#2ED573":"#e17055"}}>
            {correct ? "⭐ Correct!" : "Not quite!"}
          </p>
          <p style={{fontSize:14,fontWeight:700,color:"#636e72",marginTop:4}}>{quiz.explain}</p>
        </div>
      )}
    </div>
  );
}

// ─── REWARD SCREEN ─────────────────────────────────────────────────────────
function RewardScreen({ starsEarned, newBadge, levelComplete, onContinue }) {
  return (
    <div style={{textAlign:"center",padding:"24px 10px",animation:"cpop .45s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div style={{fontSize:64,animation:"bounce .9s infinite",display:"inline-block"}}>🎉</div>
      <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:"#2ED573",marginTop:8}}>
        {levelComplete ? "Level Complete!" : "Great Round!"}
      </h2>
      <div style={{margin:"16px 0",display:"flex",justifyContent:"center",gap:6}}>
        {Array.from({length:starsEarned},(_,i)=>(
          <span key={i} style={{fontSize:36,animation:`cpop .4s ${i*0.15}s cubic-bezier(0.34,1.56,0.64,1) both`}}>⭐</span>
        ))}
      </div>
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:"#FFA502"}}>+{starsEarned} stars!</p>
      {newBadge && (
        <div style={{marginTop:14,background:"#fff9e6",borderRadius:18,padding:"12px 20px",display:"inline-block",border:"2px solid #FFA50244",animation:"fadeup .4s .2s ease both"}}>
          <span style={{fontSize:36}}>{newBadge.emoji}</span>
          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#2d3436"}}>New Badge: {newBadge.name}</p>
        </div>
      )}
      <div style={{marginTop:20}}>
        <button className="btn" onClick={onContinue} style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"14px 40px",fontSize:20,animation:"glow 1.8s infinite",boxShadow:"0 8px 24px rgba(255,107,53,.4)"}}>
          {levelComplete ? "🗺️ Next Level!" : "▶️ Continue"}
        </button>
      </div>
    </div>
  );
}

// ─── INVEST PANEL ──────────────────────────────────────────────────────────
function InvestPanel({ stars, features, onChoose }) {
  const [bet, setBet] = useState(0);
  const hasBet = features.includes("bet");
  const hasInvest = features.includes("invest");
  const hasPeek = features.includes("peek");
  const hasExtraSwap = features.includes("extra-swap");

  return (
    <div style={{textAlign:"center",padding:"12px 0",animation:"fadeup .3s ease"}}>
      <StarDisplay stars={stars}/>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:14}}>
        {(hasBet || hasInvest) && (
          <div style={{background:"rgba(255,255,255,0.9)",borderRadius:18,padding:14,minWidth:200}}>
            <p style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#6c5ce7",marginBottom:8}}>
              {hasInvest ? "🌱 Plant stars to grow!" : "🎯 Bet: safe or risky?"}
            </p>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button className="btn" onClick={() => onChoose({ bet:1, peek:false, extraSwap:false })}
                style={{background:"#2ED573",padding:"10px 18px",fontSize:14}}>
                {hasInvest ? "🌱 Plant 1" : "Safe (1⭐)"}
              </button>
              {stars >= 3 && (
                <button className="btn" onClick={() => onChoose({ bet:3, peek:false, extraSwap:false })}
                  style={{background:"linear-gradient(135deg,#FF6B35,#FF4757)",padding:"10px 18px",fontSize:14}}>
                  {hasInvest ? "🌳 Plant 3" : "Risky (3⭐)"}
                </button>
              )}
            </div>
          </div>
        )}
        {hasPeek && stars >= 2 && (
          <button className="btn" onClick={() => onChoose({ bet:0, peek:true, extraSwap:false })}
            style={{background:"linear-gradient(135deg,#6c5ce7,#a29bfe)",padding:"12px 20px",fontSize:14}}>
            👁️ Peek (2⭐)
          </button>
        )}
        {hasExtraSwap && stars >= 2 && (
          <button className="btn" onClick={() => onChoose({ bet:0, peek:false, extraSwap:true })}
            style={{background:"linear-gradient(135deg,#1E90FF,#74b9ff)",padding:"12px 20px",fontSize:14}}>
            🔄 Extra Swap (2⭐)
          </button>
        )}
        {!hasBet && !hasInvest && (
          <button className="btn" onClick={() => onChoose({ bet:0, peek:false, extraSwap:false })}
            style={{background:"linear-gradient(135deg,#FFA502,#FF6B35)",padding:"14px 36px",fontSize:18,animation:"glow 1.8s infinite",boxShadow:"0 8px 24px rgba(255,107,53,.4)"}}>
            🃏 Deal!
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TRADE SCREEN ──────────────────────────────────────────────────────────
function TradePanel({ stars, playerHand, onTrade }) {
  return (
    <div style={{textAlign:"center",padding:"12px 0",animation:"fadeup .3s ease",background:"rgba(255,255,255,0.7)",borderRadius:18,margin:"10px 0"}}>
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#6c5ce7",marginBottom:10}}>🤝 Trade Offer!</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn" onClick={() => onTrade(false)}
          style={{background:"linear-gradient(135deg,#FF6B35,#FFA502)",padding:"12px 22px",fontSize:15}}>
          🎲 Keep playing (might win big!)
        </button>
        <button className="btn" onClick={() => onTrade(true)}
          style={{background:"linear-gradient(135deg,#2ED573,#00b894)",padding:"12px 22px",fontSize:15}}>
          ✅ Trade for 2 safe stars
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
const RESULTS = {
  win:  { emoji:"🎉", msg:"You WIN! Amazing!", color:"#00b894", bg:"#d4fde4" },
  lose: { emoji:"😮", msg:"Dealer wins this time!", color:"#e17055", bg:"#ffe8e0" },
  push: { emoji:"🤝", msg:"It's a tie! Good game!", color:"#6c5ce7", bg:"#ede7ff" },
};

export default function App() {
  const [game, setGame] = useState(loadGame);
  const [screen, setScreen] = useState("home");  // home | map | badges | play | quiz | reward
  const [phase, setPhase] = useState("pre");      // pre | pick | swap | reveal | result
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [outcome, setOutcome] = useState("");
  const [confetti, setConfetti] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [swapped, setSwapped] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [roundNum, setRoundNum] = useState(0);
  const [roundStars, setRoundStars] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [peeking, setPeeking] = useState(false);
  const [extraSwap, setExtraSwap] = useState(false);
  const [roundBet, setRoundBet] = useState(0);
  const [traded, setTraded] = useState(false);
  const [freePlay, setFreePlay] = useState(false);

  // Persist game to localStorage
  useEffect(() => { saveGame(game); }, [game]);

  const updateGame = useCallback((updates) => {
    setGame(g => {
      const next = { ...g, ...updates };
      if (next.stars < STAR_FLOOR) next.stars = STAR_FLOOR;
      return next;
    });
  }, []);

  const checkBadges = useCallback((g) => {
    const earn = [];
    if (!g.badges.includes("first-win") && g.totalRounds > 0) earn.push("first-win");
    if (!g.badges.includes("counting-star") && g.level > 5) earn.push("counting-star");
    if (!g.badges.includes("number-wizard") && g.quizCorrect >= 10) earn.push("number-wizard");
    if (!g.badges.includes("star-trader") && g.level > 10) earn.push("star-trader");
    if (!g.badges.includes("smart-swapper") && g.noSwapWins >= 5) earn.push("smart-swapper");
    if (!g.badges.includes("fire-streak") && g.streak >= 5) earn.push("fire-streak");
    if (!g.badges.includes("card-champion") && g.level > 15) earn.push("card-champion");
    return earn;
  }, []);

  const startLevel = useCallback((lvlId) => {
    const lvl = LEVELS[lvlId - 1];
    setCurrentLevel(lvl);
    setRoundNum(0);
    setRoundStars(0);
    setFreePlay(false);
    setScreen("play");
    setPhase("pre");
    setTraded(false);
  }, []);

  const startFreePlay = useCallback(() => {
    setCurrentLevel(null);
    setFreePlay(true);
    setScreen("play");
    setPhase("pre");
    setRoundBet(0);
    setPeeking(false);
    setExtraSwap(false);
    setTraded(false);
  }, []);

  const dealRound = useCallback((choices = {}) => {
    const d = freshDeck();
    const p = [d.pop(), d.pop()];
    const dl = [d.pop(), d.pop()];
    setDeck(d); setPlayer(p); setDealer(dl);
    setPhase("pick"); setOutcome(""); setConfetti(false);
    setSwapped(false); setSelected(-1);
    setRoundBet(choices.bet || 0);
    setPeeking(choices.peek || false);
    setExtraSwap(choices.extraSwap || false);
    setTraded(false);
    if (choices.bet) updateGame({ stars: game.stars - choices.bet });
    if (choices.peek) updateGame({ stars: game.stars - 2 });
    if (choices.extraSwap) updateGame({ stars: game.stars - 2 });
  }, [game.stars, updateGame]);

  const swapCard = () => {
    if (selected < 0) return;
    const d = [...deck]; const p = [...player];
    p[selected] = d.pop();
    setDeck(d); setPlayer(p); setSwapped(true); setSelected(-1); setPhase("swap");
  };

  const doExtraSwap = () => {
    if (selected < 0) return;
    const d = [...deck]; const p = [...player];
    p[selected] = d.pop();
    setDeck(d); setPlayer(p); setSelected(-1); setExtraSwap(false);
  };

  const keepCards = () => setPhase("swap");

  const showdown = () => {
    setPhase("reveal");
    setTimeout(() => {
      const result = compareHands(player, dealer);
      setOutcome(result);
      setPhase("result");
      const isWin = result === "win";
      const isPush = result === "push";
      let starsEarned = isWin ? 2 : isPush ? 1 : 0;
      if (isWin && roundBet > 0) starsEarned += roundBet * 2;  // return + profit
      else if (!isWin && roundBet > 0) starsEarned = 0; // already deducted

      const newStreak = isWin ? game.streak + 1 : 0;
      if (newStreak >= 3 && newStreak % 3 === 0) starsEarned += 1; // streak bonus

      const updates = {
        totalRounds: game.totalRounds + 1,
        streak: newStreak,
        bestStreak: Math.max(game.bestStreak, newStreak),
        stars: game.stars + starsEarned,
        noSwapWins: isWin && !swapped ? game.noSwapWins + 1 : game.noSwapWins,
      };

      setRoundStars(starsEarned);
      updateGame(updates);

      if (isWin) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3200);
      }

      // Check for quiz after result
      if (currentLevel && currentLevel.quiz) {
        setTimeout(() => {
          const q = generateQuiz(currentLevel.quiz, player, dealer, deck);
          setQuiz(q);
          setScreen("quiz");
        }, 1800);
      }
    }, 1200);
  };

  const handleQuizAnswer = useCallback((correct) => {
    if (correct) {
      updateGame({ quizCorrect: game.quizCorrect + 1, stars: game.stars + 1 });
      setRoundStars(s => s + 1);
    }
    setTimeout(() => {
      setScreen("play");
      setQuiz(null);
      checkRoundEnd();
    }, 500);
  }, [game]);

  const checkRoundEnd = useCallback(() => {
    if (!currentLevel) return;
    const nextRound = roundNum + 1;
    setRoundNum(nextRound);
    if (nextRound >= currentLevel.rounds) {
      // Level complete!
      const nextLvl = Math.max(game.level, currentLevel.id + 1);
      const badges = checkBadges({ ...game, level: nextLvl });
      const badge = badges.length > 0 ? BADGE_DEFS.find(b => b.id === badges[0]) : null;
      setNewBadge(badge);
      updateGame({ level: nextLvl, badges: [...game.badges, ...badges] });
      setScreen("reward");
    } else {
      setPhase("pre");
    }
  }, [currentLevel, roundNum, game, checkBadges, updateGame]);

  const handleResultContinue = useCallback(() => {
    if (freePlay) {
      setPhase("pre");
      return;
    }
    if (!currentLevel) { setScreen("home"); return; }
    if (!currentLevel.quiz) {
      // No quiz — go straight to round end check
      const nextRound = roundNum + 1;
      setRoundNum(nextRound);
      if (nextRound >= currentLevel.rounds) {
        const nextLvl = Math.max(game.level, currentLevel.id + 1);
        const badges = checkBadges({ ...game, level: nextLvl });
        const badge = badges.length > 0 ? BADGE_DEFS.find(b => b.id === badges[0]) : null;
        setNewBadge(badge);
        updateGame({ level: nextLvl, badges: [...game.badges, ...badges] });
        setScreen("reward");
      } else {
        setPhase("pre");
      }
    }
    // If quiz, the quiz handler will call checkRoundEnd
  }, [freePlay, currentLevel, roundNum, game, checkBadges, updateGame]);

  const handleTrade = useCallback((accept) => {
    setTraded(true);
    if (accept) {
      updateGame({ stars: game.stars + 2 });
      setRoundStars(2);
      setPhase("result");
      setOutcome("push");
    }
  }, [game.stars, updateGame]);

  const handleRewardContinue = useCallback(() => {
    setNewBadge(null);
    setRoundStars(0);
    if (currentLevel && currentLevel.id < 15) {
      startLevel(currentLevel.id + 1);
    } else {
      setScreen("home");
    }
  }, [currentLevel, startLevel]);

  const pScore = scoreHand(player);
  const dScore = scoreHand(dealer);
  const res = RESULTS[outcome];
  const lvl = currentLevel;
  const features = lvl ? lvl.features : [];
  const showDealerPeek = features.includes("dealer-peek") && phase !== "pre";
  const showTrade = features.includes("trade") && phase === "pick" && !traded;

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
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        .btn{border:none;border-radius:22px;font-family:'Fredoka One',cursive;color:white;cursor:pointer;
             transition:transform .15s,box-shadow .15s;outline:none;-webkit-tap-highlight-color:transparent;}
        .btn:hover{transform:scale(1.08);}
        .btn:active{transform:scale(0.95);}
      `}</style>

      <Confetti on={confetti}/>

      <div style={{
        minHeight:"100vh",
        background: lvl ? WORLDS[lvl.world].bg : "linear-gradient(150deg,#c2e9fb 0%,#a1c4fd 45%,#ffecd2 100%)",
        fontFamily:"Nunito,sans-serif",
        padding:"14px 10px 30px",
        display:"flex", flexDirection:"column", alignItems:"center",
      }}>
        <div style={{width:"100%",maxWidth:500}}>

          {screen === "home" && (
            <HomeScreen game={game} onPlay={() => setScreen("map")} onBadges={() => setScreen("badges")} onFreePlay={startFreePlay}/>
          )}

          {screen === "map" && (
            <WorldMap game={game} onSelectLevel={startLevel} onBack={() => setScreen("home")}/>
          )}

          {screen === "badges" && (
            <BadgesScreen game={game} onBack={() => setScreen("home")}/>
          )}

          {screen === "quiz" && quiz && (
            <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",borderRadius:28,padding:"20px 16px",boxShadow:"0 18px 50px rgba(0,0,0,0.13)",border:"3px solid rgba(255,255,255,0.85)"}}>
              <QuizScreen quiz={quiz} onAnswer={handleQuizAnswer}/>
            </div>
          )}

          {screen === "reward" && (
            <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",borderRadius:28,padding:"20px 16px",boxShadow:"0 18px 50px rgba(0,0,0,0.13)",border:"3px solid rgba(255,255,255,0.85)"}}>
              <RewardScreen starsEarned={roundStars} newBadge={newBadge} levelComplete={true} onContinue={handleRewardContinue}/>
            </div>
          )}

          {screen === "play" && (
            <>
              {/* Level header */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                <button className="btn" onClick={() => { setScreen(freePlay ? "home" : "map"); }} style={{background:"rgba(255,255,255,0.8)",color:"#2d3436",padding:"8px 16px",fontSize:14,border:"2px solid rgba(255,255,255,0.9)"}}>← Back</button>
                <StarDisplay stars={game.stars}/>
                {game.streak >= 3 && (
                  <div style={{background:"#FF475722",borderRadius:14,padding:"4px 12px",fontFamily:"'Fredoka One',cursive",fontSize:13,color:"#FF4757"}}>
                    🔥 {game.streak} streak!
                  </div>
                )}
              </div>

              {lvl && (
                <div style={{marginBottom:10}}>
                  <p style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:WORLDS[lvl.world].color}}>
                    {WORLDS[lvl.world].emoji} Lvl {lvl.id}: {lvl.name}
                  </p>
                  <p style={{fontSize:13,fontWeight:700,color:"#636e72",marginBottom:6}}>{lvl.desc}</p>
                  <ProgressBar current={roundNum} total={lvl.rounds} color={WORLDS[lvl.world].color}/>
                </div>
              )}

              {freePlay && (
                <p style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:"#2ED573",marginBottom:10}}>🎮 Free Play</p>
              )}

              {/* BOARD */}
              <div style={{
                background:"rgba(255,255,255,0.6)", backdropFilter:"blur(12px)",
                borderRadius:28, padding:"20px 16px", boxShadow:"0 18px 50px rgba(0,0,0,0.13)",
                border:"3px solid rgba(255,255,255,0.85)", animation:"fadeup .5s .1s ease both",
              }}>

                {/* PRE-DEAL: invest/bet panel or deal button */}
                {phase === "pre" && (
                  <InvestPanel stars={game.stars} features={features} onChoose={dealRound}/>
                )}

                {phase !== "pre" && (
                  <>
                    {/* DEALER */}
                    <section style={{marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:24}}>🤖</span>
                        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#2d3436"}}>Dealer</span>
                        {(phase==="pick"||phase==="swap") && !showDealerPeek && (
                          <span style={{background:"#dfe6e9",borderRadius:16,padding:"3px 10px",fontSize:12,fontWeight:800,color:"#636e72"}}>Hidden 🤫</span>
                        )}
                      </div>
                      <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                        {dealer.map((c,i) => {
                          const show = phase==="reveal"||phase==="result"||(showDealerPeek && i === 0)||(peeking);
                          return <CardSprite key={i} card={c} hidden={!show} glow={peeking && show && phase==="pick"}/>;
                        })}
                      </div>
                      {(phase==="reveal"||phase==="result") && (
                        <div style={{marginTop:8,textAlign:"center"}}>
                          <span style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#636e72"}}>{dScore.emoji} {dScore.label}</span>
                        </div>
                      )}
                    </section>

                    <div style={{height:2,background:"rgba(0,0,0,0.07)",margin:"0 0 16px"}}/>

                    {/* PLAYER */}
                    <section style={{marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:24}}>⭐</span>
                        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#2d3436"}}>Your Cards</span>
                      </div>
                      <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                        {player.map((c,i) => (
                          <div key={i}
                            onClick={() => { if ((phase==="pick" && !swapped) || (phase==="swap" && extraSwap)) setSelected(selected===i?-1:i); }}
                            style={{
                              cursor: (phase==="pick" && !swapped) || (phase==="swap" && extraSwap) ? "pointer" : "default",
                              transform: selected===i ? "translateY(-12px)" : "none",
                              transition:"transform 0.2s", borderRadius:16,
                              outline: selected===i ? "3px solid #FFA502" : "none", outlineOffset:3,
                            }}>
                            <CardSprite card={c}/>
                          </div>
                        ))}
                      </div>
                      <div style={{marginTop:8,textAlign:"center"}}>
                        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#636e72"}}>{pScore.emoji} {pScore.label}</span>
                      </div>

                      {/* Trade offer */}
                      {showTrade && <TradePanel stars={game.stars} playerHand={player} onTrade={handleTrade}/>}

                      {/* PICK PHASE */}
                      {phase==="pick" && !swapped && !traded && (
                        <div style={{marginTop:14,textAlign:"center",animation:"fadeup .3s ease"}}>
                          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#6c5ce7",marginBottom:10}}>
                            {selected >= 0 ? `Swap your ${player[selected].rank}${player[selected].suit}?` : "Tap a card to swap, or keep both!"}
                          </p>
                          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                            <button className="btn" onClick={swapCard} disabled={selected<0} style={{
                              background: selected>=0 ? "linear-gradient(135deg,#FF6B35,#FF4757)" : "#dfe6e9",
                              padding:"12px 32px", fontSize:18,
                              color: selected>=0 ? "white" : "#b2bec3", cursor: selected>=0 ? "pointer" : "not-allowed",
                            }}>🔄 Swap</button>
                            <button className="btn" onClick={keepCards} style={{
                              background:"linear-gradient(135deg,#2ED573,#00b894)", padding:"12px 32px", fontSize:18,
                            }}>👍 Keep Both!</button>
                          </div>
                        </div>
                      )}

                      {/* SWAP PHASE */}
                      {phase==="swap" && (
                        <div style={{marginTop:14,textAlign:"center",animation:"fadeup .3s ease"}}>
                          {extraSwap && (
                            <div style={{marginBottom:10}}>
                              <p style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#1E90FF",marginBottom:6}}>🔄 Extra swap available! Tap a card.</p>
                              {selected >= 0 && (
                                <button className="btn" onClick={doExtraSwap} style={{background:"linear-gradient(135deg,#1E90FF,#74b9ff)",padding:"10px 24px",fontSize:16,marginBottom:8}}>
                                  🔄 Use Extra Swap
                                </button>
                              )}
                            </div>
                          )}
                          <button className="btn" onClick={showdown} style={{
                            background:"linear-gradient(135deg,#FFA502,#FF6B35)", padding:"14px 44px", fontSize:22,
                            animation:"glow 1.8s infinite", boxShadow:"0 8px 24px rgba(255,107,53,.4)",
                          }}>👀 Showdown!</button>
                        </div>
                      )}
                    </section>

                    {/* THINKING */}
                    {phase==="reveal" && (
                      <div style={{textAlign:"center",padding:14}}>
                        <div style={{fontSize:36,animation:"bounce .6s infinite",display:"inline-block"}}>🤔</div>
                        <p style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#6c5ce7",marginTop:6}}>Comparing hands...</p>
                      </div>
                    )}

                    {/* RESULT */}
                    {phase==="result" && res && (
                      <div style={{
                        textAlign:"center",padding:"20px 14px", background:res.bg, borderRadius:22,
                        animation:"cpop .45s cubic-bezier(0.34,1.56,0.64,1)", border:`2px solid ${res.color}44`,
                      }}>
                        <div style={{fontSize:56,marginBottom:6,display:"inline-block",animation:outcome==="win"?"bounce .9s infinite":"none"}}>{res.emoji}</div>
                        <p style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:res.color,marginBottom:6}}>{res.msg}</p>
                        {roundBet > 0 && outcome === "win" && (
                          <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#FFA502",marginBottom:6}}>
                            💰 Bet paid off! +{roundBet * 2} bonus stars!
                          </p>
                        )}
                        {roundBet > 0 && outcome === "lose" && (
                          <p style={{fontSize:14,fontWeight:700,color:"#636e72",marginBottom:6}}>
                            Stars didn't grow this time, that's okay!
                          </p>
                        )}
                        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:14,flexWrap:"wrap"}}>
                          <div style={{background:"rgba(255,255,255,0.7)",borderRadius:14,padding:"8px 16px",fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#2d3436"}}>
                            ⭐ {pScore.emoji} {pScore.label}
                          </div>
                          <div style={{background:"rgba(255,255,255,0.7)",borderRadius:14,padding:"8px 16px",fontFamily:"'Fredoka One',cursive",fontSize:14,color:"#2d3436"}}>
                            🤖 {dScore.emoji} {dScore.label}
                          </div>
                        </div>
                        <button className="btn" onClick={handleResultContinue} style={{
                          background:"linear-gradient(135deg,#FFA502,#FF6B35)", padding:"14px 40px", fontSize:20,
                          animation:"glow 1.8s infinite", boxShadow:"0 8px 24px rgba(255,107,53,.4)",
                        }}>
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

        <p style={{marginTop:16,fontWeight:800,color:"#636e72",fontSize:13,textAlign:"center"}}>
          <span style={{animation:"bounce 2s infinite",display:"inline-block"}}>💡</span>
          {" "}Pairs are the best! Look for matching numbers!
        </p>
      </div>
    </>
  );
}
