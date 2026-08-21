// ==================== STORAGE ====================
const STORAGE_ORDERS = 'pedidos_kit_orders_v1';
const STORAGE_SETTINGS = 'pedidos_kit_settings_v1';
const IMAGE_IMPORT_MARKER = 'pedidos_kit_image_import_v1';

const DEFAULT_CLUBS = [
  'Seleção de Portugal', 'Benfica', 'FC Porto', 'Sporting CP',
  'Real Madrid', 'FC Barcelona', 'Seleção do Brasil', 'Seleção de Argentina',
  'Manchester City', 'Manchester United'
];
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Criança'];
const DEFAULT_EQUIPMENT = ['Principal', 'Secundário', 'Terciário', 'Especial', 'Versão Jogador', 'Retro'];
const IMAGE_CLUBS = ['PORTO', 'PORTUGAL', 'BÉLGICA', 'SUÍÇA', 'ARGENTINA', 'MAN. CITY', 'BARCELONA'];
const IMAGE_SIZES = ['28 (14/15)', '18 (4/5)', '20 (6/7)', '22 (8/9)'];

const DEFAULT_SETTINGS = {
  clubs: DEFAULT_CLUBS,
  sizes: DEFAULT_SIZES,
  equipment: DEFAULT_EQUIPMENT,
  costs: { 'T-shirt': 15, 'Camisola': 25, 'Kit': 45, custom: 5, patch: 0, special: 0 },
  prices: { 'T-shirt': 15, 'Camisola': 25, 'Kit': 45, custom: 5, patch: 0, special: 0 }
};

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ORDERS)) || [];
  } catch { return []; }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
    if (!s) return structuredClone(DEFAULT_SETTINGS);
    s.clubs = s.clubs || DEFAULT_CLUBS;
    s.sizes = s.sizes || DEFAULT_SIZES;
    s.equipment = [...new Set([...(s.equipment || []), ...DEFAULT_EQUIPMENT])];
    s.costs = { ...DEFAULT_SETTINGS.costs, ...(s.costs || s.prices || {}) };
    s.prices = { ...DEFAULT_SETTINGS.prices, ...(s.prices || {}) };
    return s;
  } catch { return structuredClone(DEFAULT_SETTINGS); }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

function isSpecialEquipment(equipment) {
  return ['especial', 'versão jogador', 'retro'].includes((equipment || '').trim().toLowerCase());
}

function orderCost(order) {
  if (order.custo !== undefined) return Number(order.custo) || 0;
  const cost = settings.costs[order.tipo] || 0;
  const equipmentCost = isSpecialEquipment(order.equipamento) ? (settings.costs.special || 0) : 0;
  const customCost = order.customizado ? (settings.costs.custom || 0) : 0;
  const patchCost = order.patchado ? (settings.costs.patch || 0) : 0;
  return cost + equipmentCost + customCost + patchCost;
}

function orderProfit(order) {
  return Number(order.preco || 0) - orderCost(order);
}

let orders = loadOrders();
let settings = loadSettings();
let currentFilter = 'all';
let currentSearch = '';

