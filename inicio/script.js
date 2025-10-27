// ======================
// Alfeicon Games - script.js (morph burger → X)
// ======================

(() => {
  // ---------- Utils ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms = 120) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // ---------- Año del footer ----------
  document.addEventListener('DOMContentLoaded', () => {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  });

  // ---------- Ajustar --nav-h según altura real de la navbar ----------
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

  // Reubicar overlay al <body> (evita stacking raros)
  if (navPanel.parentElement !== document.body) {
    document.body.appendChild(navPanel);
  }

  // Flyout: crea un contenedor interno si no existe
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

  // Origen (si algún día vuelves a usar clip-path circular)
  function setMenuOriginFromButton() {
    const r = toggleBtn.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    navPanel.style.setProperty('--cx', `${cx}px`);
    navPanel.style.setProperty('--cy', `${cy}px`);
  }

  // ---------- Scroll lock robusto ----------
  let savedScrollY = 0;
  function disableScroll(){
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('scroll-lock');
    document.body.classList.add('scroll-lock');
    document.body.style.top = `-${savedScrollY}px`;
  }
  function enableScroll(){
    document.documentElement.classList.remove('scroll-lock');
    document.body.classList.remove('scroll-lock');
    const top = document.body.style.top;
    document.body.style.top = '';
    const y = top ? parseInt(top, 10) * -1 : 0;
    window.scrollTo(0, isNaN(y) ? 0 : y);
  }

  // ---------- Accesibilidad ----------
  const body = document.body;
  const firstLink = () => $('#nav-panel a');
  const links = () => $$('#nav-panel a');
  let lastFocused = null;

  function trapFocus(e) {
    if (!navPanel.classList.contains('show') || e.key !== 'Tab') return;
    const focusables = [toggleBtn, ...links()];
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  // ---------- Abrir/Cerrar ----------
  function openMenu() {
    setMenuOriginFromButton();
    navPanel.classList.remove('closing');
    navPanel.classList.add('show');
    toggleBtn.classList.add('open');
    body.classList.add('menu-open');
    disableScroll();

    toggleBtn.setAttribute('aria-label', 'Cerrar menú');
    toggleBtn.setAttribute('aria-expanded', 'true');
    navPanel.setAttribute('aria-hidden', 'false');

    lastFocused = document.activeElement;
    (firstLink() || toggleBtn).focus();
  }

  function closeMenu() {
    // Estado "closing" para permitir animación reverse
    navPanel.classList.add('closing');
    navPanel.classList.remove('show');

    toggleBtn.classList.remove('open');
    body.classList.remove('menu-open');
    toggleBtn.setAttribute('aria-label', 'Abrir menú');
    toggleBtn.setAttribute('aria-expanded', 'false');
    navPanel.setAttribute('aria-hidden', 'true');

    // Espera a que termine la transición del flyout
    const onDone = (ev) => {
      if (ev.target !== fly || ev.propertyName !== 'transform') return;
      fly.removeEventListener('transitionend', onDone);
      navPanel.classList.remove('closing');
      enableScroll();
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
    fly.addEventListener('transitionend', onDone);

    // Fallback por si el navegador no dispara transitionend
    setTimeout(() => {
      if (navPanel.classList.contains('closing')) {
        navPanel.classList.remove('closing');
        enableScroll();
      }
    }, 420);
  }

  function toggleMenu(force) {
    const open = force !== undefined ? force : !navPanel.classList.contains('show');
    open ? openMenu() : closeMenu();
  }

  // ---------- Eventos ----------
  toggleBtn.addEventListener('click', () => toggleMenu());

  const recalcOrigin = debounce(() => {
    if (navPanel.classList.contains('show')) setMenuOriginFromButton();
  }, 80);
  window.addEventListener('resize', recalcOrigin);
  window.addEventListener('orientationchange', recalcOrigin);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navPanel.classList.contains('show')) closeMenu();
  });
  document.addEventListener('keydown', trapFocus);

  links().forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  document.addEventListener('click', (e) => {
    const inside = navPanel.contains(e.target) || toggleBtn.contains(e.target);
    if (!inside && navPanel.classList.contains('show')) closeMenu();
  }, { capture: true });

  // ---------- “Destacado” (mock) ----------
  const destacado = {
    titulo: "Mario Kart™ World",
    precioCLP: 30000,
    sizeGB: 6.9,
    compat: "Nintendo Switch 2",
    imagen: "game.avif",
    whatsapp: "Hola! Quiero comprar *Mario Kart 8 Deluxe*. ¿Está disponible?"
  };

  (function renderDestacado(d) {
    const $id = (id) => document.getElementById(id);
    if (!$id("feat-title")) return;
    $id("feat-title").textContent = d.titulo;
    $id("feat-price").textContent = `$${Number(d.precioCLP).toLocaleString("es-CL")} CLP`;
    $id("feat-size").textContent = `💾 ${d.sizeGB} GB`;
    $id("feat-compat").textContent = `✅ ${d.compat}`;
    const img = $id("feat-img");
    img.src = d.imagen;
    img.onerror = () => { img.style.display = "none"; };
    const msg = encodeURIComponent(d.whatsapp);
    const btn = $id("feat-btn");
    btn.href = `https://wa.me/56926411278?text=${msg}`;
    btn.setAttribute('rel', 'noopener');
    btn.setAttribute('target', '_blank');
  })(destacado);

  // ---------- Atajos teclado ----------
  document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'p') location.href = '../packs.html';
    if (k === 'j') location.href = '../juegos.html';
    if (k === 'i') location.href = '../instrucciones.html';
  });
})();

