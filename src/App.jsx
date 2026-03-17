import { useState, useCallback } from "react";

const SUITS = {
  "\u2665": { color: "#FF4757", name: "Hearts", bg: "#fff0f1", emoji: "\u2764\uFE0F" },
  "\u2666": { color: "#FF6B35", name: "Diamonds", bg: "#fff4f0", emoji: "\uD83D\uDD36" },
  "\u2663": { color: "#2d3436", name: "Clubs", bg: "#f0f0f0", emoji: "\uD83C\uDF3F" },
  "\u2660": { color: "#2d3436", name: "Spades", bg: "#f0f0f0", emoji: "\uD83D\uDDA4" },
};
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const HAND_RANKS = [
  { name: "Pair", desc: "Two cards that match!", emoji: "\uD83D\uDC6F", example: "5 + 5", color: "#1E90FF" },
  { name: "Red Cards", desc: "Both cards are red!", emoji: "\u2764\uFE0F", example: "\u2665 + \u2666", color: "#FF4757" },
  { name: "Black Cards", desc: "Both cards are black!", emoji: "\uD83D\uDDA4", example: "\u2663 + \u2660", color: "#2d3436" },
  { name: "High Card", desc: "No match \u2014 your biggest card counts!", emoji: "\uD83C\uDCA0", example: "K is big!", color: "#FFA502" },
];

const RANK_VALUE = { A:14, K:13, Q:12, J:11, 10:10, 9:9, 8:8, 7:7, 6:6, 5:5, 4:4, 3:3, 2:2 };

function freshDeck() {
  const d = [];
  for (const s of Object.keys(SUITS))
    for (const r of RANKS)
      d.push({ suit: s, rank: r });
  return d.sort(() => Math.random() - 0.5);
}

function isRed(card) {
  return card.suit === "\u2665" || card.suit === "\u2666";
}

function scoreHand(hand) {
  if (hand.length < 2) return { type: "none", label: "", points: 0 };
  const [a, b] = hand;
  if (a.rank === b.rank) return { type: "pair", label: `Pair of ${a.rank}s!`, points: 3, emoji: "\uD83D\uDC6F" };
  const bothRed = isRed(a) && isRed(b);
  const bothBlack = !isRed(a) && !isRed(b);
  if (bothRed) return { type: "color", label: "Red Cards!", points: 2, emoji: "\u2764\uFE0F" };
  if (bothBlack) return { type: "color", label: "Black Cards!", points: 2, emoji: "\uD83D\uDDA4" };
  const high = RANK_VALUE[a.rank] > RANK_VALUE[b.rank] ? a : b;
  return { type: "high", label: `High Card: ${high.rank}`, points: 1, emoji: "\uD83C\uDCA0" };
}

function compareHands(pHand, dHand) {
  const ps = scoreHand(pHand);
  const ds = scoreHand(dHand);
  if (ps.points > ds.points) return "win";
  if (ps.points < ds.points) return "lose";
  // Tie-break on highest card
  const pHigh = Math.max(RANK_VALUE[pHand[0].rank], RANK_VALUE[pHand[1].rank]);
  const dHigh = Math.max(RANK_VALUE[dHand[0].rank], RANK_VALUE[dHand[1].rank]);
  if (pHigh > dHigh) return "win";
  if (pHigh < dHigh) return "lose";
  return "push";
}

function Confetti({ on }) {
  if (!on) return null;
  const colors = ["#FF4757","#FFA502","#2ED573","#1E90FF","#FF6B81","#ECCC68","#a29bfe","#fd79a8"];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      {Array.from({length:60},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          left:`${Math.random()*100}%`,
          top:"-30px",
          width:10+Math.random()*10,
          height:10+Math.random()*10,
          background:colors[i%8],
          borderRadius: i%3===0?"50%":"3px",
          animation:`cffall ${1.5+Math.random()*1.5}s ${Math.random()*0.8}s ease-in forwards`,
          transform:`rotate(${Math.random()*360}deg)`,
        }}/>
      ))}
    </div>
  );
}

