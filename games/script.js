/* ============================================================================
   Alfeicon Games — script.js (versión mejorada)
   - Render del catálogo desde Google Sheets CSV
   - Menú móvil (hamburguesa ↔ X) + overlay
   - Buscador lateral (🔍 ↔ X), filtros y chips con rótulo “Filtro aplicado”
   - Botón de compra: ícono carrito + link directo a WhatsApp
   ============================================================================ */

/* --------------------------------------------
   1) Configuración y utilidades generales
--------------------------------------------- */

// URL del CSV exportado desde Google Sheets
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQsDYcvcNTrISbWFc5O2Cyvtsn7Aaz_nEV32yWDLh_dIR_4t1Kz-cep6oaXnQQrCxfhRy1K-H6JTk4/pub?gid=1961555999&single=true&output=csv';

// Encabezados esperados en el CSV
const HEADERS = {
  titulo : 'NOMBRE DE JUEGOS',
  precio : 'Precio',
  espacio: 'Espacio necesario',
  imagen : 'imagen',
};

// Selectores rápidos
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

/* Convierte un precio textual a número CLP */
function normalizaPrecio(p){
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const n = String(p).replace(/[^\d]/g,'');
  return n ? Number(n) : 0;
}

/* Formatea un precio a “$12.345 CLP” */
function formateaPrecio(pTxt){
  const n = normalizaPrecio(pTxt);
  return n ? `$${n.toLocaleString('es-CL')} CLP` : (pTxt || '');
}

/* Parser CSV básico (respeta comillas y saltos de línea) */
function parseCSV(text){
  const out=[], row=[], push=()=>{ out.push(row.splice(0)); };
  let i=0, f='', q=false;
  while(i<text.length){
    const c=text[i];
    if(q){
      if(c==='"'){
        if(text[i+1]==='"'){ f+='"'; i++; } else { q=false; }
      }else f+=c;
    }else{
      if(c==='"'){ q=true; }
      else if(c===','){ row.push(f); f=''; }
      else if(c==='\n'||c==='\r'){
        if(c==='\r'&&text[i+1]==='\n') i++;
        row.push(f); f=''; push();
      }else f+=c;
    }
    i++;
  }
  if(f.length||row.length){ row.push(f); push(); }
  return out;
}

/* Detecta si estamos en móvil (breakpoint 768px) */
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

