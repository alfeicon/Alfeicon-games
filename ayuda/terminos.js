// Fechas
document.getElementById('year').textContent = new Date().getFullYear();
const d=new Date(), pad=n=>String(n).padStart(2,'0');
const last = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const lastEl = document.getElementById('last-update'); if(lastEl) lastEl.textContent = last;

// Smooth scroll con offset de la topbar
const NAV_H = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
function smoothTo(id){
  const el = document.getElementById(id.replace('#',''));
  if(!el) return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - (NAV_H + 10);
  window.scrollTo({top:y, behavior:'smooth'});
}

// TOC desktop: resaltar activo
const tocLinks = Array.from(document.querySelectorAll('.toc a'));
const sections = tocLinks.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
tocLinks.forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); smoothTo(a.getAttribute('href')); history.replaceState(null,'',a.getAttribute('href'));
}));
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const id = '#'+e.target.id;
      tocLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href')===id));
    }
  });
},{ rootMargin:`-${NAV_H+20}px 0px -60% 0px`, threshold:.1 });
sections.forEach(s => io.observe(s));

// Drawer móvil
const drawer = document.getElementById('drawer');
const btnOpen = document.getElementById('btnSections');
const btnClose = document.getElementById('btnCloseDrawer');
btnOpen.addEventListener('click', ()=> drawer.classList.add('show'));
btnClose.addEventListener('click', ()=> drawer.classList.remove('show'));
drawer.addEventListener('click', (e)=>{ if(e.target===drawer) drawer.classList.remove('show'); });

// Navegación dentro del drawer
drawer.querySelectorAll('a').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const href = a.getAttribute('href');
    drawer.classList.remove('show');
    setTimeout(()=>{ smoothTo(href); history.replaceState(null,'',href); }, 150);
  });
});

// Botón “Arriba”
document.getElementById('topbtn').addEventListener('click', (e)=>{
  e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'});
});