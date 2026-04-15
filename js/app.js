'use strict';

// ===== EMBEDDED FALLBACK DATA =====
const FALLBACK_DATA = {
  cities: [
    { id: "pnh", name: "Phnom Penh", khmer: "ភ្នំពេញ", lat: 11.5564, lng: 104.9282, type: "capital", description: "Capital city of Cambodia" },
    { id: "srp", name: "Siem Reap", khmer: "សៀមរាប", lat: 13.3671, lng: 103.8448, type: "major", description: "Home of Angkor Wat" },
    { id: "svk", name: "Sihanoukville", khmer: "សីហនុ", lat: 10.6097, lng: 103.5297, type: "major", description: "Coastal city and beach resort" },
    { id: "btb", name: "Battambang", khmer: "បាត់ដំបង", lat: 13.0957, lng: 103.2022, type: "major", description: "Second largest city" },
    { id: "kpt", name: "Kampot", khmer: "កំពត", lat: 10.6167, lng: 104.1800, type: "secondary", description: "Riverside town near coast" },
    { id: "kep", name: "Kep", khmer: "កែប", lat: 10.4833, lng: 104.3167, type: "secondary", description: "Small coastal resort town" },
    { id: "krt", name: "Kratie", khmer: "ក្រចេះ", lat: 12.4881, lng: 106.0188, type: "secondary", description: "Mekong river town" },
    { id: "kpc", name: "Kompong Cham", khmer: "កំពង់ចាម", lat: 11.9935, lng: 105.4635, type: "secondary", description: "Major Mekong city" },
    { id: "poi", name: "Poipet", khmer: "ប៉ោយប៉ែត", lat: 13.6567, lng: 102.5667, type: "border", description: "Thai border crossing" },
    { id: "kok", name: "Koh Kong", khmer: "កោះកុង", lat: 11.6167, lng: 102.9833, type: "border", description: "Thai border coastal town" },
    { id: "stn", name: "Stung Treng", khmer: "ស្ទឹងត្រែង", lat: 13.5231, lng: 105.9700, type: "secondary", description: "Northern Mekong town" },
    { id: "bnl", name: "Banlung", khmer: "បានលុង", lat: 13.7367, lng: 106.9872, type: "secondary", description: "Ratanakiri provincial capital" },
    { id: "snm", name: "Sen Monorom", khmer: "សែនមនោរម្យ", lat: 12.4567, lng: 107.1883, type: "secondary", description: "Mondulkiri provincial capital" },
    { id: "kch", name: "Kompong Chhnang", khmer: "កំពង់ឆ្នាំង", lat: 12.2500, lng: 104.6667, type: "secondary", description: "Floating village province" },
    { id: "tkv", name: "Takeo", khmer: "តាកែវ", lat: 10.9833, lng: 104.7833, type: "secondary", description: "Southern province capital" },
    { id: "pai", name: "Pailin", khmer: "ប៉ៃលិន", lat: 12.8500, lng: 102.6000, type: "border", description: "Western border town" }
  ],
  routes: []
};

// ===== STATE =====
let appData = { cities: [], routes: [] };
let map, tileLayer;
let routePolylines = {}; // id -> L.polyline
let cityMarkers = {};    // id -> L.marker
let activeRouteId = null;
let filteredRoutes = [];

const TILE_LAYERS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

const AMENITY_ICONS = {
  'WiFi': '📶', 'AC': '❄️', 'USB Charging': '🔌', 'Water': '💧',
  'Snacks': '🍪', 'Reclining Seats': '💺', 'Blanket': '🛏️'
};

const COMPANY_COLORS = {
  'Giant Ibis': '#e74c3c',
  'Mekong Express': '#3498db',
  'Capitol Tour': '#2ecc71',
  'Virak Buntham': '#9b59b6',
  'Local': '#f39c12'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initMap();
  initNav();
  initSidebar();
  initSearch();
  initFilters();
  initMapControls();
  renderRouteList();
  renderRoutesPage();
  renderSchedulePage();
  initFooterLinks();
  initContactForm();
});