/* --------------------------------------------
   2) Render del catálogo desde el CSV
--------------------------------------------- */
async function renderLista(){
  const container = $('#games-list');
  if(!container) return;

  // 1. Descarga CSV
  let csv=''; 
  try{
    const res = await fetch(CSV_URL, {cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    csv = await res.text();
  }catch(e){
    console.error('CSV error:', e);
    return;
  }

  // 2. Parse CSV
  const rows = parseCSV(csv);
  if(!rows.length) return;

  const header = rows[0].map(h=>(h||'').trim());
  const data   = rows.slice(1);

  // Mapear índices de columnas
  const idx = {
    titulo : header.findIndex(h=>h.toLowerCase()===HEADERS.titulo.toLowerCase()),
    precio : header.findIndex(h=>h.toLowerCase()===HEADERS.precio.toLowerCase()),
    espacio: header.findIndex(h=>h.toLowerCase()===HEADERS.espacio.toLowerCase()),
    imagen : header.findIndex(h=>h.toLowerCase()===HEADERS.imagen.toLowerCase()),
  };

  const frag = document.createDocumentFragment();

  // 3. Recorrer filas del CSV y crear tarjetas
  for(const cols of data){
    const titulo  = (cols[idx.titulo]  || '').trim();
    if(!titulo) continue; // ignorar fila vacía

    const precioT = (cols[idx.precio]  || '').trim();
    const espacio = (cols[idx.espacio] || '').trim();
    const imagen  = (cols[idx.imagen]  || '').trim();

    const precioNum     = normalizaPrecio(precioT);
    const precioVisible = precioNum ? `$${precioNum.toLocaleString('es-CL')} CLP`
                                    : formateaPrecio(precioT);

    // --- Crear la tarjeta del juego ---
    const card  = document.createElement('article');
    card.className     = 'game-card';
    card.dataset.title = titulo;             // usado para filtros
    card.dataset.price = String(precioNum);  // usado para filtros
    card.dataset._disp = '';                 // display original

    // Cover (imagen o texto fallback)
    const cover = document.createElement('div');
    cover.className = 'game-cover';
    if(imagen && !/^#REF!?$/i.test(imagen)){
      const img = document.createElement('img');
      img.src = imagen;
      img.alt = `Portada de ${titulo}`;
      img.onerror = () => { cover.textContent = 'Sin imagen'; };
      cover.appendChild(img);
    }else{
      cover.textContent = 'Sin imagen';
    }

    // Body (título + meta)
    const body = document.createElement('div');  
    body.className = 'game-body';
    const h4   = document.createElement('h4');   
    h4.className   = 'game-title'; 
    h4.textContent = titulo;

    const meta = document.createElement('div');  
    meta.className = 'game-meta';
    meta.textContent = espacio ? `Espacio necesario: ${espacio}` : '';

    body.append(h4, meta);

    // CTA (precio + botón WhatsApp)
    const cta   = document.createElement('div'); 
    cta.className = 'game-cta';

    const price = document.createElement('div'); 
    price.className = 'game-price';
    price.textContent = precioVisible;

    const btn = document.createElement('a');
    btn.className = 'game-buy';
    btn.innerHTML = `
      <img src="cart.fill.svg" class="icon" alt="" aria-hidden="true">
      <span>Comprar ahora</span>
    `;
    btn.href   = makeWaLink(titulo, precioVisible);
    btn.target = '_blank';
    btn.rel    = 'noopener';

    cta.append(price, btn);

    // Montar la card
    card.append(cover, body, cta);
    frag.appendChild(card);
  }

  // 4. Inyectar todas las cards
  container.innerHTML = '';
  container.appendChild(frag);

  // 5. Aplicar filtros si ya había valores escritos
  if (window.applyGameFilters) window.applyGameFilters();
}

document.addEventListener('DOMContentLoaded', renderLista);

/* --------------------------------------------
   3) Menú móvil (hamburguesa ↔ X)
--------------------------------------------- */
(() => {
  const start = () => {
    const btn   = document.querySelector('.nav-toggle');
    const panel = document.getElementById('nav-panel');
    if (!btn || !panel) return;

    // Asegurar jerarquía y contenedor
    if (panel.parentElement !== document.body) document.body.appendChild(panel);
    let fly = panel.querySelector('.nav-fly');
    if (!fly) {
      fly = document.createElement('div');
      fly.className = 'nav-fly';
      [...panel.childNodes].forEach(n => fly.appendChild(n));
      panel.appendChild(fly);
    }

    const lock   = () => { document.documentElement.classList.add('scroll-lock'); document.body.classList.add('scroll-lock'); };
    const unlock = () => { document.documentElement.classList.remove('scroll-lock'); document.body.classList.remove('scroll-lock'); };

    // Abrir menú
    const open = () => {
      // Cerrar buscador si estaba abierto
      const searchPanel = document.getElementById('searchPanel');
      const searchBtn   = document.getElementById('openSearch');
      const overlay     = document.getElementById('overlay');
      if (searchPanel?.classList.contains('open')) {
        searchPanel.classList.remove('open');
        overlay?.classList.remove('show');
        searchBtn?.classList.remove('is-open');
      }

      panel.hidden = false;
      panel.classList.add('show');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      lock();
    };

    // Cerrar menú
    const close = () => {
      panel.classList.add('closing');
      panel.classList.remove('show');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');

      const onDone = (ev) => {
        if (ev.target !== fly || ev.propertyName !== 'transform') return;
        fly.removeEventListener('transitionend', onDone);
        panel.classList.remove('closing');
        panel.hidden = true;
        unlock();
      };
      fly.addEventListener('transitionend', onDone);
      setTimeout(()=>{ if(panel.classList.contains('closing')){ panel.classList.remove('closing'); panel.hidden=true; unlock(); } }, 420);
    };

    btn.addEventListener('click', () => { panel.classList.contains('show') ? close() : open(); });
    panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('show')) close(); });
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    panel.hidden = true;
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', start, { once: true })
    : start();
})();

