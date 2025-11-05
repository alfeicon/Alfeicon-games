// ======================
// Alfeicon Games - script.js (morph burger → X)
// ======================

(() => {
  // ---------- Utils ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms = 120) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

  // ---------- Año del footer ----------
  document.addEventListener('DOMContentLoaded', () => {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  });

  // ---------- Ajustar --nav-h ----------
  const navbar = $('.navbar');
  const applyNavHeight = () => {
    if (!navbar) return;
    const h = navbar.offsetHeight || 60;
    document.documentElement.style.setProperty('--nav-h', `${h}px`);
  };
  applyNavHeight();
  if ('ResizeObserver' in window && navbar) {
    const ro = new ResizeObserver(applyNavHeight);
    ro.observe(navbar);
  } else {
    window.addEventListener('resize', debounce(applyNavHeight, 120));
  }

  // ---------- Menú móvil ----------
  const toggleBtn = $('.nav-toggle');
  const navPanel  = $('#nav-panel');
  if (!toggleBtn || !navPanel) return;

  if (navPanel.parentElement !== document.body) document.body.appendChild(navPanel);

  let fly = navPanel.querySelector('.nav-fly');
  if (!fly) {
    fly = document.createElement('div'); fly.className = 'nav-fly';
    while (navPanel.firstChild) { if (navPanel.firstChild === fly) break; fly.appendChild(navPanel.firstChild); }
    navPanel.appendChild(fly);
  }

  function setMenuOriginFromButton() {
    const r = toggleBtn.getBoundingClientRect();
    const cx = r.left + r.width/2; const cy = r.top + r.height/2;
    navPanel.style.setProperty('--cx', `${cx}px`);
    navPanel.style.setProperty('--cy', `${cy}px`);
  }

  let savedScrollY = 0;
  function disableScroll(){ savedScrollY = window.scrollY||document.documentElement.scrollTop||0; document.documentElement.classList.add('scroll-lock'); document.body.classList.add('scroll-lock'); document.body.style.top=`-${savedScrollY}px`; }
  function enableScroll(){ document.documentElement.classList.remove('scroll-lock'); document.body.classList.remove('scroll-lock'); const top=document.body.style.top; document.body.style.top=''; const y=top?parseInt(top,10)*-1:0; window.scrollTo(0, isNaN(y)?0:y); }

  const body = document.body;
  const firstLink = () => $('#nav-panel a');
  const links     = () => $$('#nav-panel a');
  let lastFocused = null;

  function trapFocus(e){
    if (!navPanel.classList.contains('show') || e.key !== 'Tab') return;
    const focusables = [toggleBtn, ...links()]; if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openMenu(){
    setMenuOriginFromButton();
    navPanel.classList.remove('closing'); navPanel.classList.add('show');
    toggleBtn.classList.add('open'); body.classList.add('menu-open'); disableScroll();
    toggleBtn.setAttribute('aria-label','Cerrar menú'); toggleBtn.setAttribute('aria-expanded','true'); navPanel.setAttribute('aria-hidden','false');
    lastFocused = document.activeElement; (firstLink() || toggleBtn).focus();
  }
  function closeMenu(){
    navPanel.classList.add('closing'); navPanel.classList.remove('show');
    toggleBtn.classList.remove('open'); body.classList.remove('menu-open');
    toggleBtn.setAttribute('aria-label','Abrir menú'); toggleBtn.setAttribute('aria-expanded','false'); navPanel.setAttribute('aria-hidden','true');
    const onDone = (ev)=>{ if (ev.target !== fly || ev.propertyName !== 'transform') return; fly.removeEventListener('transitionend', onDone); navPanel.classList.remove('closing'); enableScroll(); if (lastFocused && lastFocused.focus) lastFocused.focus(); };
    fly.addEventListener('transitionend', onDone);
    setTimeout(()=>{ if (navPanel.classList.contains('closing')) { navPanel.classList.remove('closing'); enableScroll(); } }, 420);
  }
  function toggleMenu(force){ const open = force!==undefined ? force : !navPanel.classList.contains('show'); open ? openMenu() : closeMenu(); }

  toggleBtn.addEventListener('click', ()=>toggleMenu());
  const recalcOrigin = debounce(()=>{ if (navPanel.classList.contains('show')) setMenuOriginFromButton(); }, 80);
  window.addEventListener('resize', recalcOrigin);
  window.addEventListener('orientationchange', recalcOrigin);
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && navPanel.classList.contains('show')) closeMenu(); });
  document.addEventListener('keydown', trapFocus);
  links().forEach(a => a.addEventListener('click', ()=>toggleMenu(false)));
  document.addEventListener('click', (e)=>{ const inside = navPanel.contains(e.target) || toggleBtn.contains(e.target); if (!inside && navPanel.classList.contains('show')) closeMenu(); }, {capture:true});

  // ---------- Destacado ----------
  const destacado = { titulo:"Mario Kart™ World", precioCLP:30000, sizeGB:6.9, compat:"Nintendo Switch 2", imagen:"game.avif", whatsapp:"Hola! Quiero comprar *Mario Kart 8 Deluxe*. ¿Está disponible?" };
  (function renderDestacado(d){
    const $id = id => document.getElementById(id);
    if (!$id("feat-title")) return;
    $id("feat-title").textContent = d.titulo;
    $id("feat-price").textContent = `$${Number(d.precioCLP).toLocaleString("es-CL")} CLP`;
    $id("feat-size").textContent  = `💾 ${d.sizeGB} GB`;
    $id("feat-compat").textContent= `✅ ${d.compat}`;
    const img=$id("feat-img"); img.src=d.imagen; img.onerror=()=>{img.style.display="none";};
    const msg = encodeURIComponent(d.whatsapp);
    const btn=$id("feat-btn"); btn.href=`https://wa.me/56926411278?text=${msg}`; btn.setAttribute('rel','noopener'); btn.setAttribute('target','_blank');
  })(destacado);

  // ---------- Atajos (rutas reales) ----------
  document.addEventListener('keydown', (e)=>{
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k==='p') location.href='/pack/pack.html';
    if (k==='j') location.href='/games/game.html';
    if (k==='i') location.href='/instrucciones/instrucc.html';
  });
})();

