/* ============================================================================
   Alfeicon Games — script.js (OFERTAS ++, "Solo ofertas" persistente)
   ============================================================================ */

/* --------------------------------------------
   1) Configuración y utilidades
--------------------------------------------- */
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQsDYcvcNTrISbWFc5O2Cyvtsn7Aaz_nEV32yWDLh_dIR_4t1Kz-cep6oaXnQQrCxfhRy1K-H6JTk4/pub?gid=1961555999&single=true&output=csv';

const HEADERS = {
  titulo        : 'NOMBRE DE JUEGOS',
  precio        : 'Precio',
  oferta        : 'En Oferta',
  precioOferta  : 'Precio Oferta',
  espacio       : 'Espacio necesario',
  imagen        : 'imagen',
};

const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

/* Estado global */
let offersOnly = JSON.parse(localStorage.getItem('ag_offersOnly') || 'false');

/* Helpers */
const norm = s => String(s ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'');

function findColIdx(headersRow, expected){
  const target = norm(expected);
  return headersRow.findIndex(h => norm(h) === target);
}

function normalizaPrecio(p){
  if (typeof p === 'number') return p;
  if (p == null) return 0;
  const n = String(p).replace(/[^\d]/g,'');
  return n ? Number(n) : 0;
}

function formateaPrecioCLP(v){
  const n = typeof v === 'number' ? v : normalizaPrecio(v);
  return n ? `$${n.toLocaleString('es-CL')} CLP` : '';
}

/* CSV parser sencillo */
function parseCSV(text){
  const out=[], row=[], push=()=>out.push(row.splice(0));
  let i=0, f='', q=false;
  while(i<text.length){
    const c=text[i];
    if(q){
      if(c==='"'){
        if(text[i+1]==='"'){ f+='"'; i++; } else { q=false; }
      } else f+=c;
    }else{
      if(c==='"'){ q=true; }
      else if(c===','){ row.push(f); f=''; }
      else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(f); f=''; push(); }
      else f+=c;
    }
    i++;
  }
  if(f.length||row.length){ row.push(f); push(); }
  return out;
}

function toBoolOferta(v){
  const s = norm(v);
  return ['si','sí','1','true','en oferta','oferta','on'].includes(s);
}

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