/* --------------------------------------------
   4) Buscador lateral (filtros + chips)
--------------------------------------------- */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Elementos clave
  const openBtn = $('#openSearch');
  const closeBtn = $('#closeSearch');
  const panel   = $('#searchPanel');
  const overlay = $('#overlay');
  const qName = $('#qName');
  const qMin  = $('#qMin');
  const qMax  = $('#qMax');
  const btnSearch = $('#doSearch');
  const btnClear  = $('#clearSearch');
  const chipsBar  = document.getElementById('activeFilters');
  const fmtCLP    = n => (typeof n==='number' && !isNaN(n)) ? n.toLocaleString('es-CL') : '';

  /* Render chips de filtros activos */
  function renderChips(state){
    if(!chipsBar) return;
    chipsBar.innerHTML = '';

    const hasName = state.useName && state.rawName;
    const hasMin  = !isNaN(state.min);
    const hasMax  = !isNaN(state.max);
    const hasAny  = hasName || hasMin || hasMax;

    if (!hasAny) return;

    // Rótulo
    const label = document.createElement('span');
    label.className = 'chips-label';
    label.textContent = 'Filtro aplicado';
    chipsBar.appendChild(label);

    // Chip por nombre
    if (hasName){
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `(${state.rawName}) <button class="x">×</button>`;
      chip.querySelector('.x').addEventListener('click', ()=>{
        qName.value = '';
        applyFilters(true);
      });
      chipsBar.appendChild(chip);
    }

    // Chip por precio
    if (hasMin || hasMax){
      const minTxt = hasMin ? `$${fmtCLP(state.min)}` : '$0';
      const maxTxt = hasMax ? `$${fmtCLP(state.max)}` : '∞';
      const chip = document.createElement('span');
      chip.className = 'chip price';
      chip.innerHTML = `(${minTxt}–${maxTxt}) <button class="x">×</button>`;
      chip.querySelector('.x').addEventListener('click', ()=>{
        qMin.value = ''; qMax.value = '';
        applyFilters(true);
      });
      chipsBar.appendChild(chip);
    }
  }

  /* Abrir/cerrar panel */
  const lock   = ()=>{ document.documentElement.classList.add('scroll-lock'); document.body.classList.add('scroll-lock'); };
  const unlock = ()=>{ document.documentElement.classList.remove('scroll-lock'); document.body.classList.remove('scroll-lock'); };

  function openPanel(){ panel.classList.add('open'); if(!isMobile()) overlay.classList.add('show'); openBtn.classList.add('is-open'); lock(); qName.focus(); }
  function closePanel(){ panel.classList.remove('open'); overlay.classList.remove('show'); openBtn.classList.remove('is-open'); unlock(); }

  openBtn?.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
  closeBtn?.addEventListener('click', closePanel);
  overlay?.addEventListener('click', () => { if(!(qName.value||qMin.value||qMax.value)) closePanel(); });

  /* Aplicar filtros */
  const norm = s => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const parseCLP = v => Number(String(v).replace(/[^\d]/g,'')) || NaN;

  function applyFilters(keepPanel){
    const rawName = qName.value || '';
    const name = norm(rawName);
    const min  = parseCLP(qMin.value);
    const max  = parseCLP(qMax.value);

    const cards = $$('.game-card');
    const hint  = $('#searchHint');
    let nameMatches = name ? cards.filter(c => norm(c.dataset.title).includes(name)) : [];
    const useName = !!name && nameMatches.length >= 1;

    // Hint
    if (hint) hint.textContent = name ? (useName ? `Se encontraron ${nameMatches.length} resultados para “${rawName}”.` : `No se encontró “${rawName}”. Se filtra solo por precio.`) : '';

    let firstVisible = null;
    cards.forEach(card=>{
      const price = Number(card.dataset.price || '');
      const okMin = isNaN(min) || price >= min;
      const okMax = isNaN(max) || price <= max;
      const okName = !useName || nameMatches.includes(card);
      const show = okName && okMin && okMax;
      if(show){ card.style.display = card.dataset._disp||'block'; if(!firstVisible) firstVisible=card; }
      else card.style.display='none';
    });

    renderChips({ useName, rawName, min, max });
    if(!keepPanel) closePanel();
    return firstVisible;
  }

  // Eventos
  btnSearch?.addEventListener('click', ()=>{ const first=applyFilters(false); if(first) first.scrollIntoView({behavior:'smooth'}); });
  btnClear?.addEventListener('click', ()=>{ qName.value=''; qMin.value=''; qMax.value=''; applyFilters(true); });
  [qName,qMin,qMax].forEach(inp=>inp?.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(()=>applyFilters(true),200);})); 
  let t;

  window.applyGameFilters = applyFilters;
})();

/* --------------------------------------------
   5) WhatsApp de la tienda
--------------------------------------------- */
const WHATSAPP_NUMBER = '56926411278'; // <-- tu número con código país

function makeWaLink(titulo, precioVisible){
  const msg = `Hola, me interesa el juego ${titulo}.
Precio: ${precioVisible}
¿Lo tienes disponible?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}