const IMAGE_ORDERS = [
  ['Paulo (Acácio)', 'T-shirt', 'PORTO', 'Terciário', 'M', '', 20, false, false],
  ['Braziela', 'T-shirt', 'PORTUGAL', 'Principal', 'M', 'RONALDO / 7', 20, false, true],
  ['Marco Matrículas', 'T-shirt', 'PORTO', 'Terciário', 'M', '', 20, false, false],
  ['Marco Matrículas', 'T-shirt', 'PORTO', 'Terciário', 'M', '', 20, false, false],
  ['Gil (Salvaterra)', 'Kit', 'BÉLGICA', 'Principal', '28 (14/15)', 'ACRESCE PORTE', 25, false, false],
  ['Gil (Salvaterra)', 'Kit', 'SUÍÇA', 'Principal', '28 (14/15)', '', 25, false, false],
  ['Fábio (Martins)', 'T-shirt', 'PORTO', 'Terciário', 'XL', '', 20, false, false],
  ['Fábio (Martins)', 'T-shirt', 'PORTO', 'Especial', 'M', 'AZULEIJO', 25, false, false],
  ['Albertino (Face)', 'T-shirt', 'PORTO', 'Terciário', 'S', '', 20, false, false],
  ['Cláudio Vaz', 'T-shirt', 'ARGENTINA', 'Principal', 'M', 'MESSI / 10', 25, false, false],
  ['Luís ARService', 'T-shirt', 'PORTO', 'Terciário', '3XL', 'LUIS / 23', 25, false, false],
  ['Bruno (São Pedro da cova)', 'T-shirt', 'PORTO', 'Secundário', 'S', '', 20, false, false],
  ['Bruno (São Pedro da cova)', 'T-shirt', 'PORTO', 'Secundário', 'XL', '', 20, false, false],
  ['Bruno (São Pedro da cova)', 'Kit', 'PORTO', 'Secundário', '28 (14/15)', 'COM MEIAS', 30, false, false],
  ['Bruno (São Pedro da cova)', 'T-shirt', 'PORTO', 'Terciário', 'S', '', 20, false, false],
  ['Dani', 'Kit', 'PORTO', 'Principal', '18 (4/5)', 'VALENTIM', 25, false, true],
  ['Dani', 'Kit', 'PORTO', 'Principal', '18 (4/5)', 'FRANCISCO / 9', 30, true, false],
  ['Dani', 'Camisola', 'PORTO', 'Secundário', 'M', '', 25, true, true],
  ['Dani', 'Versão Jogador', 'PORTO', 'Principal', 'XL', '', 25, false, false],
  ['Dani', 'T-shirt', 'PORTO', 'Secundário', 'S', 'CATARINA', 25, false, false],
  ['Pedro (Sernox)', 'T-shirt', 'PORTO', 'Principal', 'M', 'LARA / 23', 25, true, false],
  ['Pedro (Sernox)', 'T-shirt', 'PORTO', 'Especial', 'XL', 'AZULEIJO', 25, false, false],
  ['Cpcms', 'T-shirt', 'PORTUGAL', 'Secundário', 'L', 'RAFALELO / 17 / P', 30, false, true],
  ['Cunha', 'T-shirt', 'MAN. CITY', 'Principal', 'S', 'HAALAND / 9 - AZUL', 30, false, true],
  ['Rui (Face)', 'Kit', 'BARCELONA', 'Secundário', '28 (14/15)', 'VICENTE / 19 / CO', 25, false, true],
  ['Tiago (Face)', 'Kit', 'PORTO', 'Secundário', '20 (6/7)', 'ROSA SALMAO', 20, false, false],
  ['Tiago (Face)', 'Kit', 'PORTO', 'Secundário', '22 (8/9)', 'ROSA SALMAO', 20, false, false],
  ['Tiago (Face)', 'Kit', 'PORTO', 'Secundário', '20 (6/7)', 'ROSA SALMAO', 20, false, false]
];

function importImageOrders() {
  if (localStorage.getItem(IMAGE_IMPORT_MARKER)) return;

  const importedAt = Date.now();
  const importedOrders = IMAGE_ORDERS.map((item, index) => {
    const [nome, tipo, clube, equipamento, tamanho, observacoes, preco, pago, personalizado] = item;
    return {
      id: `imagem-${index + 1}`,
      nome,
      telemovel: '',
      tipo,
      clube,
      equipamento,
      tamanho,
      customizado: personalizado,
      customNome: personalizado ? observacoes.split(' / ')[0] : '',
      customNumero: personalizado && observacoes.includes(' / ') ? observacoes.split(' / ')[1] : '',
      preco,
      pago,
      entregue: index === 1,
      observacoes,
      createdAt: importedAt + index
    };
  });

  orders = [...orders, ...importedOrders];
  saveOrders(orders);
  settings.clubs = [...new Set([...settings.clubs, ...IMAGE_CLUBS])];
  settings.sizes = [...new Set([...settings.sizes, ...IMAGE_SIZES])];
  saveSettings(settings);
  localStorage.setItem(IMAGE_IMPORT_MARKER, 'done');
}

importImageOrders();

// ==================== NAVIGATION ====================
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');

function switchView(name) {
  views.forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.view === name));
  if (name === 'home') renderHome();
  if (name === 'lista') renderOrdersList();
  if (name === 'defs') renderSettings();
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

// ==================== TOAST ====================
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

// ==================== HELPERS ====================
function formatMoney(v) {
  return `${Number(v).toFixed(2).replace(/\.00$/, '')}€`;
}

