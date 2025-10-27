// Elementos del DOM
const searchIcon = document.getElementById('searchIcon');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');
const searchInput = document.getElementById('searchInput');
const minInput = document.getElementById('precioMin');
const maxInput = document.getElementById('precioMax');
const applyBtn = document.getElementById('applyFilters');
const clearBtn = document.getElementById('clearFilters');
const catalogo = document.getElementById('catalogo');

// Almacena los datos originales del catálogo
let datosOriginales = [];

// Muestra el menú lateral al hacer clic en el icono de búsqueda
searchIcon.addEventListener('click', () => {
  sideMenu.classList.add('visible');
});

// Oculta el menú lateral al hacer clic en el botón de cerrar
closeBtn.addEventListener('click', () => {
  sideMenu.classList.remove('visible');
});

// Aplica los filtros y cierra el menú lateral
applyBtn.addEventListener('click', () => {
  filtrarPacks();
  sideMenu.classList.remove('visible');
});

// Limpia los filtros y muestra todos los packs
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  minInput.value = '';
  maxInput.value = '';
  mostrarPacks(datosOriginales);
});

// Verifica si todos los campos de filtro están vacíos
function camposVacios() {
  return (
    searchInput.value.trim() === '' &&
    minInput.value.trim() === '' &&
    maxInput.value.trim() === ''
  );
}

// Filtra los packs según los términos de búsqueda y el rango de precios
function filtrarPacks() {
  const termino = searchInput.value.toLowerCase();
  const min = Number(minInput.value) || 0;
  const max = Number(maxInput.value) || Infinity;

  // Permite buscar múltiples términos separados por coma
  const terminos = termino
    .split(',')
    .map(p => p.trim())
    .filter(p => p !== '');

  const filtrados = datosOriginales.filter(pack => {
    const nombreJuegos = pack["Juegos Incluidos"]?.toLowerCase() || '';
    const precio = Number(pack["Precio CLP"]);
    if (isNaN(precio)) return false;

    // Verifica que todos los términos estén presentes en los juegos incluidos
    const coincideNombre = terminos.every(t => nombreJuegos.includes(t));
    // Verifica que el precio esté dentro del rango
    const coincidePrecio = precio >= min && precio <= max;

    return coincideNombre && coincidePrecio;
  });

  mostrarPacks(filtrados);
}

// Muestra los packs en el catálogo
function mostrarPacks(packs) {
  const catalogo = document.getElementById('catalogo');
  catalogo.innerHTML = '';

  packs.forEach(pack => {
    const div = document.createElement('div');
    div.className = 'pack';

    // Separar consolas (badge por cada una)
    const consolas = pack.Consola
      ? pack.Consola.split(',').map(c => {
          const consola = c.trim();
          const clase =
            consola === 'Nintendo Switch 2'
              ? 'switch2'
              : consola === 'Nintendo Switch'
              ? 'switch1'
              : 'default';
          return `<span class="badge-console ${clase}">${consola}</span>`;
        }).join(' ')
      : '<span class="badge-console default">No especificada</span>';

    // Generar mensaje de WhatsApp
    const mensajeWhatsapp = encodeURIComponent(`
👋 ¡Hola! Vi el *Pack Nº ${pack["Pack ID"]}* en tu página y me interesó.

🎮 Juegos incluidos:
${pack["Juegos Incluidos"]
  .split('\n')
  .map(j => `- ${j}`)
  .join('\n')}

💵 Precio: $${Number(pack["Precio CLP"]).toLocaleString('es-CL')} CLP

Estoy interesado en adquirirlo. ¿Está disponible?
`);

    div.innerHTML = `
      ${pack.Estado ? `<div class="badge-console">${pack.Estado}</div>` : ''}
      <img 
        src="${
          pack["Imagen URL"] && pack["Imagen URL"].trim() !== '' 
            ? pack["Imagen URL"] 
            : (
                pack.Consola?.includes('Nintendo Switch 2') && !pack.Consola.includes('Nintendo Switch, Nintendo Switch 2')
                  ? 'imagen_pack2.png'
                  : 'imagen_pack.png'
              )
        }" 
        alt="Imagen del pack" 
        class="imagen-pack" />
      <h2>Pack Nº ${pack["Pack ID"]}</h2>
      <p><strong>Juegos incluidos:</strong></p>
      <ul>
        ${pack["Juegos Incluidos"]
          .split('\n')
          .map(j => `<li>${j}</li>`)
          .join('')}
      </ul>

      <div class="compatibilidad">
        <h4>Compatibilidad</h4>
        ${consolas}
      </div>

      <div class="seccion-precio">
        <h4>Precio</h4>
        <p class="precio">$${Number(pack["Precio CLP"]).toLocaleString('es-CL')} CLP</p>

        <a 
          href="https://wa.me/56926411278?text=${encodeURIComponent(`Hola! Quiero comprar el *Pack Nº ${pack["Pack ID"]}*.\n\nJuegos incluidos:\n${pack["Juegos Incluidos"]}\n\nPrecio: $${Number(pack["Precio CLP"]).toLocaleString('es-CL')} CLP\n\n¿Está disponible?`)}"
          class="btn-black"
          target="_blank"
        >
          🛒 Haz clic aquí para comprar
        </a>
        <small class="whatsapp-aviso">*Serás redirigido a WhatsApp para completar la compra.</small>
      </div>
    `;

    catalogo.appendChild(div);
  });
}

