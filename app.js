// =====================
// 1) Equipos NBA
// =====================

const equipos = [
  "Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets",
  "Chicago Bulls","Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets",
  "Detroit Pistons","Golden State Warriors","Houston Rockets",
  "Indiana Pacers","LA Clippers","Los Angeles Lakers","Memphis Grizzlies",
  "Miami Heat","Milwaukee Bucks","Minnesota Timberwolves",
  "New Orleans Pelicans","New York Knicks","Oklahoma City Thunder",
  "Orlando Magic","Philadelphia 76ers","Phoenix Suns",
  "Portland Trail Blazers","Sacramento Kings","San Antonio Spurs",
  "Toronto Raptors","Utah Jazz","Washington Wizards"
];

// =====================
// 2) Segmentos
// =====================

const segmentos = {
  FAN: "Fan General",
  ANALISTA: "Analista Estadístico",
  HIST: "Historiador NBA",
  NEGOCIO: "Enfoque Financiero"
};

// =====================
// 3) Contextos
// =====================

const contextos = {
  ACT: "¿Qué equipo es más competitivo actualmente?",
  HIST: "¿Qué equipo es más grande históricamente?",
  FUT: "¿Qué equipo tiene mejor futuro?",
  MAR: "¿Qué equipo tiene mejor marca global?"
};

// Elo
const RATING_INICIAL = 1000;
const K = 32;

// =====================
// Estado
// =====================

const STORAGE_KEY = "nbamash_state_v1";

function defaultState(){
  const buckets = {};
  for (const seg in segmentos){
    for (const ctx in contextos){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      equipos.forEach(e => buckets[key][e] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : defaultState();
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// =====================
// Elo
// =====================

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, A, B, winner){
  const ra = bucket[A];
  const rb = bucket[B];

  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;

  bucket[A] = ra + K * (sa - ea);
  bucket[B] = rb + K * (sb - eb);
}

function randomPair(){
  const a = equipos[Math.floor(Math.random() * equipos.length)];
  let b = a;
  while(b === a){
    b = equipos[Math.floor(Math.random() * equipos.length)];
  }
  return [a,b];
}

function bucketKey(seg, ctx){
  return `${seg}__${ctx}`;
}

function topN(bucket, n=10){
  return Object.entries(bucket)
    .map(([equipo,rating]) => ({equipo,rating}))
    .sort((a,b)=> b.rating - a.rating)
    .slice(0,n);
}

// =====================
// UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const topBox = document.getElementById("topBox");

let currentA, currentB;

function fillSelect(select, obj){
  select.innerHTML = "";
  for(const key in obj){
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = obj[key];
    select.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

function newDuel(){
  [currentA,currentB] = randomPair();
  labelA.textContent = currentA;
  labelB.textContent = currentB;
  questionEl.textContent = contextos[contextSelect.value];
}

function renderTop(){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  const rows = topN(bucket);

  topBox.innerHTML = rows.map((r,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.equipo}</div>
      <div>${r.rating.toFixed(1)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const key = bucketKey(segmentSelect.value, contextSelect.value);
  const bucket = state.buckets[key];

  updateElo(bucket,currentA,currentB,winner);
  saveState();
  renderTop();
  newDuel();
}

document.getElementById("btnA").onclick = ()=> vote("A");
document.getElementById("btnB").onclick = ()=> vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;

document.getElementById("btnReset").onclick = ()=>{
  if(confirm("¿Reiniciar todo el ranking?")){
    state = defaultState();
    saveState();
    renderTop();
    newDuel();
  }
};

newDuel();
renderTop();