function statusInfo(order) {
  const badges = [];
  badges.push(order.pago
    ? { text: 'Pago', cls: 'ok' }
    : { text: 'Por pagar', cls: 'danger' });
  badges.push(order.entregue
    ? { text: 'Entregue', cls: 'ok' }
    : { text: 'Por entregar', cls: 'pending' });
  if (order.customizado) badges.push({ text: 'Customizado', cls: 'custom' });
  return badges;
}

function matchesFilter(order, filter) {
  if (filter === 'all') return true;
  if (filter === 'pendente-pagamento') return !order.pago;
  if (filter === 'pendente-entrega') return !order.entregue;
  if (filter === 'concluido') return order.pago && order.entregue;
  return true;
}

function matchesSearch(order, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  return (order.nome || '').toLowerCase().includes(t)
    || (order.clube || '').toLowerCase().includes(t)
    || (order.equipamento || '').toLowerCase().includes(t)
    || (order.patchNome || '').toLowerCase().includes(t)
    || (order.telemovel || '').toLowerCase().includes(t)
    || (order.tipo || '').toLowerCase().includes(t);
}

function orderCardHTML(order) {
  const badges = statusInfo(order).map(b => `<span class="badge ${b.cls}">${b.text}</span>`).join('');
  const customLine = order.customizado
    ? ` · ${order.customNome || ''}${order.customNumero ? ' #' + order.customNumero : ''}`
    : '';
  const patchLine = order.patchado && order.patchNome
    ? ` · Patch: ${escapeHTML(order.patchNome)}`
    : '';
  const equipamentoLine = order.equipamento ? ` · ${escapeHTML(order.equipamento)}` : '';
  const tamanhoLine = order.tamanho ? ` · Tam. ${escapeHTML(order.tamanho)}` : '';
  return `
    <div class="order-card" data-id="${order.id}">
      <div class="order-card-top">
        <div>
          <div class="order-card-title">${escapeHTML(order.nome)}</div>
          <div class="order-card-sub">${escapeHTML(order.tipo)} · ${escapeHTML(order.clube)}${equipamentoLine}${tamanhoLine}${customLine}${patchLine}</div>
        </div>
        <div class="order-card-price">${formatMoney(order.preco)}</div>
      </div>
      <div class="badges">${badges}</div>
    </div>
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ==================== HOME ====================
function renderHome() {
  const total = orders.length;
  const porEntregar = orders.filter(o => !o.entregue).length;
  const porPagar = orders.filter(o => !o.pago).length;
  const receita = orders.filter(o => o.pago).reduce((s, o) => s + Number(o.preco || 0), 0);
  const receitaPendente = orders.filter(o => !o.pago).reduce((s, o) => s + Number(o.preco || 0), 0);
  const lucro = orders.reduce((s, o) => s + orderProfit(o), 0);
  const lucroPendente = orders.filter(o => !o.pago).reduce((s, o) => s + orderProfit(o), 0);

  const now = new Date();
  const receitaMes = orders
    .filter(o => o.pago && o.createdAt && sameMonth(new Date(o.createdAt), now))
    .reduce((s, o) => s + Number(o.preco || 0), 0);

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-por-entregar').textContent = porEntregar;
  document.getElementById('stat-por-pagar').textContent = porPagar;
  document.getElementById('stat-receita').textContent = formatMoney(receita);
  document.getElementById('stat-receita-pendente').textContent = formatMoney(receitaPendente);
  document.getElementById('stat-mes').textContent = formatMoney(receitaMes);
  document.getElementById('stat-lucro').textContent = formatMoney(lucro);
  document.getElementById('stat-lucro-pendente').textContent = formatMoney(lucroPendente);

  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const recentList = document.getElementById('recent-list');
  const recentEmpty = document.getElementById('recent-empty');
  recentList.innerHTML = recent.map(orderCardHTML).join('');
  recentEmpty.hidden = recent.length > 0;
}

function sameMonth(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

// ==================== LISTA ====================
function renderOrdersList() {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');
  const filtered = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter(o => matchesFilter(o, currentFilter) && matchesSearch(o, currentSearch));

  list.innerHTML = filtered.map(orderCardHTML).join('');
  empty.hidden = filtered.length > 0;
}

document.getElementById('search-input').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderOrdersList();
});

document.getElementById('filter-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentFilter = chip.dataset.filter;
  renderOrdersList();
});

// click on any order card (home recent or list) opens edit modal
document.getElementById('app').addEventListener('click', (e) => {
  const card = e.target.closest('.order-card');
  if (!card) return;
  const order = orders.find(o => o.id === card.dataset.id);
  if (order) openModal(order);
});

// ==================== SETTINGS ====================
function renderSettings() {
  document.getElementById('price-tshirt').value = settings.costs['T-shirt'];
  document.getElementById('price-camisola').value = settings.costs['Camisola'];
  document.getElementById('price-kit').value = settings.costs['Kit'];
  document.getElementById('price-custom').value = settings.costs.custom;
  document.getElementById('price-patch').value = settings.costs.patch;
  document.getElementById('price-special').value = settings.costs.special;
  document.getElementById('sale-price-tshirt').value = settings.prices['T-shirt'];
  document.getElementById('sale-price-camisola').value = settings.prices['Camisola'];
  document.getElementById('sale-price-kit').value = settings.prices['Kit'];
  document.getElementById('sale-price-custom').value = settings.prices.custom;
  document.getElementById('sale-price-patch').value = settings.prices.patch;
  document.getElementById('sale-price-special').value = settings.prices.special;

  const clubsList = document.getElementById('clubs-list');
  clubsList.innerHTML = settings.clubs.map(club => `
    <li data-club="${escapeHTML(club)}">
      ${escapeHTML(club)} <button aria-label="Remover">✕</button>
    </li>
  `).join('');

  const sizesList = document.getElementById('sizes-list');
  sizesList.innerHTML = settings.sizes.map(size => `
    <li data-size="${escapeHTML(size)}">
      ${escapeHTML(size)} <button aria-label="Remover">✕</button>
    </li>
  `).join('');

  const equipmentList = document.getElementById('equipment-list');
  equipmentList.innerHTML = settings.equipment.map(equipment => `
    <li data-equipment="${escapeHTML(equipment)}">
      ${escapeHTML(equipment)} <button aria-label="Remover">✕</button>
    </li>
  `).join('');
}

document.getElementById('btn-add-club').addEventListener('click', () => {
  const input = document.getElementById('new-club-input');
  const value = input.value.trim();
  if (!value) return;
  if (settings.clubs.some(c => c.toLowerCase() === value.toLowerCase())) {
    showToast('Esse clube já existe');
    return;
  }
  settings.clubs.push(value);
  saveSettings(settings);
  input.value = '';
  renderSettings();
  showToast('Clube adicionado');
});

document.getElementById('new-club-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('btn-add-club').click();
  }
});

document.getElementById('clubs-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const li = btn.closest('li');
  const club = li.dataset.club;
  settings.clubs = settings.clubs.filter(c => c !== club);
  saveSettings(settings);
  renderSettings();
});

document.getElementById('btn-add-size').addEventListener('click', () => {
  const input = document.getElementById('new-size-input');
  const value = input.value.trim();
  if (!value) return;
  if (settings.sizes.some(size => size.toLowerCase() === value.toLowerCase())) {
    showToast('Esse tamanho já existe');
    return;
  }
  settings.sizes.push(value);
  saveSettings(settings);
  input.value = '';
  renderSettings();
  showToast('Tamanho adicionado');
});

document.getElementById('new-size-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('btn-add-size').click();
  }
});

document.getElementById('sizes-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const li = btn.closest('li');
  const size = li.dataset.size;
  settings.sizes = settings.sizes.filter(item => item !== size);
  saveSettings(settings);
  renderSettings();
});

document.getElementById('btn-add-equipment').addEventListener('click', () => {
  const input = document.getElementById('new-equipment-input');
  const value = input.value.trim();
  if (!value) return;
  if (settings.equipment.some(equipment => equipment.toLowerCase() === value.toLowerCase())) {
    showToast('Esse tipo de equipamento já existe');
    return;
  }
  settings.equipment.push(value);
  saveSettings(settings);
  input.value = '';
  renderSettings();
  showToast('Tipo de equipamento adicionado');
});

document.getElementById('new-equipment-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('btn-add-equipment').click();
  }
});

document.getElementById('equipment-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const li = btn.closest('li');
  const equipment = li.dataset.equipment;
  settings.equipment = settings.equipment.filter(item => item !== equipment);
  saveSettings(settings);
  renderSettings();
});

['price-tshirt', 'price-camisola', 'price-kit', 'price-custom', 'price-patch', 'price-special'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    settings.costs['T-shirt'] = Number(document.getElementById('price-tshirt').value) || 0;
    settings.costs['Camisola'] = Number(document.getElementById('price-camisola').value) || 0;
    settings.costs['Kit'] = Number(document.getElementById('price-kit').value) || 0;
    settings.costs.custom = Number(document.getElementById('price-custom').value) || 0;
    settings.costs.patch = Number(document.getElementById('price-patch').value) || 0;
    settings.costs.special = Number(document.getElementById('price-special').value) || 0;
    saveSettings(settings);
    renderHome();
    showToast('Preços base atualizados');
  });
});

['sale-price-tshirt', 'sale-price-camisola', 'sale-price-kit', 'sale-price-custom', 'sale-price-patch', 'sale-price-special'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    settings.prices['T-shirt'] = Number(document.getElementById('sale-price-tshirt').value) || 0;
    settings.prices['Camisola'] = Number(document.getElementById('sale-price-camisola').value) || 0;
    settings.prices['Kit'] = Number(document.getElementById('sale-price-kit').value) || 0;
    settings.prices.custom = Number(document.getElementById('sale-price-custom').value) || 0;
    settings.prices.patch = Number(document.getElementById('sale-price-patch').value) || 0;
    settings.prices.special = Number(document.getElementById('sale-price-special').value) || 0;
    saveSettings(settings);
    renderHome();
    showToast('Preços de venda atualizados');
  });
});

document.getElementById('btn-export').addEventListener('click', () => {
  const data = { orders, settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-kit-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.orders)) {
        orders = data.orders;
        saveOrders(orders);
      }
      if (data.settings) {
        settings = { ...DEFAULT_SETTINGS, ...data.settings };
        settings.clubs = data.settings.clubs || DEFAULT_SETTINGS.clubs;
        settings.sizes = data.settings.sizes || DEFAULT_SETTINGS.sizes;
        settings.equipment = data.settings.equipment || DEFAULT_SETTINGS.equipment;
        settings.costs = { ...DEFAULT_SETTINGS.costs, ...(data.settings.costs || data.settings.prices || {}) };
        settings.prices = { ...DEFAULT_SETTINGS.prices, ...(data.settings.prices || {}) };
        saveSettings(settings);
      }
      renderSettings();
      renderHome();
      showToast('Backup importado com sucesso');
    } catch {
      showToast('Ficheiro inválido');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
  if (!confirm('Tens a certeza que queres apagar todos os pedidos? Esta ação não pode ser desfeita.')) return;
  orders = [];
  saveOrders(orders);
  renderHome();
  renderOrdersList();
  showToast('Todos os pedidos foram apagados');
});

// ==================== MODAL / FORM ====================
const modalOverlay = document.getElementById('modal-overlay');
const orderForm = document.getElementById('order-form');
const customCheckbox = document.getElementById('f-customizado');
const customFields = document.getElementById('custom-fields');
const patchCheckbox = document.getElementById('f-patch');
const patchFields = document.getElementById('patch-fields');
const deleteBtn = document.getElementById('btn-delete-order');
const tipoSelect = document.getElementById('f-tipo');
const precoInput = document.getElementById('f-preco');

function populateClubSelect() {
  const clubeSelect = document.getElementById('f-clube');
  clubeSelect.innerHTML = settings.clubs.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  refreshSearchableSelect(clubeSelect);
}

function populateSizeSelect() {
  const sizeSelect = document.getElementById('f-tamanho');
  sizeSelect.innerHTML = settings.sizes.map(size => `<option value="${escapeHTML(size)}">${escapeHTML(size)}</option>`).join('');
  refreshSearchableSelect(sizeSelect);
}

function populateEquipmentSelect() {
  const equipmentSelect = document.getElementById('f-equipamento');
  equipmentSelect.innerHTML = settings.equipment.map(equipment =>
    `<option value="${escapeHTML(equipment)}">${escapeHTML(equipment)}</option>`
  ).join('');
  refreshSearchableSelect(equipmentSelect);
}

function createSearchableSelect(select) {
  const wrapper = document.createElement('div');
  wrapper.className = 'searchable-select';
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.classList.add('searchable-select-native');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'searchable-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('div');
  menu.className = 'searchable-select-menu';
  menu.hidden = true;

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'searchable-select-search';
  search.placeholder = 'Pesquisar opções...';
  search.autocomplete = 'off';

  const options = document.createElement('div');
  options.className = 'searchable-select-options';
  options.setAttribute('role', 'listbox');
  menu.append(search, options);
  wrapper.append(trigger, menu);

  function renderOptions() {
    const query = search.value.trim().toLowerCase();
    const matchingOptions = [...select.options].filter(option =>
      option.textContent.toLowerCase().includes(query)
    );
    options.innerHTML = matchingOptions.length
      ? matchingOptions.map(option => `
          <button type="button" class="searchable-select-option${option.selected ? ' selected' : ''}" data-value="${escapeHTML(option.value)}">
            ${escapeHTML(option.textContent)}
          </button>
        `).join('')
      : '<span class="searchable-select-empty">Nenhuma opção encontrada.</span>';
  }

  function close() {
    wrapper.classList.remove('open');
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', () => {
    const isOpen = !menu.hidden;
    document.querySelectorAll('.searchable-select-menu').forEach(item => { item.hidden = true; });
    document.querySelectorAll('.searchable-select').forEach(item => { item.classList.remove('open'); });
    if (isOpen) {
      close();
      return;
    }
    search.value = '';
    renderOptions();
    wrapper.classList.add('open');
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.focus();
  });

  search.addEventListener('input', renderOptions);
  options.addEventListener('click', (event) => {
    const option = event.target.closest('.searchable-select-option');
    if (!option) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    updateTrigger();
  });

  select.addEventListener('change', updateTrigger);

  function updateTrigger() {
    const selected = select.options[select.selectedIndex];
    trigger.textContent = selected ? selected.textContent : 'Selecionar opção';
  }

  select._searchable = { renderOptions, updateTrigger };
  updateTrigger();
}

function refreshSearchableSelect(select) {
  if (select._searchable) {
    select._searchable.updateTrigger();
    select._searchable.renderOptions();
  }
}

function openModal(order = null) {
  orderForm.reset();
  populateClubSelect();
  populateSizeSelect();
  populateEquipmentSelect();
  refreshSearchableSelect(tipoSelect);
  refreshSearchableSelect(document.getElementById('f-equipamento'));
  customFields.hidden = true;
  patchFields.hidden = true;

  if (order) {
    document.getElementById('modal-title').textContent = 'Editar pedido';
    document.getElementById('order-id').value = order.id;
    document.getElementById('f-nome').value = order.nome;
    document.getElementById('f-telemovel').value = order.telemovel;
    if (![...tipoSelect.options].some(option => option.value === order.tipo)) {
      tipoSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(order.tipo)}">${escapeHTML(order.tipo)}</option>`);
    }
    document.getElementById('f-tipo').value = order.tipo;
    document.getElementById('f-clube').value = order.clube;
    const equipmentSelect = document.getElementById('f-equipamento');
    const orderEquipment = order.equipamento || settings.equipment[0] || 'Principal';
    if (!settings.equipment.includes(orderEquipment)) {
      equipmentSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(orderEquipment)}">${escapeHTML(orderEquipment)}</option>`);
    }
    equipmentSelect.value = orderEquipment;
    const sizeSelect = document.getElementById('f-tamanho');
    const orderSize = order.tamanho || settings.sizes[0] || 'M';
    if (!settings.sizes.includes(orderSize)) {
      sizeSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(orderSize)}">${escapeHTML(orderSize)}</option>`);
    }
    sizeSelect.value = orderSize;
    refreshSearchableSelect(tipoSelect);
    refreshSearchableSelect(document.getElementById('f-clube'));
    refreshSearchableSelect(equipmentSelect);
    refreshSearchableSelect(sizeSelect);
    document.getElementById('f-customizado').checked = !!order.customizado;
    document.getElementById('f-custom-nome').value = order.customNome || '';
    document.getElementById('f-custom-numero').value = order.customNumero || '';
    patchCheckbox.checked = !!order.patchado;
    document.getElementById('f-patch-nome').value = order.patchNome || '';
    document.getElementById('f-preco').value = order.preco;
    document.getElementById('f-pago').checked = !!order.pago;
    document.getElementById('f-entregue').checked = !!order.entregue;
    document.getElementById('f-obs').value = order.observacoes || '';
    customFields.hidden = !order.customizado;
    patchFields.hidden = !order.patchado;
    deleteBtn.hidden = false;
  } else {
    document.getElementById('modal-title').textContent = 'Novo pedido';
    document.getElementById('order-id').value = '';
    document.getElementById('f-telemovel').value = '910000000';
    document.getElementById('f-preco').value = settings.prices['T-shirt'];
    deleteBtn.hidden = true;
  }

  modalOverlay.hidden = false;
}