async function loadData() {
  try {
    const res = await fetch('data/routes.json');
    if (!res.ok) throw new Error('fetch failed');
    appData = await res.json();
  } catch (e) {
    console.warn('Using fallback data');
    appData = FALLBACK_DATA;
    // Inline routes fallback
    appData.routes = [
      { id:"r01", from:"pnh", to:"srp", company:"Giant Ibis", type:"express", price:15, duration:"6h", distance:"314 km", color:"#e74c3c", stops:["pnh","kch","srp"], amenities:["WiFi","AC","USB Charging","Water","Snacks","Reclining Seats"], schedules:[{departure:"07:00",arrival:"13:00",status:"available"},{departure:"13:00",arrival:"19:00",status:"limited"}] },
      { id:"r02", from:"pnh", to:"srp", company:"Mekong Express", type:"express", price:13, duration:"6h 30m", distance:"314 km", color:"#3498db", stops:["pnh","kch","srp"], amenities:["AC","USB Charging","Water"], schedules:[{departure:"07:30",arrival:"14:00",status:"available"},{departure:"14:00",arrival:"20:30",status:"available"}] },
      { id:"r03", from:"pnh", to:"svk", company:"Giant Ibis", type:"express", price:14, duration:"4h", distance:"230 km", color:"#e74c3c", stops:["pnh","svk"], amenities:["WiFi","AC","USB Charging","Water"], schedules:[{departure:"07:00",arrival:"11:00",status:"available"},{departure:"13:00",arrival:"17:00",status:"limited"}] },
      { id:"r04", from:"pnh", to:"svk", company:"Capitol Tour", type:"local", price:10, duration:"5h", distance:"230 km", color:"#2ecc71", stops:["pnh","tkv","svk"], amenities:["AC","Water"], schedules:[{departure:"06:30",arrival:"11:30",status:"available"}] },
      { id:"r05", from:"pnh", to:"kpt", company:"Giant Ibis", type:"express", price:10, duration:"3h", distance:"148 km", color:"#e74c3c", stops:["pnh","tkv","kpt"], amenities:["WiFi","AC","USB Charging","Water"], schedules:[{departure:"07:30",arrival:"10:30",status:"available"},{departure:"14:00",arrival:"17:00",status:"limited"}] },
      { id:"r06", from:"pnh", to:"btb", company:"Capitol Tour", type:"express", price:10, duration:"5h", distance:"291 km", color:"#2ecc71", stops:["pnh","kch","btb"], amenities:["AC","USB Charging","Water"], schedules:[{departure:"07:00",arrival:"12:00",status:"available"}] },
      { id:"r07", from:"srp", to:"btb", company:"Capitol Tour", type:"local", price:8, duration:"3h", distance:"170 km", color:"#2ecc71", stops:["srp","btb"], amenities:["AC","Water"], schedules:[{departure:"08:00",arrival:"11:00",status:"available"}] },
      { id:"r08", from:"srp", to:"poi", company:"Virak Buntham", type:"local", price:10, duration:"3h 30m", distance:"150 km", color:"#9b59b6", stops:["srp","poi"], amenities:["AC","Water"], schedules:[{departure:"07:30",arrival:"11:00",status:"available"}] },
      { id:"r09", from:"pnh", to:"krt", company:"Virak Buntham", type:"express", price:9, duration:"4h", distance:"220 km", color:"#9b59b6", stops:["pnh","kpc","krt"], amenities:["AC","USB Charging","Water"], schedules:[{departure:"07:00",arrival:"11:00",status:"available"}] },
      { id:"r10", from:"pnh", to:"snm", company:"Virak Buntham", type:"express", price:12, duration:"6h", distance:"371 km", color:"#9b59b6", stops:["pnh","kpc","snm"], amenities:["AC","Water"], schedules:[{departure:"07:30",arrival:"13:30",status:"available"}] },
      { id:"r11", from:"pnh", to:"kpc", company:"Capitol Tour", type:"local", price:6, duration:"2h", distance:"120 km", color:"#2ecc71", stops:["pnh","kpc"], amenities:["AC"], schedules:[{departure:"07:00",arrival:"09:00",status:"available"},{departure:"13:00",arrival:"15:00",status:"available"}] },
      { id:"r12", from:"pnh", to:"kok", company:"Virak Buntham", type:"express", price:12, duration:"5h", distance:"250 km", color:"#9b59b6", stops:["pnh","kok"], amenities:["AC","Water"], schedules:[{departure:"07:00",arrival:"12:00",status:"available"}] },
      { id:"r13", from:"kpt", to:"kep", company:"Local", type:"local", price:3, duration:"45m", distance:"25 km", color:"#f39c12", stops:["kpt","kep"], amenities:[], schedules:[{departure:"08:00",arrival:"08:45",status:"available"},{departure:"12:00",arrival:"12:45",status:"available"}] },
      { id:"r14", from:"krt", to:"stn", company:"Virak Buntham", type:"local", price:7, duration:"2h 30m", distance:"140 km", color:"#9b59b6", stops:["krt","stn"], amenities:["AC"], schedules:[{departure:"08:00",arrival:"10:30",status:"available"}] },
      { id:"r15", from:"stn", to:"bnl", company:"Local", type:"local", price:8, duration:"3h", distance:"155 km", color:"#f39c12", stops:["stn","bnl"], amenities:[], schedules:[{departure:"07:00",arrival:"10:00",status:"available"}] },
      { id:"r16", from:"srp", to:"pnh", company:"Giant Ibis", type:"night", price:17, duration:"6h", distance:"314 km", color:"#e74c3c", stops:["srp","kch","pnh"], amenities:["WiFi","AC","USB Charging","Water","Blanket","Reclining Seats"], schedules:[{departure:"21:00",arrival:"03:00",status:"available"},{departure:"22:00",arrival:"04:00",status:"limited"}] },
      { id:"r17", from:"pnh", to:"tkv", company:"Capitol Tour", type:"local", price:5, duration:"1h 30m", distance:"78 km", color:"#2ecc71", stops:["pnh","tkv"], amenities:["AC"], schedules:[{departure:"07:00",arrival:"08:30",status:"available"}] },
      { id:"r18", from:"btb", to:"pai", company:"Local", type:"local", price:5, duration:"2h", distance:"105 km", color:"#f39c12", stops:["btb","pai"], amenities:[], schedules:[{departure:"08:00",arrival:"10:00",status:"available"}] }
    ];
  }
  filteredRoutes = [...appData.routes];
}