// Carga los datos desde Google Sheets usando PapaParse
Papa.parse(
  "https://docs.google.com/spreadsheets/d/1vMSEjE9dQYossGGN_4KP_-DL8sKkb_09R0e2mo9WLHQ/gviz/tq?tqx=out:csv&gid=858783180",
  {
    download: true,
    header: true,
    complete: function (results) {
      datosOriginales = results.data;
      console.log("✅ Packs cargados:", datosOriginales.length, datosOriginales[0]); // <-- debug
      mostrarPacks(datosOriginales);
    },
    error: function(err) {
      console.error("❌ Error al cargar CSV:", err);
    }
  }
);

/* =========================
   ADICIONES: MENÚ + BACKDROP
   (no se elimina nada existente)
   ========================= */

// Referencias adicionales
const menuIcon       = document.getElementById('menuIcon');
const hamburgerMenu  = document.getElementById('hamburgerMenu');
const menuCloseBtn   = document.getElementById('menuCloseBtn');
const backdrop       = document.getElementById('backdrop');

// Helpers de backdrop
function showBackdrop(){ backdrop && backdrop.classList.add('active'); }
function hideBackdropIfNoneOpen(){
  const menuOpen   = hamburgerMenu && hamburgerMenu.classList.contains('visible');
  const searchOpen = sideMenu && sideMenu.classList.contains('visible');
  if (!menuOpen && !searchOpen && backdrop) backdrop.classList.remove('active');
}

/* ---- Integración con tu buscador (clase 'visible') ----
   Mantengo tus listeners originales. Estos listeners extra
   SOLO manejan el backdrop y convivencia con el menú. */
if (searchIcon) {
  searchIcon.addEventListener('click', () => {
    // Tu listener original ya abre el panel; aquí solo mostramos el backdrop
    showBackdrop();
  });
}
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    // Tu listener original ya cierra el panel; aquí solo gestionamos backdrop
    hideBackdropIfNoneOpen();
  });
}
if (applyBtn) {
  applyBtn.addEventListener('click', () => {
    // Ya cierras el panel; aquí apagamos backdrop si corresponde
    hideBackdropIfNoneOpen();
  });
}
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    // Si el usuario limpió con el panel abierto o cerrado
    hideBackdropIfNoneOpen();
  });
}

/* ---- Menú hamburguesa (usa misma clase 'visible') ---- */
function openMenu(){
  if (hamburgerMenu){
    hamburgerMenu.classList.add('visible');
    showBackdrop();
  }
}
function closeMenu(){
  if (hamburgerMenu){
    hamburgerMenu.classList.remove('visible');
    hideBackdropIfNoneOpen();
  }
}

if (menuIcon)     menuIcon.addEventListener('click', openMenu);
if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);

// Backdrop: cerrar ambos paneles al tocar fuera
if (backdrop){
  backdrop.addEventListener('click', () => {
    if (sideMenu)      sideMenu.classList.remove('visible');
    if (hamburgerMenu) hamburgerMenu.classList.remove('visible');
    hideBackdropIfNoneOpen();
  });
}

// Tecla ESC: cerrar ambos
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    if (sideMenu)      sideMenu.classList.remove('visible');
    if (hamburgerMenu) hamburgerMenu.classList.remove('visible');
    hideBackdropIfNoneOpen();
  }
});