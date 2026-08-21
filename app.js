// ==================== STORAGE ====================
const STORAGE_ORDERS = 'pedidos_kit_orders_v1';
const STORAGE_SETTINGS = 'pedidos_kit_settings_v1';

const DEFAULT_CLUBS = [
  'Seleção de Portugal', 'Benfica', 'FC Porto', 'Sporting CP',
  'Real Madrid', 'FC Barcelona', 'Seleção do Brasil', 'Seleção de Argentina',
  'Manchester City', 'Manchester United'
];

const DEFAULT_SETTINGS = {
  clubs: DEFAULT_CLUBS,
  prices: { 'T-shirt': 15, 'Camisola': 25, 'Kit': 45, custom: 5 }
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
    s.prices = { ...DEFAULT_SETTINGS.prices, ...(s.prices || {}) };
    return s;
  } catch { return structuredClone(DEFAULT_SETTINGS); }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

let orders = loadOrders();
let settings = loadSettings();
let currentFilter = 'all';
let currentSearch = '';

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
    || (order.telemovel || '').toLowerCase().includes(t)
    || (order.tipo || '').toLowerCase().includes(t);
}

function orderCardHTML(order) {
  const badges = statusInfo(order).map(b => `<span class="badge ${b.cls}">${b.text}</span>`).join('');
  const customLine = order.customizado
    ? ` · ${order.customNome || ''}${order.customNumero ? ' #' + order.customNumero : ''}`
    : '';
  const tamanhoLine = order.tamanho ? ` · Tam. ${escapeHTML(order.tamanho)}` : '';
  return `
    <div class="order-card" data-id="${order.id}">
      <div class="order-card-top">
        <div>
          <div class="order-card-title">${escapeHTML(order.nome)}</div>
          <div class="order-card-sub">${escapeHTML(order.tipo)} · ${escapeHTML(order.clube)}${tamanhoLine}${customLine}</div>
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
  document.getElementById('price-tshirt').value = settings.prices['T-shirt'];
  document.getElementById('price-camisola').value = settings.prices['Camisola'];
  document.getElementById('price-kit').value = settings.prices['Kit'];
  document.getElementById('price-custom').value = settings.prices.custom;

  const clubsList = document.getElementById('clubs-list');
  clubsList.innerHTML = settings.clubs.map(club => `
    <li data-club="${escapeHTML(club)}">
      ${escapeHTML(club)} <button aria-label="Remover">✕</button>
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

['price-tshirt', 'price-camisola', 'price-kit', 'price-custom'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    settings.prices['T-shirt'] = Number(document.getElementById('price-tshirt').value) || 0;
    settings.prices['Camisola'] = Number(document.getElementById('price-camisola').value) || 0;
    settings.prices['Kit'] = Number(document.getElementById('price-kit').value) || 0;
    settings.prices.custom = Number(document.getElementById('price-custom').value) || 0;
    saveSettings(settings);
    showToast('Preços atualizados');
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
const deleteBtn = document.getElementById('btn-delete-order');
const tipoSelect = document.getElementById('f-tipo');
const precoInput = document.getElementById('f-preco');

function populateClubSelect() {
  const clubeSelect = document.getElementById('f-clube');
  clubeSelect.innerHTML = settings.clubs.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
}

function openModal(order = null) {
  orderForm.reset();
  populateClubSelect();
  customFields.hidden = true;

  if (order) {
    document.getElementById('modal-title').textContent = 'Editar pedido';
    document.getElementById('order-id').value = order.id;
    document.getElementById('f-nome').value = order.nome;
    document.getElementById('f-telemovel').value = order.telemovel;
    document.getElementById('f-tipo').value = order.tipo;
    document.getElementById('f-clube').value = order.clube;
    document.getElementById('f-tamanho').value = order.tamanho || 'M';
    document.getElementById('f-customizado').checked = !!order.customizado;
    document.getElementById('f-custom-nome').value = order.customNome || '';
    document.getElementById('f-custom-numero').value = order.customNumero || '';
    document.getElementById('f-preco').value = order.preco;
    document.getElementById('f-pago').checked = !!order.pago;
    document.getElementById('f-entregue').checked = !!order.entregue;
    document.getElementById('f-obs').value = order.observacoes || '';
    customFields.hidden = !order.customizado;
    deleteBtn.hidden = false;
  } else {
    document.getElementById('modal-title').textContent = 'Novo pedido';
    document.getElementById('order-id').value = '';
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

tipoSelect.addEventListener('change', applyAutoPrice);

function applyAutoPrice() {
  // only auto-fill for new orders (empty id) to avoid overriding manual edits unexpectedly
  if (document.getElementById('order-id').value) return;
  const base = settings.prices[tipoSelect.value] || 0;
  const extra = customCheckbox.checked ? (settings.prices.custom || 0) : 0;
  precoInput.value = base + extra;
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

  const orderData = {
    id: id || crypto.randomUUID(),
    nome: document.getElementById('f-nome').value.trim(),
    telemovel: document.getElementById('f-telemovel').value.trim(),
    tipo: tipoSelect.value,
    clube: document.getElementById('f-clube').value,
    tamanho: document.getElementById('f-tamanho').value,
    customizado: isCustom,
    customNome: isCustom ? document.getElementById('f-custom-nome').value.trim() : '',
    customNumero: isCustom ? document.getElementById('f-custom-numero').value.trim() : '',
    preco: Number(precoInput.value) || 0,
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
switchView('home');

// ==================== SERVICE WORKER (PWA) ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