/*************************
 * PREVIEW: Packs en Home
 *************************/
const PACKS_CSV_URL="https://docs.google.com/spreadsheets/d/1vMSEjE9dQYossGGN_4KP_-DL8sKkb_09R0e2mo9WLHQ/gviz/tq?tqx=out:csv&gid=858783180";

function fmtCLP(n){ const v=Number(n||0); try{ return v.toLocaleString('es-CL',{style:'currency',currency:'CLP'});}catch{ return '$'+String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.');}}
function splitGames(raw){ if(!raw) return []; return String(raw).replace(/\r?\n/g,',').split(/[,;•·\-\u2013\u2014\|]+/g).map(s=>s.trim()).filter(Boolean); }
function orderPacks(arr){ return [...arr].sort((a,b)=>{ const da=a.Fecha?new Date(a.Fecha).getTime():0; const db=b.Fecha?new Date(b.Fecha).getTime():0; if (db!==da) return db-da; const ia=parseInt(a["Pack ID"],10)||0; const ib=parseInt(b["Pack ID"],10)||0; return ib-ia; }); }
function renderLatestPacksFromSheet(rows){
  const wrap=document.getElementById('packs-scroller'); if(!wrap) return; wrap.innerHTML='';
  orderPacks(rows).slice(0,4).forEach(pk=>{
    const id=pk["Pack ID"]; const titulo=`Pack ${id}`; const juegos=splitGames(pk["Juegos Incluidos"]);
    const top5=juegos.slice(0,5); const extra=Math.max(0, juegos.length-5); const precio=Number(pk["Precio CLP"])||0;
    const consola=pk.Consola||''; const fallback=(consola.includes('Nintendo Switch 2') && !consola.includes('Nintendo Switch, Nintendo Switch 2'))?'imagen_pack2.png':'imagen_pack.png';
    const cover=(pk["Imagen URL"] && pk["Imagen URL"].trim()!=='')?pk["Imagen URL"]:fallback;
    const url=`/pack/pack.html#pack-${id}`;
    const a=document.createElement('a'); a.className='fp-card'; a.href=url;
    a.innerHTML=`
      <img src="${cover}" alt="${titulo}">
      <div class="fp-info">
        <h4>${titulo}</h4>
        <p>Nintendo Switch • Entrega inmediata</p>
        <div class="fp-price">${fmtCLP(precio)}</div>
        <div class="fp-games">${top5.map(n=>`<span class="game-chip" title="${n}">${n}</span>`).join('')}</div>
        ${extra>0?`<a class="fp-more" href="${url}">ver más (+${extra})</a>`:''}
      </div>`;
    wrap.appendChild(a);
  });
}
function loadPacksPreview(){
  if (!window.Papa) { console.warn('PapaParse no está cargado'); return; }
  Papa.parse(PACKS_CSV_URL,{download:true, header:true,
    complete:({data})=>{ const rows=(data||[]).filter(r=>r["Pack ID"]); renderLatestPacksFromSheet(rows); },
    error:(err)=>console.error('Error CSV Packs Home:', err)
  });
}
document.addEventListener('DOMContentLoaded', loadPacksPreview);

// ==========================================
// === RULETA DE DESCUENTOS (modal Home) ====
// === Conexión a Apps Script: validar/claim ===
// ==========================================
(() => {
  // ---------- Backend (TU Apps Script) ----------
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwkTRd_As56mgq6eEkNOyrRY80D4A-dcR7Alrf34Xz_wTHEGS4NNZMexZLpYenmPlo_/exec";

  // ---------- Premios + probabilidades (reales) ----------
  // Ajusta los "weight" si quieres cambiar probabilidades:
  // más weight => más probable.
const SEGMENTS = [
  { label: "Sin premio 😅", weight: 60 },
  { label: "10%\nOFF",     weight: 20 },
  { label: "25%\nOFF",     weight: 10 },
  { label: "50%\nOFF",     weight: 6  },
  { label: "100%\nOFF",    weight: 0.5 }
];

  // Mínimo visual por segmento (solo estética, no cambia probabilidades reales)
  const MIN_VISUAL_PCT = 0.08;

  // ---------- DOM ----------
  const $ = s => document.querySelector(s);
  const elOpen     = $("#open-ruleta");
  const elBackdrop = $("#ruleta-backdrop");
  const elModal    = $("#ruleta-modal");
  const elClose    = $("#ruleta-close");
  const elCanvas   = $("#ruleta-canvas");
  const elSpin     = $("#spin-btn");
  const elCoupon   = $("#coupon-input");
  const elValidate = $("#validate-btn");
  const elStatus   = $("#coupon-status");
  const elResult   = $("#result-box");

  let currentCoupon = null;
  let spinning = false;

  // ---------- Utils ----------
  const vibrate = ms => { try{ navigator.vibrate && navigator.vibrate(ms); }catch{} };
  const USED_KEY = "alfeicon_ruleta_used_local"; // candado local por navegador
  const usedList = () => { try{ return JSON.parse(localStorage.getItem(USED_KEY)||"[]"); }catch{ return []; } };
  const isUsedLocal  = code => usedList().some(x=>x.code===code);
  const markUsedLocal = (code, prize) => {
    const list = usedList();
    if (!list.find(x=>x.code===code)) {
      list.push({ code, prize, at: new Date().toISOString() });
      localStorage.setItem(USED_KEY, JSON.stringify(list));
    }
  };

  // ---- API Apps Script ----
  async function apiValidate(code){
    const url = `${GAS_URL}?action=validate&code=${encodeURIComponent(code)}&_=${Date.now()}`;
    const r = await fetch(url, { method:"GET" });
    if (!r.ok) throw new Error("Network error");
    return r.json(); // { ok, code, state, premio, fecha }
  }
  async function apiClaim(code, prize){
    const url = `${GAS_URL}?action=claim&code=${encodeURIComponent(code)}&prize=${encodeURIComponent(prize)}&_=${Date.now()}`;
    const r = await fetch(url, { method:"GET" });
    if (!r.ok) throw new Error("Network error");
    return r.json(); // { ok, code, state:"USADO", prize, fecha } o { ok:false, error, state }
  }

  // ---------- Modal ----------
  function lockScroll(){ document.documentElement.classList.add("scroll-lock"); document.body.classList.add("scroll-lock"); }
  function unlockScroll(){ document.documentElement.classList.remove("scroll-lock"); document.body.classList.remove("scroll-lock"); }
  function openModal(e){ if(e) e.preventDefault(); elBackdrop.classList.add("backdrop--show"); elModal.setAttribute("aria-hidden","false"); lockScroll(); setTimeout(()=>elCoupon?.focus(),60); }
  function closeModal(){ elBackdrop.classList.remove("backdrop--show"); elModal.setAttribute("aria-hidden","true"); unlockScroll(); }
  elOpen?.addEventListener("click", openModal);
  elClose?.addEventListener("click", closeModal);
  elBackdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", e=>{ if(e.key==="Escape" && elModal.getAttribute("aria-hidden")==="false") closeModal(); });

  // ---------- Validación cupón (contra GAS) ----------
  elCoupon?.addEventListener("input", ()=>{ elCoupon.value = elCoupon.value.toUpperCase(); });
  elCoupon?.addEventListener("keydown", e=>{ if (e.key==="Enter") elValidate?.click(); });

  elValidate?.addEventListener("click", async ()=>{
    const code = (elCoupon.value||"").trim().toUpperCase();
    if(!code){
      elStatus.className="badge warn"; elStatus.textContent="Ingresa un código";
      elSpin.disabled=true; currentCoupon=null; vibrate(40); return;
    }
    if (isUsedLocal(code)){
      elStatus.className="badge warn"; elStatus.textContent="Este cupón ya se usó en este dispositivo";
      elSpin.disabled=true; currentCoupon=null; vibrate(60); return;
    }

    elStatus.className="badge"; elStatus.textContent="Validando…";
    try{
      const res = await apiValidate(code);
      // Estados: ACTIVO | BLOQUEADO | USADO | NO_ENCONTRADO
      if (!res.ok || res.state === "NO_ENCONTRADO"){
        elStatus.className="badge warn"; elStatus.textContent="Cupón inválido";
        elSpin.disabled=true; currentCoupon=null; vibrate(60); return;
      }
      if (res.state === "USADO"){
        elStatus.className="badge warn"; elStatus.textContent="Cupón ya utilizado";
        elSpin.disabled=true; currentCoupon=null; vibrate(60); return;
      }
      if (res.state === "BLOQUEADO"){
        elStatus.className="badge warn"; elStatus.textContent="Cupón bloqueado";
        elSpin.disabled=true; currentCoupon=null; vibrate(60); return;
      }
      // ACTIVO ⇒ OK
      currentCoupon = code;
      elStatus.className="badge success"; elStatus.textContent="Cupón válido ✓ Puedes girar";
      elSpin.disabled=false; vibrate(20);
    }catch(err){
      elStatus.className="badge warn"; elStatus.textContent="Error de red al validar";
      elSpin.disabled=true; currentCoupon=null; vibrate(60);
    }
  });

  // ---------- Canvas HiDPI ----------
  const ctx = elCanvas?.getContext("2d");
  if (!ctx) return;
  const BASE = 520;
  const DPR  = Math.max(1, window.devicePixelRatio||1);
  elCanvas.width  = BASE * DPR;
  elCanvas.height = BASE * DPR;
  elCanvas.style.width = "100%";
  elCanvas.style.height = "auto";
  ctx.scale(DPR, DPR);

  const size   = BASE;
  const center = size / 2;
  const radius = center - 12;
  let angleStart = 0;

  const textColor = "#202020";
  const segFillA = "#fefefe";
  const segFillB = "#f9f9f9";

  // ---------- Cálculo de porciones visuales (con mínimo) ----------
  function getProbPortions() {
    const total = SEGMENTS.reduce((a,b)=>a+b.weight,0);
    return SEGMENTS.map(s => s.weight / total);
  }
  function getVisualPortions(minPct = MIN_VISUAL_PCT) {
    const n = SEGMENTS.length;
    const safeMin = Math.min(minPct, 1 / n - 0.0001);
    const probs = getProbPortions();
    const mins  = Array(n).fill(safeMin);
    let pool    = 1 - (safeMin * n);
    if (pool <= 0) return Array(n).fill(1/n);
    const probSum = probs.reduce((a,b)=>a+b,0);
    const scaled = probs.map(p => (p / probSum) * pool);
    return scaled.map((v,i)=> v + mins[i]);
  }
  let visualPortions = getVisualPortions();
  window.addEventListener("resize", () => { visualPortions = getVisualPortions(); drawWheel(); });

  // ---------- Dibujo ----------
  function drawWheel(){
    ctx.clearRect(0,0,size,size);
    ctx.beginPath(); ctx.arc(center,center, radius, 0, Math.PI*2); ctx.fillStyle = "#ffffff"; ctx.fill();

    let startAng = angleStart;
    for (let i=0;i<SEGMENTS.length;i++){
      const portion = visualPortions[i];
      const angle = portion * Math.PI * 2;
      const s = startAng;
      const e = startAng + angle;

      ctx.beginPath();
      ctx.moveTo(center,center);
      ctx.arc(center,center, radius, s, e);
      ctx.closePath();
      ctx.fillStyle = (i % 2 === 0) ? segFillA : segFillB;
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const mid = s + angle/2;
      ctx.save();
      ctx.translate(center,center);
      ctx.rotate(mid);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textColor;
      const deg = angle * (180/Math.PI);
      const fontSize = Math.max(16, Math.min(22, (deg/30)*18));
      ctx.font = `900 ${fontSize}px Inter, system-ui`;
      const lines = SEGMENTS[i].label.split("\n");
      const lineGap = fontSize * 1.2;
      const textR = radius - 20;
      lines.forEach((line, j) => {
        const y = (j - (lines.length - 1)/2) * lineGap;
        ctx.fillText(line, textR, y);
      });
      ctx.restore();

      startAng = e;
    }
  }
  drawWheel();

  // ---------- Selección determinística por cupón (probabilidad real) ----------
  function hash32(str){ let h = 2166136261 >>> 0; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seededIndex(code){
    const seed  = hash32(code);
    const probs = getProbPortions();
    const r = (seed % 100000) / 100000;
    let acc = 0;
    for (let i=0;i<probs.length;i++){
      acc += probs[i];
      if (r <= acc) return i;
    }
    return probs.length - 1;
  }

  // ---------- Mapeo índice → ángulo usando porciones visuales ----------
  function angleForIndex(idx){
    let acc = 0;
    for (let i=0;i<idx;i++) acc += visualPortions[i];
    const portion = visualPortions[idx];
    const start = acc * Math.PI * 2;
    const mid   = start + (portion * Math.PI * 2) / 2;
    const pointer = -Math.PI/2; // flecha arriba
    let delta = pointer - (mid + angleStart);
    while (delta < 0) delta += Math.PI*2;
    return delta;
  }

  // =========================================================
  // =============== CONFETTI / SERPENTINA ===================
  // =========================================================
  // Crea un canvas overlay temporal para dibujar confetti
  function makeOverlayCanvas(){
    let c = document.getElementById("confetti-layer");
    if (!c){
      c = document.createElement("canvas");
      c.id = "confetti-layer";
      c.style.position = "fixed";
      c.style.left = "0";
      c.style.top = "0";
      c.style.width = "100%";
      c.style.height = "100%";
      c.style.pointerEvents = "none";
      c.style.zIndex = "9999";
      document.body.appendChild(c);
    }
    const dpr = Math.max(1, window.devicePixelRatio||1);
    c.width  = Math.floor(innerWidth * dpr);
    c.height = Math.floor(innerHeight * dpr);
    c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
    return c;
  }

  function randomColor(){
    const colors = ["#FFD166","#06D6A0","#EF476F","#118AB2","#8338EC","#FB5607","#3A86FF","#FFBE0B"];
    return colors[Math.floor(Math.random()*colors.length)];
  }
  function randomGray(){
    const g = Math.floor(100 + Math.random()*80); // 100–180
    return `rgb(${g},${g},${g})`;
  }

  function animateConfetti(particles, durationMs=1800){
    const layer = makeOverlayCanvas();
    const ctxC  = layer.getContext("2d");
    const start = performance.now();

    function frame(t){
      const elapsed = t - start;
      ctxC.clearRect(0,0,layer.width,layer.height);

      for (const p of particles){
        p.vy += p.g;
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.vr;
        p.life -= 1;

        ctxC.save();
        ctxC.translate(p.x, p.y);
        ctxC.rotate(p.rot);
        ctxC.fillStyle = p.color;
        ctxC.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        ctxC.restore();
      }
      // elimina muertos
      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        if (p.life<=0 || p.y > innerHeight+50) particles.splice(i,1);
      }

      if (elapsed < durationMs && particles.length){
        requestAnimationFrame(frame);
      } else {
        // limpiar al final
        ctxC.clearRect(0,0,layer.width,layer.height);
        // no removemos el canvas: se reutiliza para próximos disparos
      }
    }
    requestAnimationFrame(frame);
  }

  // Serpentina colorida (ganadores)
  function launchSerpentinaBurst(x, y, count=160, gravity=0.12){
    const particles = [];
    for (let i=0;i<count;i++){
      const a  = (-Math.PI/2) + (Math.random()-0.5)*Math.PI*1.6; // abanico amplio
      const sp = 3 + Math.random()*4;
      particles.push({
        x, y,
        vx: Math.cos(a)*sp,
        vy: Math.sin(a)*sp,
        life: 40 + Math.random()*30,
        size: 4 + Math.random()*3,
        rot: Math.random()*Math.PI*2,
        vr: (Math.random()-0.5)*0.3,
        color: randomColor(),
        g: gravity
      });
    }
    animateConfetti(particles, 2000);
  }

  // Confetti gris (sin premio)
  function launchSadConfettiBurst(x, y, count=70, gravity=0.18){
    const particles = [];
    const angleBase = -Math.PI/2;
    for (let i=0;i<count;i++){
      const a  = angleBase + (Math.random()-0.5)*Math.PI*0.8; // abanico más estrecho
      const sp = 2 + Math.random()*3; // más lento
      particles.push({
        x, y,
        vx: Math.cos(a)*sp,
        vy: Math.sin(a)*sp,
        life: 40 + Math.random()*20,
        size: 3 + Math.random()*2,
        rot: Math.random()*Math.PI*2,
        vr: (Math.random()-0.5)*0.2,
        color: randomGray(),
        g: gravity
      });
    }
    animateConfetti(particles, 1600);
  }

  function getEncouragement(){
    const msgs = [
      "Casi casi… ¡inténtalo nuevamente una proxima vez! 💪",
      "¡La próxima sale! 🙌",
      "Sigue probando, tendrás más suerte la próxima 🍀",
      "Nada hoy, pero el próximo giro te sorprendera ✨"
    ];
    return msgs[Math.floor(Math.random()*msgs.length)];
  }

  function celebrateByPrize(prizeText){
    const x = innerWidth/2;
    const y = 90;
    if (/sin\s*premio/i.test(prizeText)){
      launchSadConfettiBurst(x, y, 70, 0.18);
      return;
    }
    // Intensidad según % de descuento
    let count = 120, gravity=0.12;
    if (/80%/i.test(prizeText))      { count = 220; gravity = 0.10; }
    else if (/50%/i.test(prizeText)) { count = 180; gravity = 0.11; }
    else if (/25%/i.test(prizeText)) { count = 150; gravity = 0.115; }
    else if (/10%/i.test(prizeText)) { count = 130; gravity = 0.12; }
    launchSerpentinaBurst(x, y, count, gravity);
  }

  // ---------- Giro ----------
  async function spin(){
    if (spinning || !currentCoupon) return;
    spinning = true;
    elSpin.disabled = true;

    const idx    = seededIndex(currentCoupon);   // selección REAL
    const target = angleForIndex(idx);           // posición VISUAL
    const extra  = Math.PI * 2 * (3 + Math.floor(Math.random() * 3)); // 3–5 vueltas
    const totalRotation = target + extra;

    const duration = 3600;
    const t0 = performance.now();
    let temp = 0;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function animate(now){
      const p = Math.min(1, (now - t0) / duration);
      const eased   = easeOut(p);
      const current = eased * totalRotation;
      angleStart += current - temp; temp = current;
      drawWheel();
      if (p < 1) requestAnimationFrame(animate);
      else finish();
    }
    requestAnimationFrame(animate);

    async function finish(){
      angleStart %= (Math.PI*2);
      const prizeText = SEGMENTS[idx].label.replace(/\n/g," ");

      // Canje atómico en el backend ANTES de mostrar premio
      try{
        const claim = await apiClaim(currentCoupon, prizeText);
        if (claim.ok) {
          if (/sin\s*premio/i.test(prizeText)) {
            elResult.innerHTML =
              `<div class='result-prize'>😅 Esta vez no hubo premio</div>` +
              `<div class='hint'>${getEncouragement()}</div>`;
          } else {
            elResult.innerHTML =
              `<div class='result-prize'>🎉 ¡Ganaste: <strong>${prizeText}</strong>!</div>` +
              `<div class='hint'>Quedó asociado a tu cupón ${currentCoupon}.</div>`;
          }
          celebrateByPrize(prizeText);
          markUsedLocal(currentCoupon, prizeText);
          vibrate([20,30,20]);
        } else {
          const msg =
            claim.state === "USADO"         ? "Este cupón ya fue usado." :
            claim.state === "BLOQUEADO"     ? "Este cupón está bloqueado." :
            claim.state === "NO_ENCONTRADO" ? "Cupón inválido." :
            "No se pudo canjear el cupón.";
          elResult.innerHTML =
            `<div class='result-prize'>⚠️ ${msg}</div>` +
            `<div class='hint'>Intenta con otro código.</div>`;
          vibrate(60);
        }
      } catch (err) {
        elResult.innerHTML =
          `<div class='result-prize'>⚠️ Error de conexión al canjear.</div>` +
          `<div class='hint'>Verifica tu internet e inténtalo otra vez.</div>`;
        vibrate(60);
      } finally {
        spinning = false;
        currentCoupon = null;
        elSpin.disabled = true; // requiere validar otro cupón
      }
    }
  }

  elSpin?.addEventListener("click", spin);
})();