function cityById(id) { return appData.cities.find(c => c.id === id); }
function routeById(id) { return appData.routes.find(r => r.id === id); }

// ===== MAP =====
function initMap() {
  map = L.map('map', { zoomControl: false }).setView([12.5657, 104.9910], 7);

  tileLayer = L.tileLayer(TILE_LAYERS.light, {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  addCityMarkers();
  addRouteLines();

  map.on('click', () => {
    document.getElementById('layerMenu').classList.remove('open');
  });
}

function markerConfig(type) {
  const configs = {
    capital: { radius: 12, color: '#c0392b', fill: '#e74c3c', weight: 3 },
    major:   { radius: 9,  color: '#1a5276', fill: '#2980b9', weight: 2 },
    secondary:{ radius: 7, color: '#1e8449', fill: '#27ae60', weight: 2 },
    border:  { radius: 7,  color: '#784212', fill: '#f39c12', weight: 2 }
  };
  return configs[type] || configs.secondary;
}

function addCityMarkers() {
  appData.cities.forEach(city => {
    const cfg = markerConfig(city.type);
    const routeCount = appData.routes.filter(r => r.from === city.id || r.to === city.id).length;

    const marker = L.circleMarker([city.lat, city.lng], {
      radius: cfg.radius,
      color: cfg.color,
      fillColor: cfg.fill,
      fillOpacity: 0.9,
      weight: cfg.weight
    });

    marker.bindPopup(`
      <div style="min-width:140px">
        <div class="popup-city-name">${city.name}</div>
        <div class="popup-city-kh">${city.khmer}</div>
        <div class="popup-routes"><i class="fas fa-route"></i> ${routeCount} route${routeCount !== 1 ? 's' : ''}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">${city.description}</div>
      </div>
    `);

    // Permanent label for major/capital cities
    if (city.type === 'capital' || city.type === 'major') {
      marker.bindTooltip(city.name, {
        permanent: true,
        direction: 'right',
        offset: [cfg.radius + 2, 0],
        className: 'city-marker-label'
      });
    }

    marker.addTo(map);
    cityMarkers[city.id] = marker;
  });
}

function curvedLatLngs(from, to, offset) {
  const lats = [], lngs = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from.lat + (to.lat - from.lat) * t;
    const lng = from.lng + (to.lng - from.lng) * t;
    const perp = Math.sin(Math.PI * t) * offset;
    const dx = to.lng - from.lng;
    const dy = to.lat - from.lat;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    lats.push(lat - (dx / len) * perp);
    lngs.push(lng + (dy / len) * perp);
  }
  return lats.map((lat, i) => [lat, lngs[i]]);
}

function addRouteLines() {
  // Group routes by city pair to offset overlapping lines
  const pairCount = {};
  appData.routes.forEach(r => {
    const key = [r.from, r.to].sort().join('-');
    pairCount[key] = (pairCount[key] || 0) + 1;
  });
  const pairIndex = {};

  appData.routes.forEach(route => {
    const fromCity = cityById(route.from);
    const toCity = cityById(route.to);
    if (!fromCity || !toCity) return;

    const key = [route.from, route.to].sort().join('-');
    pairIndex[key] = (pairIndex[key] || 0);
    const idx = pairIndex[key];
    pairIndex[key]++;

    const total = pairCount[key];
    const offset = (idx - (total - 1) / 2) * 0.15;

    const latlngs = curvedLatLngs(
      { lat: fromCity.lat, lng: fromCity.lng },
      { lat: toCity.lat, lng: toCity.lng },
      offset
    );

    const isNight = route.type === 'night';
    const polyline = L.polyline(latlngs, {
      color: route.color,
      weight: 3,
      opacity: 0.7,
      dashArray: isNight ? '8, 6' : null,
      smoothFactor: 1
    });

    polyline.on('mouseover', () => highlightRoute(route.id, true));
    polyline.on('mouseout', () => highlightRoute(route.id, false));
    polyline.on('click', () => openModal(route.id));

    polyline.addTo(map);
    routePolylines[route.id] = polyline;
  });
}

function highlightRoute(routeId, on) {
  const poly = routePolylines[routeId];
  if (!poly) return;
  const route = routeById(routeId);
  if (on) {
    poly.setStyle({ weight: 6, opacity: 1 });
    poly.bringToFront();
  } else {
    poly.setStyle({ weight: 3, opacity: 0.7 });
  }
  // Highlight sidebar card
  document.querySelectorAll('.route-card-mini').forEach(el => {
    el.classList.toggle('highlighted', on && el.dataset.id === routeId);
  });
}

function resetAllHighlights() {
  appData.routes.forEach(r => highlightRoute(r.id, false));
}

function showOnlyRoutes(ids) {
  appData.routes.forEach(r => {
    const poly = routePolylines[r.id];
    if (!poly) return;
    if (ids.includes(r.id)) {
      poly.setStyle({ opacity: 0.85, weight: 4 });
      poly.addTo(map);
    } else {
      poly.setStyle({ opacity: 0.15, weight: 2 });
    }
  });
}

function resetRouteVisibility() {
  appData.routes.forEach(r => {
    const poly = routePolylines[r.id];
    if (poly) poly.setStyle({ opacity: 0.7, weight: 3 });
  });
}

// ===== NAVIGATION =====
function initNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.page);
      document.getElementById('mainNav').classList.remove('open');
    });
  });

  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('mainNav').classList.toggle('open');
  });
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  if (page === 'map') {
    setTimeout(() => map && map.invalidateSize(), 100);
  }
}

