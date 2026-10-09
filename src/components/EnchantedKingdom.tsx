export function EnchantedKingdom() {
  return <div className="enchanted-kingdom" aria-hidden="true">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="kingdom-sky" x2="0" y2="1"><stop stopColor="#3a2559"/><stop offset=".55" stopColor="#976b91"/><stop offset="1" stopColor="#f6b894"/></linearGradient>
        <linearGradient id="castle-stone" x2="0" y2="1"><stop stopColor="#fff0d6"/><stop offset="1" stopColor="#c5a1be"/></linearGradient>
        <linearGradient id="castle-roof" x2="0" y2="1"><stop stopColor="#b88be7"/><stop offset="1" stopColor="#593e83"/></linearGradient>
      </defs>
      <path fill="url(#kingdom-sky)" d="M0 0h1440v900H0z"/>
      <circle cx="1130" cy="140" r="64" fill="#ffdfb8" opacity=".8"/>
      <g className="kingdom-clouds" fill="#ffe9db" opacity=".2"><ellipse cx="220" cy="190" rx="170" ry="30"/><ellipse cx="850" cy="90" rx="200" ry="24"/></g>
      <path d="M0 650Q220 450 430 650Q700 390 950 640Q1240 460 1440 610V900H0" fill="#755d87"/>
      <g fill="url(#castle-stone)" stroke="#d8b6c9" strokeWidth="3">
        <path d="M430 690V480h75v210m440 0V480h75v210M505 690V520h440v170"/>
        <path d="M620 620V330h200v290M560 640V420h70v220M810 640V420h70v220"/>
        <path d="M682 400V220h76v180"/>
      </g>
      <g fill="url(#castle-roof)" stroke="#d2a9de" strokeWidth="2"><path d="m413 480 55-95 55 95m405 0 55-95 55 95M600 330l120-145 120 145M545 420l50-85 50 85m150 0 50-85 50 85M668 220l52-115 52 115"/></g>
      <g stroke="#f4d393" strokeWidth="4"><path d="M720 110V60m-125 280v-35m250 35v-35"/></g>
      <g fill="#f6c18f" className="castle-lights"><path d="M705 395q15-40 30 0v35h-30zM655 475q12-32 24 0v28h-24zM761 475q12-32 24 0v28h-24zM452 565q15-35 30 0v35h-30zM953 565q15-35 30 0v35h-30z"/></g>
      <path d="M680 690V590q40-70 80 0v100" fill="#543654"/>
      <path d="M0 740Q320 670 590 730Q760 700 980 740Q1220 660 1440 725V900H0" fill="#3f5c60"/>
      <path d="M690 690Q770 760 570 900h290Q820 760 750 690" fill="#c7abb1" opacity=".8"/>
      <g fill="#ffdfa0">{Array.from({length:24},(_,i)=><circle key={i} className="kingdom-firefly" cx={(i*137+40)%1440} cy={150+(i*89)%550} r={i%3+1} style={{animationDelay:`${i*.3}s`}}/>)}</g>
    </svg>
  </div>;
}
