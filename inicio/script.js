// ============================================================
// Alfeicon Games — script.js (HOME)
// - Navbar burger → X + focus trap + lock scroll
// - Año dinámico en el footer
// - Packs “preview” desde Google Sheets
// - Ruleta de descuentos (modal + confetti)
// - NUEVO: Sección “Novedades” rellena con JUEGOS EN OFERTA
//   (lee la misma hoja de “Juegos unitarios”, ordena por % desc)
//   y pinta cards compactas con precio actual + tachado.
// ============================================================

(() => {
  // --------------------------
  // Utils base (DOM + throttle)
  // --------------------------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms = 120) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

  // --------------------------
  // Año del footer
  // --------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  });

  // --------------------------
  // Ajustar --nav-h (altura navbar)
  // --------------------------
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

  // --------------------------
  // Menú móvil (morph burger → X)
  // --------------------------
  const toggleBtn = $('.nav-toggle');
  const navPanel  = $('#nav-panel');
  if (!toggleBtn || !navPanel) return; // Si no hay menú, salimos.

  // Mueve el panel a body (evita clipping por overflow oculto)
  if (navPanel.parentElement !== document.body) document.body.appendChild(navPanel);

  // Crea contenedor fly si no existe (para la animación)
  let fly = navPanel.querySelector('.nav-fly');
  if (!fly) {
    fly = document.createElement('div'); 
    fly.className = 'nav-fly';
    while (navPanel.firstChild) {
      if (navPanel.firstChild === fly) break;
      fly.appendChild(navPanel.firstChild);
    }
    navPanel.appendChild(fly);
  }

  // Origen de la animación (desde el botón)
  function setMenuOriginFromButton() {
    const r = toggleBtn.getBoundingClientRect();
    const cx = r.left + r.width/2; 
    const cy = r.top + r.height/2;
    navPanel.style.setProperty('--cx', `${cx}px`);
    navPanel.style.setProperty('--cy', `${cy}px`);
  }

  // Lock scroll mientras el menú está abierto (sin saltos)
  let savedScrollY = 0;
  function disableScroll(){
    savedScrollY = window.scrollY||document.documentElement.scrollTop||0; 
    document.documentElement.classList.add('scroll-lock'); 
    document.body.classList.add('scroll-lock');
    document.body.style.top=`-${savedScrollY}px`;
  }
  function enableScroll(){
    document.documentElement.classList.remove('scroll-lock'); 
    document.body.classList.remove('scroll-lock'); 
    const top=document.body.style.top; 
    document.body.style.top='';
    const y = top ? parseInt(top,10)*-1 : 0; 
    window.scrollTo(0, isNaN(y)?0:y);
  }

  const body = document.body;
  const firstLink = () => $('#nav-panel a');
  const links     = () => $$('#nav-panel a');
  let lastFocused = null;

  // Enfoque cíclico (accesibilidad)
  function trapFocus(e){
    if (!navPanel.classList.contains('show') || e.key !== 'Tab') return;
    const focusables = [toggleBtn, ...links()]; 
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openMenu(){
    setMenuOriginFromButton();
    navPanel.classList.remove('closing'); 
    navPanel.classList.add('show');
    toggleBtn.classList.add('open'); 
    body.classList.add('menu-open'); 
    disableScroll();

    toggleBtn.setAttribute('aria-label','Cerrar menú'); 
    toggleBtn.setAttribute('aria-expanded','true'); 
    navPanel.setAttribute('aria-hidden','false');
    lastFocused = document.activeElement; 
    (firstLink() || toggleBtn).focus();
  }
  function closeMenu(){
    navPanel.classList.add('closing'); 
    navPanel.classList.remove('show');
    toggleBtn.classList.remove('open'); 
    body.classList.remove('menu-open');

    toggleBtn.setAttribute('aria-label','Abrir menú'); 
    toggleBtn.setAttribute('aria-expanded','false'); 
    navPanel.setAttribute('aria-hidden','true');

    const onDone = (ev)=>{
      if (ev.target !== fly || ev.propertyName !== 'transform') return; 
      fly.removeEventListener('transitionend', onDone); 
      navPanel.classList.remove('closing'); 
      enableScroll(); 
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
    fly.addEventListener('transitionend', onDone);
    // Fallback por si no dispara transitionend (móviles antiguos)
    setTimeout(()=>{
      if (navPanel.classList.contains('closing')) { 
        navPanel.classList.remove('closing'); 
        enableScroll(); 
      } 
    }, 420);
  }
  function toggleMenu(force){ 
    const willOpen = force!==undefined ? force : !navPanel.classList.contains('show'); 
    willOpen ? openMenu() : closeMenu(); 
  }

  toggleBtn.addEventListener('click', ()=>toggleMenu());
  const recalcOrigin = debounce(()=>{
    if (navPanel.classList.contains('show')) setMenuOriginFromButton();
  }, 80);
  window.addEventListener('resize', recalcOrigin);
  window.addEventListener('orientationchange', recalcOrigin);
  document.addEventListener('keydown', (e)=>{ 
    if (e.key==='Escape' && navPanel.classList.contains('show')) closeMenu(); 
  });
  document.addEventListener('keydown', trapFocus);
  links().forEach(a => a.addEventListener('click', ()=>toggleMenu(false)));
  document.addEventListener('click', (e)=>{
    const inside = navPanel.contains(e.target) || toggleBtn.contains(e.target); 
    if (!inside && navPanel.classList.contains('show')) closeMenu();
  }, {capture:true});

  // --------------------------
  // Atajos rápidos del teclado
  // --------------------------
  document.addEventListener('keydown', (e)=>{
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k==='p') location.href='/pack/pack.html';
    if (k==='j') location.href='/games/game.html';
    if (k==='i') location.href='/instrucciones/instrucc.html';
  });
})();

/* ****************************************************************
 * PREVIEW: Packs en Home (lee 4 últimos desde Google Sheets CSV)
 **************************************************************** */
const PACKS_CSV_URL = "https://docs.google.com/spreadsheets/d/1vMSEjE9dQYossGGN_4KP_-DL8sKkb_09R0e2mo9WLHQ/gviz/tq?tqx=out:csv&gid=858783180";

function fmtCLP(n){ 
  const v=Number(n||0); 
  try{ return v.toLocaleString('es-CL',{style:'currency',currency:'CLP'});}catch{ return '$'+String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.');}
}
function splitGames(raw){ 
  if(!raw) return []; 
  return String(raw).replace(/\r?\n/g,',').split(/[,;•·\-\u2013\u2014\|]+/g).map(s=>s.trim()).filter(Boolean); 
}
function orderPacks(arr){ 
  return [...arr].sort((a,b)=>{ 
    const da=a.Fecha?new Date(a.Fecha).getTime():0; 
    const db=b.Fecha?new Date(b.Fecha).getTime():0; 
    if (db!==da) return db-da; 
    const ia=parseInt(a["Pack ID"],10)||0; 
    const ib=parseInt(b["Pack ID"],10)||0; 
    return ib-ia; 
  }); 
}
function renderLatestPacksFromSheet(rows){
  const wrap=document.getElementById('packs-scroller'); 
  if(!wrap) return; 
  wrap.innerHTML='';
  orderPacks(rows).slice(0,4).forEach(pk=>{
    const id=pk["Pack ID"]; 
    const titulo=`Pack ${id}`; 
    const juegos=splitGames(pk["Juegos Incluidos"]);
    const top5=juegos.slice(0,5); 
    const extra=Math.max(0, juegos.length-5); 
    const precio=Number(pk["Precio CLP"])||0;
    const consola=pk.Consola||''; 
    const fallback=(consola.includes('Nintendo Switch 2') && !consola.includes('Nintendo Switch, Nintendo Switch 2'))?'imagen_pack2.png':'imagen_pack.png';
    const cover=(pk["Imagen URL"] && pk["Imagen URL"].trim()!=='')?pk["Imagen URL"]:fallback;
    const url=`/pack/pack.html#pack-${id}`;
    const a=document.createElement('a'); 
    a.className='fp-card'; 
    a.href=url;
    a.innerHTML=`
      <img src="${cover}" alt="${titulo}">
      <div class="fp-info">
        <h4>${titulo}</h4>
        <p>Nintendo Switch • Entrega inmediata</p>
        <div class="fp-price">${fmtCLP(precio)}</div>
        <div class="fp-games">${top5.map(n=>`<span class="game-chip" title="${n}">${n}</span>`).join('')}</div>
        ${extra>0?`<span class="fp-more">ver más (+${extra})</span>`:''}
      </div>`;
    wrap.appendChild(a);
  });
}
function loadPacksPreview(){
  if (!window.Papa) { console.warn('PapaParse no está cargado'); return; }
  Papa.parse(PACKS_CSV_URL + `&cb=${Date.now()}`, { // cache-bust
    download:true, header:true,
    complete:({data})=>{ const rows=(data||[]).filter(r=>r["Pack ID"]); renderLatestPacksFromSheet(rows); },
    error:(err)=>console.error('Error CSV Packs Home:', err)
  });
}
document.addEventListener('DOMContentLoaded', loadPacksPreview);

/* ****************************************************************
 * NOVEDADES: pintar JUEGOS EN OFERTA en la grilla de “news”
 * - Lee la misma hoja que usas en /games/game.html
 * - Filtra En Oferta = SI y con Precio Oferta válido
 * - Ordena por % de descuento (desc) y luego por precio visible (asc)
 * - Muestra top 6 (configurable)
 **************************************************************** */
const GAMES_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQsDYcvcNTrISbWFc5O2Cyvtsn7Aaz_nEV32yWDLh_dIR_4t1Kz-cep6oaXnQQrCxfhRy1K-H6JTk4/pub?gid=1961555999&single=true&output=csv';

const GHEAD = {
  titulo       : 'NOMBRE DE JUEGOS',
  precio       : 'Precio',
  oferta       : 'En Oferta',
  precioOferta : 'Precio Oferta',
  espacio      : 'Espacio necesario',
  imagen       : 'imagen',
};

// Robustecer matching de cabeceras (sin acentos/caso)
const norm = s => String(s ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'');
const findColIdx = (headersRow, expected) =>
  headersRow.findIndex(h => norm(h) === norm(expected));

const toBoolOferta = v => ['si','sí','1','true','en oferta','oferta','on'].includes(norm(v));
const parseCLP = v => Number(String(v||'').replace(/[^\d]/g,'')) || 0;
const CLP = n => `$${Number(n||0).toLocaleString('es-CL')} CLP`;

// Construye una card compacta para la sección “news”
function buildOfferNewsCard({titulo, imagen, precioBase, precioOferta, espacio}) {
  const descuento = (precioBase > 0 && precioOferta > 0 && precioOferta < precioBase)
    ? Math.round((1 - precioOferta / precioBase) * 100)
    : 0;

  const el = document.createElement('article');
  el.className = 'news-card is-offer';
  el.innerHTML = `
    <div class="news-top">
      <span class="chip chip-offer">${descuento > 0 ? `-${descuento}%` : 'OFERTA 🔥'}</span>
    </div>
    <figure class="news-cover">
      ${imagen ? `<img src="${imagen}" alt="Portada de ${titulo}">` : `<div class="ph-cover">Sin imagen</div>`}
    </figure>
    <div class="news-body">
      <h4 class="news-title">${titulo}</h4>
      <p class="news-meta">${espacio ? `💾 ${espacio}` : ''}</p>

      <!-- 💰 Bloque de precio modernizado -->
      <div class="price">
        <span class="now">${CLP(precioOferta || precioBase)}</span>
        ${descuento > 0 ? `<span class="old">${CLP(precioBase)}</span>` : ''}
      </div>

      <a class="btn btn-primary" target="_blank" rel="noopener"
         href="${makeWaLink(titulo, CLP(precioOferta || precioBase))}">
        🛒 Comprar ahora
      </a>
    </div>
  `;
  return el;
}

function renderOffersInNews(rows){
  const grid  = document.getElementById('offers-grid');
  const empty = document.getElementById('offers-empty');
  if (!grid) return;

  // Limpiar estado previo
  grid.innerHTML = '';

  if (!rows.length){
    if (empty) empty.textContent = 'Por ahora no hay ofertas activas. 👀';
    return;
  }
  if (empty) empty.remove();

  // Orden: mayor % desc → precio visible asc
  rows.sort((a,b)=>{
    const da = a.__desc || 0, db = b.__desc || 0;
    if (db !== da) return db - da;
    return (a.__visible||0) - (b.__visible||0);
  });

  // Render top N
  const TOP = 6;
  rows.slice(0, TOP).forEach(r => grid.appendChild(buildOfferNewsCard(r)));
}

function loadNewsOffers(){
  // Si está Papa, úsalo; si no, usa fetch + parser simple
  if (window.Papa) {
    Papa.parse(GAMES_CSV_URL + `&cb=${Date.now()}`, {
      download:true, complete: ({data})=>{
        if (!data || !data.length) return;
        const header = data[0].map(v => v?.toString?.().trim() ?? '');
        const idx = {
          titulo       : findColIdx(header, GHEAD.titulo),
          precio       : findColIdx(header, GHEAD.precio),
          oferta       : findColIdx(header, GHEAD.oferta),
          precioOferta : findColIdx(header, GHEAD.precioOferta),
          espacio      : findColIdx(header, GHEAD.espacio),
          imagen       : findColIdx(header, GHEAD.imagen),
        };
        const out = [];
        for (let i=1;i<data.length;i++){
          const row = data[i];
          const titulo  = (row[idx.titulo]  || '').trim();
          if (!titulo) continue;

          const esOferta = toBoolOferta(row[idx.oferta]);
          const pBase    = parseCLP(row[idx.precio]);
          const pOfer    = parseCLP(row[idx.precioOferta]);
          const ofertaOk = esOferta && pOfer>0;

          if (!ofertaOk) continue; // Sólo ofertas válidas

          const desc = (pBase>0 && pOfer<pBase) ? Math.round((1 - pOfer/pBase)*100) : 0;
          out.push({
            titulo,
            imagen  : (row[idx.imagen]  || '').trim(),
            espacio : (row[idx.espacio] || '').trim(),
            precioBase : pBase,
            precioOferta : pOfer,
            __desc   : desc,
            __visible: pOfer || pBase
          });
        }
        renderOffersInNews(out);
      },
      error: (err)=>{ 
        console.error('Error CSV Juegos (news):', err); 
        const empty = document.getElementById('offers-empty'); 
        if (empty) empty.textContent = 'No fue posible cargar las ofertas.'; 
      }
    });
  } else {
    // Fallback muy simple con fetch (por si Papa no cargó)
    fetch(GAMES_CSV_URL + `&cb=${Date.now()}`)
      .then(r=>r.text())
      .then(txt=>{
        const lines = txt.split(/\r?\n/).filter(Boolean);
        const header = lines.shift().split(',');
        const idx = {
          titulo       : findColIdx(header, GHEAD.titulo),
          precio       : findColIdx(header, GHEAD.precio),
          oferta       : findColIdx(header, GHEAD.oferta),
          precioOferta : findColIdx(header, GHEAD.precioOferta),
          espacio      : findColIdx(header, GHEAD.espacio),
          imagen       : findColIdx(header, GHEAD.imagen),
        };
        const out=[];
        lines.forEach(line=>{
          const cols = line.split(','); // (no maneja comillas/escapes complejos)
          const titulo  = (cols[idx.titulo]||'').trim();
          if (!titulo) return;
          const esOferta = toBoolOferta(cols[idx.oferta]);
          const pBase    = parseCLP(cols[idx.precio]);
          const pOfer    = parseCLP(cols[idx.precioOferta]);
          const ofertaOk = esOferta && pOfer>0;
          if (!ofertaOk) return;
          const desc = (pBase>0 && pOfer<pBase) ? Math.round((1 - pOfer/pBase)*100) : 0;
          out.push({
            titulo,
            imagen  : (cols[idx.imagen]  || '').trim(),
            espacio : (cols[idx.espacio] || '').trim(),
            precioBase : pBase,
            precioOferta : pOfer,
            __desc   : desc,
            __visible: pOfer || pBase
          });
        });
        renderOffersInNews(out);
      })
      .catch(err=>{
        console.error('Error CSV Juegos (news-fallback):', err);
        const empty = document.getElementById('offers-empty'); 
        if (empty) empty.textContent = 'No fue posible cargar las ofertas.'; 
      });
  }
}
document.addEventListener('DOMContentLoaded', loadNewsOffers);

/* =========================================================
 * WhatsApp helper (reusado por ofertas)
 * ========================================================= */
const WHATSAPP_NUMBER = '56926411278';
function makeWaLink(titulo, precioVisible){
  const msg = `Hola, me interesa el juego ${titulo}.
Precio: ${precioVisible}
¿Lo tienes disponible?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* =================================================================
 * RULETA DE DESCUENTOS (modal) — sin cambios funcionales relevantes
 * (se deja el bloque completo que ya tenías, con comentarios breves)
 * ================================================================= */
(() => {
  // ---------- Backend (TU Apps Script) ----------
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwkTRd_As56mgq6eEkNOyrRY80D4A-dcR7Alrf34Xz_wTHEGS4NNZMexZLpYenmPlo_/exec";

  // ---------- Segmentos visuales (12 iguales) ----------
  const SEGMENTS = [
    "10%\nOFF","25%\nOFF","50%\nOFF","Sin premio 😅",
    "10%\nOFF","25%\nOFF","Sin premio 😅","50%\nOFF",
    "10%\nOFF","Sin premio 😅","25%\nOFF","100%\nOFF"
  ];

  // ---------- Pesos reales (probabilidades invisibles) ----------
  const WEIGHTS = {
    "Sin premio 😅": 0.70,
    "10%\nOFF":      0.20,
    "25%\nOFF":      0.08,
    "50%\nOFF":      0.02,
    "100%\nOFF":     0.001
  };

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
  const USED_KEY = "alfeicon_ruleta_used_local";
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
    return r.json();
  }
  async function apiClaim(code, prize){
    const url = `${GAS_URL}?action=claim&code=${encodeURIComponent(code)}&prize=${encodeURIComponent(prize)}&_=${Date.now()}`;
    const r = await fetch(url, { method:"GET" });
    if (!r.ok) throw new Error("Network error");
    return r.json();
  }

  // ---------- Modal open/close ----------
  function lockScroll(){ document.documentElement.classList.add("scroll-lock"); document.body.classList.add("scroll-lock"); }
  function unlockScroll(){ document.documentElement.classList.remove("scroll-lock"); document.body.classList.remove("scroll-lock"); }
  function openModal(e){ if(e) e.preventDefault(); elBackdrop.classList.add("backdrop--show"); elModal.setAttribute("aria-hidden","false"); lockScroll(); setTimeout(()=>elCoupon?.focus(),60); }
  function closeModal(){ elBackdrop.classList.remove("backdrop--show"); elModal.setAttribute("aria-hidden","true"); unlockScroll(); }
  elOpen?.addEventListener("click", openModal);
  elClose?.addEventListener("click", closeModal);
  elBackdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", e=>{ if(e.key==="Escape" && elModal.getAttribute("aria-hidden")==="false") closeModal(); });

  // ---------- Validación cupón ----------
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

  // Colores de segmentos
  const SEG_COLORS = [
    "#FFE9A8","#BFE6FF","#FFD1F1","#C7F4D1",
    "#FDD6A3","#D5C7FF","#C8F0FF","#FFE6C1",
    "#F8C9D4","#D9FFCF","#FFE3FF","#CDE6FF"
  ];
  const textColor = "#202020";
  const getUniformPortions = n => Array(n).fill(1/n);
  let visualPortions = getUniformPortions(SEGMENTS.length);
  window.addEventListener("resize", () => { visualPortions = getUniformPortions(SEGMENTS.length); drawWheel(); });

  function drawWheel(){
    ctx.clearRect(0,0,size,size);
    ctx.beginPath(); ctx.arc(center,center, radius, 0, Math.PI*2); ctx.fillStyle = "#ffffff"; ctx.fill();

    let startAng = angleStart;
    for (let i=0;i<SEGMENTS.length;i++){
      const portion = visualPortions[i];
      const angle = portion * Math.PI * 2;
      const s = startAng;
      const e = startAng + angle;

      // Relleno
      ctx.beginPath();
      ctx.moveTo(center,center);
      ctx.arc(center,center, radius, s, e);
      ctx.closePath();
      ctx.fillStyle = SEG_COLORS[i % SEG_COLORS.length];
      ctx.fill();

      // Separador
      ctx.strokeStyle = "rgba(0,0,0,.12)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto
      const mid = s + angle/2;
      ctx.save();
      ctx.translate(center,center);
      ctx.rotate(mid);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textColor;
      const fontSize = 18;
      ctx.font = `900 ${fontSize}px Inter, system-ui`;
      const lines = String(SEGMENTS[i]).split("\n");
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

  // ---- Probabilidad determinística por cupón ----
  function hash32(str){ let h = 2166136261 >>> 0; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function normalizedWeights(){
    const entries = Object.entries(WEIGHTS);
    const sum = entries.reduce((a,[,w])=>a+(+w||0),0) || 1;
    return entries.map(([k,w]) => [k, (+w||0)/sum]);
  }
  function pickLabelByWeight(code){
    const r = (hash32(code) % 100000) / 100000;
    const list = normalizedWeights();
    let acc = 0;
    for (const [label, p] of list){
      acc += p;
      if (r < acc) return label;
    }
    return list[list.length-1][0];
  }
  function pickIndexForLabel(code, label){
    const candidates = SEGMENTS
      .map((lab, i) => lab === label ? i : -1)
      .filter(i => i >= 0);
    if (!candidates.length) return hash32(code + "|fallback") % SEGMENTS.length;
    const h = hash32(code + "|idx");
    return candidates[h % candidates.length];
  }
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

  // ---- Confetti / Serpentina (celebración) ----
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
    const g = Math.floor(100 + Math.random()*80);
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
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
        ctxC.save(); ctxC.translate(p.x, p.y); ctxC.rotate(p.rot);
        ctxC.fillStyle = p.color; ctxC.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        ctxC.restore();
      }
      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        if (p.life<=0 || p.y > innerHeight+50) particles.splice(i,1);
      }
      if (elapsed < durationMs && particles.length) requestAnimationFrame(frame);
      else ctxC.clearRect(0,0,layer.width,layer.height);
    }
    requestAnimationFrame(frame);
  }
  function launchSerpentinaBurst(x, y, count=160, gravity=0.12){
    const particles = [];
    for (let i=0;i<count;i++){
      const a  = (-Math.PI/2) + (Math.random()-0.5)*Math.PI*1.6;
      const sp = 3 + Math.random()*4;
      particles.push({
        x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
        life: 40 + Math.random()*30, size: 4 + Math.random()*3,
        rot: Math.random()*Math.PI*2, vr: (Math.random()-0.5)*0.3,
        color: randomColor(), g: gravity
      });
    }
    animateConfetti(particles, 2000);
  }
  function launchSadConfettiBurst(x, y, count=70, gravity=0.18){
    const particles = [];
    const angleBase = -Math.PI/2;
    for (let i=0;i<count;i++){
      const a  = angleBase + (Math.random()-0.5)*Math.PI*0.8;
      const sp = 2 + Math.random()*3;
      particles.push({
        x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
        life: 40 + Math.random()*20, size: 3 + Math.random()*2,
        rot: Math.random()*Math.PI*2, vr: (Math.random()-0.5)*0.2,
        color: randomGray(), g: gravity
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
    const x = innerWidth/2; const y = 90;
    if (/sin\s*premio/i.test(prizeText)){ launchSadConfettiBurst(x, y, 70, 0.18); return; }
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

    const label  = pickLabelByWeight(currentCoupon);  // premio real (según pesos)
    const idx    = pickIndexForLabel(currentCoupon, label); // índice visual equivalente
    const target = angleForIndex(idx);
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
      const prizeText = String(label).replace(/\n/g," ");

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