/* --------------------------------------------
   2) Render del catálogo
--------------------------------------------- */
async function renderLista(){
  const container = $('#games-list');
  if(!container) return;

  // 1) Descargar CSV con anti-cache
  let csv=''; 
  try{
    const res = await fetch(`${CSV_URL}&t=${Date.now()}`, { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    csv = await res.text();
  }catch(e){
    console.error('CSV error:', e);
    container.innerHTML = '<p style="opacity:.7">No se pudo cargar el catálogo.</p>';
    return;
  }

  // 2) Parseo
  const rows = parseCSV(csv);
  if(!rows.length){ container.innerHTML=''; return; }

  const header = rows[0].map(h=>(h||'').trim());
  const data   = rows.slice(1);

  // 3) Índices tolerantes
  const idx = {
    titulo       : findColIdx(header, HEADERS.titulo),
    precio       : findColIdx(header, HEADERS.precio),
    oferta       : findColIdx(header, HEADERS.oferta),
    precioOferta : findColIdx(header, HEADERS.precioOferta),
    espacio      : findColIdx(header, HEADERS.espacio),
    imagen       : findColIdx(header, HEADERS.imagen),
  };
  // Aviso si falta alguna clave
  Object.entries(idx).forEach(([k,v])=>{
    if(v < 0) console.warn(`Columna faltante: ${k} (${HEADERS[k]})`);
  });

  const frag = document.createDocumentFragment();

  // 4) Tarjetas
  for (let r=0; r<data.length; r++){
    const cols = data[r];
    const titulo  = (cols[idx.titulo]  || '').trim();
    if(!titulo) continue;

    const precioT        = (idx.precio       >=0 ? cols[idx.precio]       : '')?.trim() || '';
    const ofertaFlagRaw  = (idx.oferta       >=0 ? cols[idx.oferta]       : '')?.trim() || '';
    const precioOfertaT  = (idx.precioOferta >=0 ? cols[idx.precioOferta] : '')?.trim() || '';
    const espacio        = (idx.espacio      >=0 ? cols[idx.espacio]      : '')?.trim() || '';
    const imagen         = (idx.imagen       >=0 ? cols[idx.imagen]       : '')?.trim() || '';

    const precioBase   = normalizaPrecio(precioT);
    const esOferta     = toBoolOferta(ofertaFlagRaw);
    const precioOferta = normalizaPrecio(precioOfertaT);

    // Oferta válida: marcada, con números y más barata que el precio base
    const ofertaValida = esOferta && precioOferta > 0 && precioBase > 0 && precioOferta < precioBase;

    const precioVisible = ofertaValida ? precioOferta : precioBase;
    const precioTxtVis  = formateaPrecioCLP(precioVisible);
    const precioTxtBase = formateaPrecioCLP(precioBase);

    // Descuento %
    let descuentoPct = 0;
    if (ofertaValida){
      descuentoPct = Math.round((1 - (precioOferta / precioBase)) * 100);
      if (!isFinite(descuentoPct) || descuentoPct < 1) descuentoPct = 0;
      if (descuentoPct > 95) descuentoPct = 95; // por estética
    }

    // ---- Card ----
    const card  = document.createElement('article');
    card.className     = 'game-card';
    card.dataset.title = titulo;
    card.dataset.price = String(precioVisible || 0);
    card.dataset.idx   = String(r);
    if (descuentoPct > 0) card.dataset.discount = String(descuentoPct);
    if (ofertaValida) card.classList.add('oferta');

    // Cover
    const cover = document.createElement('div');
    cover.className = 'game-cover';
    if(imagen && !/^#REF!?$/i.test(imagen)){
      const img = document.createElement('img');
      img.src = imagen;
      img.alt = `Portada de ${titulo}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => { cover.textContent = 'Sin imagen'; };
      cover.appendChild(img);
    }else{
      cover.textContent = 'Sin imagen';
    }

    // Body
    const body = document.createElement('div');  
    body.className = 'game-body';
    const h4   = document.createElement('h4');   
    h4.className   = 'game-title'; 
    h4.textContent = titulo;

    const meta = document.createElement('div');  
    meta.className = 'game-meta';
    meta.textContent = espacio ? `Espacio necesario: ${espacio}` : '';

    body.append(h4, meta);

    // CTA (precio + WhatsApp)
    const cta   = document.createElement('div'); 
    cta.className = 'game-cta';

    const price = document.createElement('div'); 
    price.className = 'game-price';

    if (ofertaValida){
      price.classList.add('is-offer');
      price.innerHTML = `
        <span class="now">${precioTxtVis}</span>
        <span class="old">${precioTxtBase}</span>
      `;
      const badge = document.createElement('span');
      badge.className = 'badge-oferta';
      badge.textContent = descuentoPct > 0 ? `¡-${descuentoPct}%!` : '¡En oferta!';
      body.appendChild(badge);
    } else {
      price.textContent = precioTxtVis || precioTxtBase || '—';
    }

    const btn = document.createElement('a');
    btn.className = 'game-buy';
    btn.innerHTML = `
      <img src="cart.fill.svg" class="icon" alt="" aria-hidden="true">
      <span>Comprar ahora</span>
    `;
    btn.href   = makeWaLink(titulo, precioTxtVis || precioTxtBase);
    btn.target = '_blank';
    btn.rel    = 'noopener';

    cta.append(price, btn);

    // Montaje
    card.append(cover, body, cta);
    frag.appendChild(card);
  }

  container.innerHTML = '';
  container.appendChild(frag);

  // Reaplicar filtros si existen
  if (window.applyGameFilters) window.applyGameFilters(true);

  // Sincronizar botón/orden “Solo ofertas”
  syncOffersToggleUI();
  applyOffersOnly();
}

/* --------------------------------------------
   3) "Solo ofertas": filtrar + ordenar
--------------------------------------------- */
function sortCardsBy(container, comparator){
  const cards = Array.from(container.children);
  cards.sort(comparator).forEach(c => container.appendChild(c));
}

function applyOffersOnly(){
  const container = $('#games-list');
  if(!container) return;

  // Mostrar/ocultar según toggle (el buscador también respeta este flag)
  $$('.game-card', container).forEach(card=>{
    // No ocultamos aquí; lo hace applyGameFilters para combinar con nombre/precio.
    // Solo nos encargamos del orden.
  });

  if (offersOnly){
    // Ordenar por mayor descuento, luego por precio visible asc
    sortCardsBy(container, (a,b)=>{
      const da = Number(a.dataset.discount||0), db = Number(b.dataset.discount||0);
      if (db !== da) return db - da;
      const pa = Number(a.dataset.price||0), pb = Number(b.dataset.price||0);
      return pa - pb;
    });
  } else {
    // Orden original por índice
    sortCardsBy(container, (a,b)=> Number(a.dataset.idx||0) - Number(b.dataset.idx||0));
  }

  // Reaplicar filtros para que el toggle afecte visibilidad final
  if (window.applyGameFilters) window.applyGameFilters(true);
}

function setOffersOnly(val){
  offersOnly = !!val;
  localStorage.setItem('ag_offersOnly', JSON.stringify(offersOnly));
  syncOffersToggleUI();
  applyOffersOnly();
}

function toggleOffersOnly(){
  setOffersOnly(!offersOnly);
}

function syncOffersToggleUI(){
  const btn = $('#btnOffersOnly');
  if (!btn) return;
  btn.classList.toggle('primary', offersOnly);
  btn.classList.toggle('ghost', !offersOnly);
  btn.setAttribute('aria-pressed', offersOnly ? 'true' : 'false');
}

/* --------------------------------------------
   4) Menú móvil
--------------------------------------------- */
(() => {
  const start = () => {
    const btn   = document.querySelector('.nav-toggle');
    const panel = document.getElementById('nav-panel');
    if (!btn || !panel) return;

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

    const open = () => {
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
   5) Buscador lateral (respeta "Solo ofertas")
--------------------------------------------- */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
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

  function addChip(text, onRemove){
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${text} <button class="x" aria-label="Quitar filtro">×</button>`;
    chip.querySelector('.x').addEventListener('click', onRemove);
    chipsBar.appendChild(chip);
  }

  function renderChips(state){
    if(!chipsBar) return;
    chipsBar.innerHTML = '';

    const hasName = state.useName && state.rawName;
    const hasMin  = !isNaN(state.min);
    const hasMax  = !isNaN(state.max);
    const hasAny  = hasName || hasMin || hasMax || offersOnly;

    if (!hasAny) return;

    const label = document.createElement('span');
    label.className = 'chips-label';
    label.textContent = 'Filtro aplicado';
    chipsBar.appendChild(label);

    if (offersOnly){
      addChip('Solo ofertas', ()=> setOffersOnly(false));
    }
    if (hasName){
      addChip(`(${state.rawName})`, ()=>{
        qName.value = '';
        applyFilters(true);
      });
    }
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

  const lock   = ()=>{ document.documentElement.classList.add('scroll-lock'); document.body.classList.add('scroll-lock'); };
  const unlock = ()=>{ document.documentElement.classList.remove('scroll-lock'); document.body.classList.remove('scroll-lock'); };
  function openPanel(){ panel.classList.add('open'); if(!isMobile()) overlay.classList.add('show'); openBtn.classList.add('is-open'); lock(); qName.focus(); }
  function closePanel(){ panel.classList.remove('open'); overlay.classList.remove('show'); openBtn.classList.remove('is-open'); unlock(); }
  openBtn?.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
  closeBtn?.addEventListener('click', closePanel);
  overlay?.addEventListener('click', () => { if(!(qName.value||qMin.value||qMax.value)) closePanel(); });

  const parseCLP = v => Number(String(v).replace(/[^\d]/g,'')) || NaN;

  function applyFilters(keepPanel){
    const rawName = qName.value || '';
    const name = norm(rawName);
    const min  = parseCLP(qMin.value);
    const max  = parseCLP(qMax.value);

    const cards = $$('.game-card');
    const hint  = $('#searchHint');

    const nameMatches = name ? cards.filter(c => norm(c.dataset.title).includes(name)) : [];
    const useName = !!name && nameMatches.length >= 1;

    if (hint) hint.textContent = name
      ? (useName ? `Se encontraron ${nameMatches.length} resultados para “${rawName}”.`
                 : `No se encontró “${rawName}”. Se filtra solo por precio.`)
      : '';

    let firstVisible = null;
    cards.forEach(card=>{
      const price = Number(card.dataset.price || '');
      const passOffer = !offersOnly || card.classList.contains('oferta');
      const okMin = isNaN(min) || price >= min;
      const okMax = isNaN(max) || price <= max;
      const okName = !useName || nameMatches.includes(card);
      const show = passOffer && okName && okMin && okMax;
      if(show){ card.style.display = card.dataset._disp||'block'; if(!firstVisible) firstVisible=card; }
      else card.style.display='none';
    });

    renderChips({ useName, rawName, min, max });
    if(!keepPanel) closePanel();
    return firstVisible;
  }

  btnSearch?.addEventListener('click', ()=>{ const first=applyFilters(false); if(first) first.scrollIntoView({behavior:'smooth'}); });
  btnClear?.addEventListener('click', ()=>{ qName.value=''; qMin.value=''; qMax.value=''; applyFilters(true); });
  let t; [qName,qMin,qMax].forEach(inp=>inp?.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(()=>applyFilters(true),200);})); 
  window.applyGameFilters = applyFilters;

  // Atajo: tecla "o" para alternar solo-ofertas (opcional)
  document.addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase() === 'o' && !/input|textarea|select/i.test(document.activeElement.tagName)){
      toggleOffersOnly();
    }
  });
})();

/* --------------------------------------------
   6) WhatsApp
--------------------------------------------- */
const WHATSAPP_NUMBER = '56926411278';
function makeWaLink(titulo, precioVisible){
  const msg = `Hola, me interesa el juego ${titulo}.
Precio: ${precioVisible}
¿Lo tienes disponible?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* --------------------------------------------
   7) UI: botón "Solo ofertas"
--------------------------------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = $('#btnOffersOnly');
  btn?.addEventListener('click', toggleOffersOnly);
  // Si ya estaba activo desde localStorage, reflejar estado del botón
  syncOffersToggleUI();
});

/* --------------------------------------------
   8) Iniciar render
--------------------------------------------- */
document.addEventListener('DOMContentLoaded', renderLista);