function closeModal() {
  modalOverlay.hidden = true;
}

document.getElementById('btn-add-note').addEventListener('click', () => openModal());
document.getElementById('btn-close-modal').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

customCheckbox.addEventListener('change', () => {
  customFields.hidden = !customCheckbox.checked;
  applyAutoPrice();
});

patchCheckbox.addEventListener('change', () => {
  patchFields.hidden = !patchCheckbox.checked;
  applyAutoPrice();
});

tipoSelect.addEventListener('change', applyAutoPrice);
document.getElementById('f-equipamento').addEventListener('change', applyAutoPrice);

function applyAutoPrice() {
  // only auto-fill for new orders (empty id) to avoid overriding manual edits unexpectedly
  if (document.getElementById('order-id').value) return;
  const base = settings.prices[tipoSelect.value] || 0;
  const equipmentPrice = isSpecialEquipment(document.getElementById('f-equipamento').value)
    ? (settings.prices.special || 0)
    : 0;
  const extra = customCheckbox.checked ? (settings.prices.custom || 0) : 0;
  const patchPrice = patchCheckbox.checked ? (settings.prices.patch || 0) : 0;
  precoInput.value = base + equipmentPrice + extra + patchPrice;
}

deleteBtn.addEventListener('click', () => {
  const id = document.getElementById('order-id').value;
  if (!id) return;
  if (!confirm('Eliminar este pedido?')) return;
  orders = orders.filter(o => o.id !== id);
  saveOrders(orders);
  closeModal();
  renderHome();
  renderOrdersList();
  showToast('Pedido eliminado');
});

orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('order-id').value;
  const isCustom = customCheckbox.checked;
  const hasPatch = patchCheckbox.checked;

  const orderData = {
    id: id || crypto.randomUUID(),
    nome: document.getElementById('f-nome').value.trim(),
    telemovel: document.getElementById('f-telemovel').value.trim(),
    tipo: tipoSelect.value,
    clube: document.getElementById('f-clube').value,
    equipamento: document.getElementById('f-equipamento').value,
    tamanho: document.getElementById('f-tamanho').value,
    customizado: isCustom,
    customNome: isCustom ? document.getElementById('f-custom-nome').value.trim() : '',
    customNumero: isCustom ? document.getElementById('f-custom-numero').value.trim() : '',
    patchado: hasPatch,
    patchNome: hasPatch ? document.getElementById('f-patch-nome').value.trim() : '',
    preco: Number(precoInput.value) || 0,
    custo: id
      ? (orders.find(o => o.id === id).custo ?? ((settings.costs[tipoSelect.value] || 0) + (isSpecialEquipment(document.getElementById('f-equipamento').value) ? (settings.costs.special || 0) : 0) + (isCustom ? (settings.costs.custom || 0) : 0) + (hasPatch ? (settings.costs.patch || 0) : 0)))
      : (settings.costs[tipoSelect.value] || 0) + (isSpecialEquipment(document.getElementById('f-equipamento').value) ? (settings.costs.special || 0) : 0) + (isCustom ? (settings.costs.custom || 0) : 0) + (hasPatch ? (settings.costs.patch || 0) : 0),
    pago: document.getElementById('f-pago').checked,
    entregue: document.getElementById('f-entregue').checked,
    observacoes: document.getElementById('f-obs').value.trim(),
    createdAt: id ? orders.find(o => o.id === id).createdAt : Date.now()
  };

  if (id) {
    orders = orders.map(o => o.id === id ? orderData : o);
  } else {
    orders.push(orderData);
  }
  saveOrders(orders);
  closeModal();
  renderHome();
  renderOrdersList();
  showToast(id ? 'Pedido atualizado' : 'Pedido adicionado');
});

// ==================== INIT ====================
createSearchableSelect(document.getElementById('f-tipo'));
createSearchableSelect(document.getElementById('f-clube'));
createSearchableSelect(document.getElementById('f-equipamento'));
createSearchableSelect(document.getElementById('f-tamanho'));
switchView('home');

// ==================== SERVICE WORKER (PWA) ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