// ===== SIDEBAR =====
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const icon = document.getElementById('sidebarIcon');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    icon.className = sidebar.classList.contains('collapsed')
      ? 'fas fa-chevron-right'
      : 'fas fa-chevron-left';
    setTimeout(() => map && map.invalidateSize(), 300);
  });
}

// ===== SEARCH & AUTOCOMPLETE =====
let fromCity = null, toCity = null;

function initSearch() {
  setupAutocomplete('fromInput', 'fromList', city => {
    fromCity = city;
    document.getElementById('fromInput').value = city.name;
    document.getElementById('fromList').classList.remove('open');
  });

  setupAutocomplete('toInput', 'toList', city => {
    toCity = city;
    document.getElementById('toInput').value = city.name;
    document.getElementById('toList').classList.remove('open');
  });

  document.getElementById('swapBtn').addEventListener('click', () => {
    const tmp = fromCity;
    fromCity = toCity;
    toCity = tmp;
    document.getElementById('fromInput').value = fromCity ? fromCity.name : '';
    document.getElementById('toInput').value = toCity ? toCity.name : '';
  });

  document.getElementById('searchBtn').addEventListener('click', doSearch);

  document.addEventListener('click', e => {
    if (!e.target.closest('.input-wrap')) {
      document.querySelectorAll('.autocomplete-list').forEach(l => l.classList.remove('open'));
    }
  });
}

