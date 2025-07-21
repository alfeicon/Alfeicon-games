const searchIcon = document.getElementById('searchIcon');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');
const searchInput = document.getElementById('searchInput');
const minInput = document.getElementById('precioMin');
const maxInput = document.getElementById('precioMax');
const applyBtn = document.getElementById('applyFilters');
const clearBtn = document.getElementById('clearFilters');
const catalogo = document.getElementById('catalogo');

let datosOriginales = [];

searchIcon.addEventListener('click', () => {
  sideMenu.classList.add('visible');
});

closeBtn.addEventListener('click', () => {
  sideMenu.classList.remove('visible');
});

applyBtn.addEventListener('click', () => {
  filtrarPacks();
  sideMenu.classList.remove('visible');
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  minInput.value = '';
  maxInput.value = '';
  mostrarPacks(datosOriginales);
});

function camposVacios() {
  return (
    searchInput.value.trim() === '' &&
    minInput.value.trim() === '' &&
    maxInput.value.trim() === ''
  );
}

function filtrarPacks() {
  const termino = searchInput.value.toLowerCase();
  const min = Number(minInput.value) || 0;
  const max = Number(maxInput.value) || Infinity;

  const terminos = termino
    .split(',')
    .map(p => p.trim())
    .filter(p => p !== '');

  const filtrados = datosOriginales.filter(pack => {
    const nombreJuegos = pack["Juegos Incluidos"]?.toLowerCase() || '';
    const precio = Number(pack["Precio CLP"]);
    if (isNaN(precio)) return false;

    // Asegura que todos los términos estén incluidos
    const coincideNombre = terminos.every(t => nombreJuegos.includes(t));
    const coincidePrecio = precio >= min && precio <= max;

    return coincideNombre && coincidePrecio;
  });

  mostrarPacks(filtrados);
}

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
      <ul>${pack["Juegos Incluidos"].split('\n').map(j => `<li>${j}</li>`).join('')}</ul>
      <p><strong>Consola:</strong> ${pack.Consola}</p>
      <p class="precio">$${Number(pack["Precio CLP"]).toLocaleString('es-CL')} CLP</p>
    `;
    catalogo.appendChild(div);
  });
}

Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vSQsDYcvcNTrISbWFc5O2Cyvtsn7Aaz_nEV32yWDLh_dIR_4t1Kz-cep6oaXnQQrCxfhRy1K-H6JTk4/pub?gid=1697555116&single=true&output=csv", {
  download: true,
  header: true,
  complete: function (results) {
    datosOriginales = results.data;
    mostrarPacks(datosOriginales);
  }
});