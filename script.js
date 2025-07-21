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
  catalogo.innerHTML = '';
  packs.forEach(pack => {
    const div = document.createElement('div');
    div.className = 'pack';
    div.innerHTML = `
      ${pack.Estado ? `<div class="badge">${pack.Estado}</div>` : ''}
      <img src="${pack["Imagen URL"]}" alt="Imagen pack" />
      <h2>Pack Nº ${pack["Pack ID"]}</h2>
      <p><strong>Juegos incluidos:</strong></p>
      <ul>
        ${pack["Juegos Incluidos"]
          .split('\n')
          .map(j => `<li>${j}</li>`)
          .join('')}
      </ul>
      <p><strong>Consola:</strong> ${pack.Consola}</p>
      <p class="precio">$${Number(pack["Precio CLP"]).toLocaleString('es-CL')} CLP</p>
    `;
    catalogo.appendChild(div);
  });
}

// Carga los datos desde Google Sheets usando PapaParse
Papa.parse(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQsDYcvcNTrISbWFc5O2Cyvtsn7Aaz_nEV32yWDLh_dIR_4t1Kz-cep6oaXnQQrCxfhRy1K-H6JTk4/pub?gid=1697555116&single=true&output=csv",
  {
    download: true,
    header: true,
    complete: function (results) {
      datosOriginales = results.data;
      mostrarPacks(datosOriginales);
    }
  }
);