/*************************
 * PREVIEW: Packs en Home
 *************************/

/* === Config === */
const PACKS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1vMSEjE9dQYossGGN_4KP_-DL8sKkb_09R0e2mo9WLHQ/gviz/tq?tqx=out:csv&gid=858783180";

/* === Utils compartidas con tu estilo === */
function fmtCLP(n){
  const v = Number(n || 0);
  try { return v.toLocaleString('es-CL', {style:'currency', currency:'CLP'}); }
  catch { return '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
}

// separa lista de juegos que venga con saltos de línea, comas, viñetas, etc.
function splitGames(raw){
  if(!raw) return [];
  return String(raw)
    .replace(/\r?\n/g, ',')
    .split(/[,;•·\-\u2013\u2014\|]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

// ordena por fecha desc (si existe) y si no por ID desc
function orderPacks(arr){
  return [...arr].sort((a,b)=>{
    const da = a.Fecha ? new Date(a.Fecha).getTime() : 0;
    const db = b.Fecha ? new Date(b.Fecha).getTime() : 0;
    if (db !== da) return db - da;
    const ia = parseInt(a["Pack ID"], 10) || 0;
    const ib = parseInt(b["Pack ID"], 10) || 0;
    return ib - ia;
  });
}

/* === Render a #packs-scroller (carrusel del Home) === */
function renderLatestPacksFromSheet(rows){
  const wrap = document.getElementById('packs-scroller');
  if(!wrap) return; // por si estás en otra página sin ese contenedor
  wrap.innerHTML = '';

  // solo 4 packs más recientes
  orderPacks(rows).slice(0,4).forEach(pk=>{
    const id      = pk["Pack ID"];
    const titulo  = `Pack ${id}`;
    const juegos  = splitGames(pk["Juegos Incluidos"]);
    const top5    = juegos.slice(0,5);
    const extra   = Math.max(0, juegos.length - 5);
    const precio  = Number(pk["Precio CLP"]) || 0;

    // portada: columna "Imagen URL" si existe; si no, fallback por consola
    const consola = pk.Consola || '';
    const fallback = (consola.includes('Nintendo Switch 2') && !consola.includes('Nintendo Switch, Nintendo Switch 2'))
      ? 'imagen_pack2.png' : 'imagen_pack.png';
    const cover = (pk["Imagen URL"] && pk["Imagen URL"].trim() !== '') ? pk["Imagen URL"] : fallback;

    const url = `../pack/pack.html#pack-${id}`;

    const a = document.createElement('a');
    a.className = 'fp-card';
    a.href = url;
    a.setAttribute('aria-label', `${titulo} — ${juegos.length} juegos`);

    a.innerHTML = `
      <img src="${cover}" alt="${titulo}">
      <div class="fp-info">
        <h4>${titulo}</h4>
        <p>Nintendo Switch • Entrega inmediata</p>
        <div class="fp-price">${fmtCLP(precio)}</div>

        <div class="fp-games">
          ${top5.map(name => `<span class="game-chip" title="${name}">${name}</span>`).join('')}
        </div>

        ${extra>0 ? `<a class="fp-more" href="${url}">ver más (+${extra})</a>` : ''}
      </div>
    `;
    wrap.appendChild(a);
  });
}

/* === Carga desde tu Google Sheets (PapaParse) === */
function loadPacksPreview(){
  if (!window.Papa) { console.warn('PapaParse no está cargado en Home'); return; }
  Papa.parse(PACKS_CSV_URL, {
    download: true,
    header: true,
    complete: ({data}) => {
      const rows = (data || []).filter(r => r["Pack ID"]); // limpia filas vacías
      renderLatestPacksFromSheet(rows);
    },
    error: (err) => console.error('Error CSV Packs Home:', err)
  });
}

// dispara cuando la página está lista
document.addEventListener('DOMContentLoaded', loadPacksPreview);