function setupAutocomplete(inputId, listId, onSelect) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    list.innerHTML = '';
    if (!q) { list.classList.remove('open'); return; }

    const matches = appData.cities.filter(c =>
      c.name.toLowerCase().includes(q) || c.khmer.includes(q)
    );

    if (!matches.length) { list.classList.remove('open'); return; }

    matches.forEach(city => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<span>${city.name}</span><span class="city-kh">${city.khmer}</span>`;
      item.addEventListener('click', () => onSelect(city));
      list.appendChild(item);
    });

    list.classList.add('open');
  });
}

function doSearch() {
  if (!fromCity && !toCity) {
    applyFilters();
    return;
  }

  const results = appData.routes.filter(r => {
    const matchFrom = !fromCity || r.from === fromCity.id;
    const matchTo = !toCity || r.to === toCity.id;
    return matchFrom && matchTo;
  });

  filteredRoutes = results;
  renderRouteList();

  if (results.length > 0) {
    showOnlyRoutes(results.map(r => r.id));
    // Fit bounds
    const bounds = [];
    results.forEach(r => {
      const fc = cityById(r.from), tc = cityById(r.to);
      if (fc) bounds.push([fc.lat, fc.lng]);
      if (tc) bounds.push([tc.lat, tc.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [60, 60] });
  }
}

// ===== FILTERS =====
function initFilters() {
  document.querySelectorAll('.company-filter, .type-filter').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  const companies = [...document.querySelectorAll('.company-filter:checked')].map(c => c.value);
  const types = [...document.querySelectorAll('.type-filter:checked')].map(c => c.value);

  filteredRoutes = appData.routes.filter(r =>
    companies.includes(r.company) && types.includes(r.type)
  );

  renderRouteList();
  showOnlyRoutes(filteredRoutes.map(r => r.id));
}

// ===== ROUTE LIST (SIDEBAR) =====
function renderRouteList() {
  const list = document.getElementById('routeList');
  const count = document.getElementById('routeCount');
  count.textContent = filteredRoutes.length;
  list.innerHTML = '';

  if (!filteredRoutes.length) {
    list.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:20px">No routes found</p>';
    return;
  }

  filteredRoutes.forEach(route => {
    const from = cityById(route.from);
    const to = cityById(route.to);
    if (!from || !to) return;

    const card = document.createElement('div');
    card.className = 'route-card-mini';
    card.dataset.id = route.id;
    card.style.borderLeftColor = route.color;

    card.innerHTML = `
      <div class="rcm-header">
        <div>
          <div class="rcm-route">${from.name} → ${to.name}</div>
          <div class="rcm-company">${route.company}</div>
        </div>
        <div class="rcm-price">$${route.price}</div>
      </div>
      <div class="rcm-meta">
        <span><i class="fas fa-clock"></i> ${route.duration}</span>
        <span><i class="fas fa-road"></i> ${route.distance}</span>
        <span class="type-badge type-${route.type}">${route.type}</span>
      </div>
    `;

    card.addEventListener('mouseenter', () => highlightRoute(route.id, true));
    card.addEventListener('mouseleave', () => highlightRoute(route.id, false));
    card.addEventListener('click', () => {
      openModal(route.id);
      // Zoom to route
      const fc = cityById(route.from), tc = cityById(route.to);
      if (fc && tc) map.fitBounds([[fc.lat, fc.lng], [tc.lat, tc.lng]], { padding: [80, 80] });
    });

    list.appendChild(card);
  });
}

// ===== MAP CONTROLS =====
function initMapControls() {
  document.getElementById('locateBtn').addEventListener('click', () => {
    map.locate({ setView: true, maxZoom: 12 });
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    map.setView([12.5657, 104.9910], 7);
    resetRouteVisibility();
    fromCity = null; toCity = null;
    document.getElementById('fromInput').value = '';
    document.getElementById('toInput').value = '';
    filteredRoutes = [...appData.routes];
    renderRouteList();
  });

  document.getElementById('layerBtn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('layerMenu').classList.toggle('open');
  });

  document.querySelectorAll('.layer-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.layer;
      map.removeLayer(tileLayer);
      tileLayer = L.tileLayer(TILE_LAYERS[layer], { maxZoom: 18 }).addTo(map);
      document.querySelectorAll('.layer-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('layerMenu').classList.remove('open');
    });
  });
}

// ===== ROUTES PAGE =====
function renderRoutesPage() {
  const grid = document.getElementById('routesGrid');
  grid.innerHTML = '';

  appData.routes.forEach(route => {
    const from = cityById(route.from);
    const to = cityById(route.to);
    if (!from || !to) return;

    const departures = route.schedules.length;
    const card = document.createElement('div');
    card.className = 'route-card';

    card.innerHTML = `
      <div class="rc-header" style="background:${route.color}">
        <div>
          <div class="rc-title">${from.name} → ${to.name}</div>
          <div class="rc-company"><i class="fas fa-building"></i> ${route.company}</div>
        </div>
        <div class="rc-price-big">$${route.price}</div>
      </div>
      <div class="rc-body">
        <div class="rc-stats">
          <div class="rc-stat"><i class="fas fa-clock"></i> ${route.duration}</div>
          <div class="rc-stat"><i class="fas fa-road"></i> ${route.distance}</div>
          <div class="rc-stat"><i class="fas fa-bus"></i> <span class="type-badge type-${route.type}">${route.type}</span></div>
          <div class="rc-stat"><i class="fas fa-calendar"></i> ${departures} daily</div>
        </div>
        <div class="rc-footer">
          <div style="font-size:12px;color:#888">${from.khmer} → ${to.khmer}</div>
          <button class="view-map-btn" data-id="${route.id}">
            <i class="fas fa-map"></i> View on Map
          </button>
        </div>
      </div>
    `;

    card.querySelector('.view-map-btn').addEventListener('click', () => {
      navigateTo('map');
      setTimeout(() => {
        const fc = cityById(route.from), tc = cityById(route.to);
        if (fc && tc) map.fitBounds([[fc.lat, fc.lng], [tc.lat, tc.lng]], { padding: [80, 80] });
        highlightRoute(route.id, true);
        setTimeout(() => highlightRoute(route.id, false), 3000);
        openModal(route.id);
      }, 200);
    });

    grid.appendChild(card);
  });
}

// ===== SCHEDULE PAGE =====
function renderSchedulePage() {
  const select = document.getElementById('routeSelect');
  select.innerHTML = '';

  appData.routes.forEach(route => {
    const from = cityById(route.from);
    const to = cityById(route.to);
    if (!from || !to) return;
    const opt = document.createElement('option');
    opt.value = route.id;
    opt.textContent = `${from.name} → ${to.name} (${route.company}) — $${route.price}`;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => renderScheduleTable(select.value));
  if (appData.routes.length) renderScheduleTable(appData.routes[0].id);
}

function renderScheduleTable(routeId) {
  const route = routeById(routeId);
  const container = document.getElementById('scheduleTable');
  if (!route) { container.innerHTML = ''; return; }

  const from = cityById(route.from);
  const to = cityById(route.to);

  container.innerHTML = `
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Departure</th>
            <th>Arrival</th>
            <th>Duration</th>
            <th>Price</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${route.schedules.map(s => `
            <tr>
              <td><i class="fas fa-clock" style="color:#2980b9;margin-right:6px"></i>${s.departure}</td>
              <td><i class="fas fa-flag-checkered" style="color:#e74c3c;margin-right:6px"></i>${s.arrival}</td>
              <td>${route.duration}</td>
              <td><strong>$${route.price}</strong></td>
              <td><span class="status-badge status-${s.status}">${s.status}</span></td>
              <td><button class="book-btn" ${s.status === 'full' ? 'disabled' : ''}>
                ${s.status === 'full' ? 'Full' : 'Book'}
              </button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.book-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      alert(`Booking for ${from.name} → ${to.name} via ${route.company}.\n\nIn a full implementation, this would open a booking form.`);
    });
  });
}

// ===== MODAL =====
function openModal(routeId) {
  const route = routeById(routeId);
  if (!route) return;

  const from = cityById(route.from);
  const to = cityById(route.to);
  const body = document.getElementById('modalBody');

  const stopsHtml = route.stops.map((stopId, i) => {
    const city = cityById(stopId);
    if (!city) return '';
    const dotClass = i === 0 ? 'start' : i === route.stops.length - 1 ? 'end' : 'middle';
    return `
      <div class="stop-item">
        <div class="stop-dot ${dotClass}"></div>
        <div class="stop-name">
          ${city.name}
          <div class="stop-kh">${city.khmer}</div>
        </div>
      </div>
    `;
  }).join('');

  const amenitiesHtml = route.amenities.length
    ? route.amenities.map(a => `<span class="amenity-tag">${AMENITY_ICONS[a] || '✓'} ${a}</span>`).join('')
    : '<span style="color:#888;font-size:13px">No amenities listed</span>';

  const scheduleHtml = route.schedules.map(s => `
    <tr>
      <td>${s.departure}</td>
      <td>${s.arrival}</td>
      <td>${route.duration}</td>
      <td>$${route.price}</td>
      <td><span class="status-badge status-${s.status}">${s.status}</span></td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div class="modal-header" style="background:${route.color}">
      <div class="modal-title">${from.name} → ${to.name}</div>
      <div class="modal-company"><i class="fas fa-building"></i> ${route.company} &nbsp;|&nbsp; <span class="type-badge type-${route.type}" style="background:rgba(255,255,255,0.2);color:#fff">${route.type}</span></div>
    </div>
    <div class="modal-info-grid">
      <div class="modal-info-box"><div class="label">Price</div><div class="value">$${route.price}</div></div>
      <div class="modal-info-box"><div class="label">Duration</div><div class="value">${route.duration}</div></div>
      <div class="modal-info-box"><div class="label">Distance</div><div class="value">${route.distance}</div></div>
      <div class="modal-info-box"><div class="label">Type</div><div class="value" style="font-size:14px;text-transform:capitalize">${route.type}</div></div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-map-signs"></i> Stops</h4>
      <div class="stops-timeline">${stopsHtml}</div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-star"></i> Amenities</h4>
      <div class="amenities-list">${amenitiesHtml}</div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-clock"></i> Schedule</h4>
      <table class="modal-schedule-table">
        <thead><tr><th>Departs</th><th>Arrives</th><th>Duration</th><th>Price</th><th>Status</th></tr></thead>
        <tbody>${scheduleHtml}</tbody>
      </table>
    </div>
    <div class="modal-cta">
      <button class="book-cta-btn"><i class="fas fa-ticket-alt"></i> Book This Route</button>
    </div>
  `;

  body.querySelector('.book-cta-btn').addEventListener('click', () => {
    alert(`Booking ${from.name} → ${to.name} via ${route.company}.\n\nIn a full implementation, this would open a booking form.`);
  });

  document.getElementById('modalOverlay').classList.add('open');
  activeRouteId = routeId;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  activeRouteId = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ===== FOOTER LINKS =====
function initFooterLinks() {
  document.querySelectorAll('.footer-route').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const fromId = link.dataset.from;
      const toId = link.dataset.to;
      fromCity = cityById(fromId);
      toCity = cityById(toId);
      document.getElementById('fromInput').value = fromCity ? fromCity.name : '';
      document.getElementById('toInput').value = toCity ? toCity.name : '';
      navigateTo('map');
      setTimeout(doSearch, 200);
    });
  });
}

// ===== CONTACT FORM =====
function initContactForm() {
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const btn = e.target.querySelector('.submit-btn');
    btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
    btn.style.background = '#27ae60';
    e.target.reset();
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
      btn.style.background = '';
    }, 3000);
  });
}