function CardSprite({ card, hidden=false, isNew=false }) {
  const s = SUITS[card.suit];
  return (
    <div style={{
      width:90, height:130,
      background: hidden ? "linear-gradient(135deg,#6c5ce7,#a29bfe)" : "white",
      borderRadius:16,
      boxShadow: isNew
        ? "0 0 0 4px #FFA502, 0 12px 32px rgba(0,0,0,0.25)"
        : "0 6px 20px rgba(0,0,0,0.18)",
      border:"3px solid rgba(255,255,255,0.9)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      position:"relative", flexShrink:0,
      animation: isNew ? "cpop 0.45s cubic-bezier(0.34,1.56,0.64,1)" : "none",
    }}>
      {hidden ? (
        <span style={{fontSize:38}}>🎴</span>
      ):(
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

function HandLabel({ hand, hidden=false }) {
  if (hidden || hand.length < 2) return null;
  const result = scoreHand(hand);
  const bgMap = { pair: "#d4fde4", color: "#fff0f1", high: "#fff9e6" };
  const borderMap = { pair: "#2ED57344", color: "#FF475744", high: "#FFA50244" };
  return (
    <div style={{
      marginTop:10, padding:"8px 16px", borderRadius:16, textAlign:"center",
      background: bgMap[result.type] || "#f0f4ff",
      border: `2px solid ${borderMap[result.type] || "#a29bfe44"}`,
      animation:"fadeup .3s ease",
    }}>
      <span style={{fontSize:24,marginRight:6}}>{result.emoji}</span>
      <span style={{
        fontFamily:"'Fredoka One',cursive", fontSize:20,
        color: result.type === "pair" ? "#2ED573" : result.type === "color" ? "#FF4757" : "#FFA502",
      }}>
        {result.label}
      </span>
      <span style={{
        marginLeft:8, background:"rgba(255,255,255,0.7)", borderRadius:12,
        padding:"2px 10px", fontFamily:"'Fredoka One',cursive", fontSize:14, color:"#636e72",
      }}>
        +{result.points} {result.points === 1 ? "pt" : "pts"}
      </span>
    </div>
  );
}

function HandGuide() {
  return (
    <div style={{
      background:"rgba(255,255,255,0.9)", borderRadius:24, padding:16,
      marginBottom:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
      border:"3px solid rgba(255,255,255,0.9)", animation:"fadeup .4s ease",
    }}>
      <p style={{fontFamily:"'Fredoka One',cursive",fontSize:20,textAlign:"center",color:"#2d3436",marginBottom:12}}>
        🃏 Poker Hands (Easiest First!)
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {HAND_RANKS.map((h)=>(
          <div key={h.name} style={{
            background:"#f8f9fa", borderRadius:14, padding:"10px 14px",
            display:"flex", alignItems:"center", gap:10,
            border:`2px solid ${h.color}33`,
          }}>
            <span style={{fontSize:28}}>{h.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:h.color}}>{h.name}</div>
              <div style={{fontSize:13,fontWeight:700,color:"#636e72"}}>{h.desc}</div>
            </div>
            <div style={{
              background:h.color, color:"white", borderRadius:12,
              padding:"4px 10px", fontFamily:"'Fredoka One',cursive", fontSize:12,
            }}>{h.example}</div>
          </div>
        ))}
      </div>
      <div style={{
        background:"#fff9e6", borderRadius:14, padding:12, textAlign:"center",
        border:"2px solid #FFA50233", marginTop:10,
      }}>
        <p style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:"#2d3436"}}>
          🏆 Pair (3 pts) beats Color Match (2 pts) beats High Card (1 pt)!
        </p>
      </div>
    </div>
  );
}

const RESULTS = {
  win:  { emoji:"\uD83C\uDF89", msg:"You WIN! Amazing job!", color:"#00b894", bg:"#d4fde4" },
  lose: { emoji:"\uD83D\uDE2E", msg:"Dealer wins this time!", color:"#e17055", bg:"#ffe8e0" },
  push: { emoji:"\uD83E\uDD1D", msg:"It's a tie! Good game!", color:"#6c5ce7", bg:"#ede7ff" },
};

export default function App() {
  const [deck,     setDeck]     = useState(freshDeck);
  const [player,   setPlayer]   = useState([]);
  const [dealer,   setDealer]   = useState([]);
  const [phase,    setPhase]    = useState("intro");   // intro | pick | swap | reveal | result
  const [outcome,  setOutcome]  = useState("");
  const [confetti, setConfetti] = useState(false);
  const [guide,    setGuide]    = useState(false);
  const [score,    setScore]    = useState({w:0,l:0});
  const [swapped,  setSwapped]  = useState(false);
  const [selected, setSelected] = useState(-1);        // card index selected for swap

  const deal = useCallback(()=>{
    const d = freshDeck();
    const p = [d.pop(), d.pop()];
    const dl = [d.pop(), d.pop()];
    setDeck(d); setPlayer(p); setDealer(dl);
    setPhase("pick"); setOutcome(""); setConfetti(false);
    setSwapped(false); setSelected(-1);
  },[]);

  const swapCard = () => {
    if (selected < 0) return;
    const d = [...deck];
    const p = [...player];
    p[selected] = d.pop();
    setDeck(d); setPlayer(p);
    setSwapped(true); setSelected(-1);
    setPhase("swap");
  };

  const keepCards = () => {
    setPhase("swap");
  };

  const showdown = () => {
    setPhase("reveal");
    setTimeout(()=>{
      const result = compareHands(player, dealer);
      setOutcome(result);
      setPhase("result");
      if (result === "win") {
        setScore(s=>({...s,w:s.w+1}));
        setConfetti(true);
        setTimeout(()=>setConfetti(false),3200);
      } else if (result === "lose") {
        setScore(s=>({...s,l:s.l+1}));
      }
    }, 1200);
  };

  const pScore = scoreHand(player);
  const dScore = scoreHand(dealer);
  const res = RESULTS[outcome];

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
        background:"linear-gradient(150deg,#c2e9fb 0%,#a1c4fd 45%,#ffecd2 100%)",
        fontFamily:"Nunito,sans-serif",
        padding:"14px 10px 30px",
        display:"flex", flexDirection:"column", alignItems:"center",
      }}>

        {/* HEADER */}
        <div style={{textAlign:"center",marginBottom:12,animation:"fadeup .5s ease"}}>
          <div style={{fontSize:44,animation:"bounce 2s infinite",display:"inline-block"}}>🃏</div>
          <h1 style={{
            fontFamily:"'Fredoka One',cursive",
            fontSize:"clamp(22px,5vw,38px)",
            color:"#2d3436",
            textShadow:"2px 2px 0 rgba(255,255,255,0.6)",
            lineHeight:1.2, marginTop:4,
          }}>Poker Fun! Learn Cards</h1>
          <p style={{fontWeight:800,color:"#636e72",fontSize:14,marginTop:4}}>
            Match your cards to make the{" "}
            <span style={{color:"#FF4757",fontFamily:"'Fredoka One',cursive",fontSize:18}}>best hand</span>!
          </p>
        </div>

        {/* SCORE */}
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          {[["🏆 Wins",score.w,"#2ED573"],["😬 Losses",score.l,"#FF4757"]].map(([lbl,n,col])=>(
            <div key={lbl} style={{
              background:"rgba(255,255,255,0.75)", borderRadius:18,
              padding:"7px 18px", fontFamily:"'Fredoka One',cursive",
              fontSize:16, color:col, boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
              border:"2px solid rgba(255,255,255,0.9)",
            }}>{lbl}: {n}</div>
          ))}
        </div>

        {/* GUIDE BUTTON */}
        <button className="btn" onClick={()=>setGuide(g=>!g)} style={{
          background:"rgba(255,255,255,0.8)", color:"#2d3436",
          padding:"8px 20px", fontSize:14, marginBottom:12,
          boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
          border:"2px solid rgba(255,255,255,0.9)",
        }}>
          {guide ? "🙈 Hide Guide" : "👀 Learn Poker Hands!"}
        </button>

        {guide && <div style={{width:"100%",maxWidth:480}}><HandGuide/></div>}

        {/* BOARD */}
        <div style={{
          background:"rgba(255,255,255,0.6)",
          backdropFilter:"blur(12px)",
          borderRadius:28, padding:"20px 16px",
          width:"100%", maxWidth:500,
          boxShadow:"0 18px 50px rgba(0,0,0,0.13)",
          border:"3px solid rgba(255,255,255,0.85)",
          animation:"fadeup .5s .1s ease both",
        }}>

          {/* INTRO */}
          {phase==="intro" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:64,animation:"wiggle 1.2s infinite",display:"inline-block",marginBottom:12}}>🎮</div>
              <p style={{fontSize:17,fontWeight:800,color:"#2d3436",lineHeight:1.8,marginBottom:20}}>
                You and the Dealer each get <b>2 cards</b>.<br/>
                Try to make the best hand!<br/>
                <span style={{color:"#2ED573",fontFamily:"'Fredoka One',cursive",fontSize:18}}>Pairs</span> beat{" "}
                <span style={{color:"#FF4757",fontFamily:"'Fredoka One',cursive",fontSize:18}}>Color Matches</span> beat{" "}
                <span style={{color:"#FFA502",fontFamily:"'Fredoka One',cursive",fontSize:18}}>High Cards</span><br/>
                <span style={{color:"#b2bec3",fontSize:14}}>You can swap 1 card to improve your hand!</span>
              </p>
              <button className="btn" onClick={deal} style={{
                background:"linear-gradient(135deg,#FFA502,#FF6B35)",
                padding:"16px 48px", fontSize:24,
                animation:"glow 1.8s infinite",
                boxShadow:"0 8px 24px rgba(255,107,53,.4)",
              }}>🃏 Deal Cards!</button>
            </div>
          )}

          {phase!=="intro" && (
            <>
              {/* DEALER */}
              <section style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:24}}>🤖</span>
                  <span style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#2d3436"}}>Dealer's Cards</span>
                  {(phase==="pick"||phase==="swap") && (
                    <span style={{background:"#dfe6e9",borderRadius:16,padding:"3px 10px",fontSize:12,fontWeight:800,color:"#636e72"}}>
                      Hidden 🤫
                    </span>
                  )}
                </div>
                <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                  {dealer.map((c,i)=>(
                    <CardSprite key={i} card={c} hidden={phase!=="reveal"&&phase!=="result"}/>
                  ))}
                </div>
                {(phase==="reveal"||phase==="result") && <HandLabel hand={dealer}/>}
              </section>

              <div style={{height:2,background:"rgba(0,0,0,0.07)",margin:"0 0 16px"}}/>

              {/* PLAYER */}
              <section style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:24}}>⭐</span>
                  <span style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#2d3436"}}>Your Cards</span>
                </div>
                <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                  {player.map((c,i)=>(
                    <div key={i}
                      onClick={()=>{ if(phase==="pick" && !swapped) setSelected(selected===i?-1:i); }}
                      style={{
                        cursor: phase==="pick" && !swapped ? "pointer" : "default",
                        transform: selected===i ? "translateY(-12px)" : "none",
                        transition: "transform 0.2s",
                        borderRadius:16,
                        outline: selected===i ? "3px solid #FFA502" : "none",
                        outlineOffset: 3,
                      }}
                    >
                      <CardSprite card={c} isNew={false}/>
                    </div>
                  ))}
                </div>
                <HandLabel hand={player}/>

                {/* PICK PHASE: swap or keep */}
                {phase==="pick" && !swapped && (
                  <div style={{
                    marginTop:14, textAlign:"center",
                    animation:"fadeup .3s ease",
                  }}>
                    <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#6c5ce7",marginBottom:10}}>
                      {selected >= 0
                        ? `Tap "Swap" to replace your ${player[selected].rank}${player[selected].suit}!`
                        : "Tap a card to select it for swapping, or keep both!"}
                    </p>
                    <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                      <button className="btn" onClick={swapCard} disabled={selected<0} style={{
                        background: selected>=0 ? "linear-gradient(135deg,#FF6B35,#FF4757)" : "#dfe6e9",
                        padding:"12px 32px", fontSize:18,
                        boxShadow: selected>=0 ? "0 8px 20px rgba(255,71,87,.35)" : "none",
                        color: selected>=0 ? "white" : "#b2bec3",
                        cursor: selected>=0 ? "pointer" : "not-allowed",
                      }}>🔄 Swap Card</button>
                      <button className="btn" onClick={keepCards} style={{
                        background:"linear-gradient(135deg,#2ED573,#00b894)",
                        padding:"12px 32px", fontSize:18,
                        boxShadow:"0 8px 20px rgba(46,213,115,.35)",
                      }}>👍 Keep Both!</button>
                    </div>
                  </div>
                )}

                {/* SWAP PHASE: ready to showdown */}
                {phase==="swap" && (
                  <div style={{marginTop:14,textAlign:"center",animation:"fadeup .3s ease"}}>
                    <p style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#6c5ce7",marginBottom:10}}>
                      Ready to see who wins?
                    </p>
                    <button className="btn" onClick={showdown} style={{
                      background:"linear-gradient(135deg,#FFA502,#FF6B35)",
                      padding:"14px 44px", fontSize:22,
                      animation:"glow 1.8s infinite",
                      boxShadow:"0 8px 24px rgba(255,107,53,.4)",
                    }}>👀 Showdown!</button>
                  </div>
                )}
              </section>

              {/* THINKING */}
              {phase==="reveal" && (
                <div style={{textAlign:"center",padding:14}}>
                  <div style={{fontSize:36,animation:"bounce .6s infinite",display:"inline-block"}}>🤔</div>
                  <p style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#6c5ce7",marginTop:6}}>
                    Comparing hands...
                  </p>
                </div>
              )}

              {/* RESULT */}
              {phase==="result" && res && (
                <div style={{
                  textAlign:"center", padding:"20px 14px",
                  background:res.bg, borderRadius:22,
                  animation:"cpop .45s cubic-bezier(0.34,1.56,0.64,1)",
                  border:`2px solid ${res.color}44`,
                }}>
                  <div style={{
                    fontSize:56, marginBottom:6, display:"inline-block",
                    animation: outcome==="win" ? "bounce .9s infinite" : "none",
                  }}>{res.emoji}</div>
                  <p style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:res.color,marginBottom:10}}>
                    {res.msg}
                  </p>
                  <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:16,flexWrap:"wrap"}}>
                    <div style={{
                      background:"rgba(255,255,255,0.7)", borderRadius:14,
                      padding:"8px 20px", fontFamily:"'Fredoka One',cursive",
                      fontSize:16, color:"#2d3436",
                    }}>⭐ You: {pScore.emoji} {pScore.label} ({pScore.points}pts)</div>
                    <div style={{
                      background:"rgba(255,255,255,0.7)", borderRadius:14,
                      padding:"8px 20px", fontFamily:"'Fredoka One',cursive",
                      fontSize:16, color:"#2d3436",
                    }}>🤖 Dealer: {dScore.emoji} {dScore.label} ({dScore.points}pts)</div>
                  </div>
                  <button className="btn" onClick={deal} style={{
                    background:"linear-gradient(135deg,#FFA502,#FF6B35)",
                    padding:"14px 40px", fontSize:20,
                    animation:"glow 1.8s infinite",
                    boxShadow:"0 8px 24px rgba(255,107,53,.4)",
                  }}>🎮 Play Again!</button>
                </div>
              )}
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
