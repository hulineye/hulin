const form = document.getElementById('recordForm');
const tableBody = document.getElementById('recordsBody');
const summary = document.getElementById('summary');
const stats = document.getElementById('stats');
const reports = document.getElementById('reports');
const storageKey = 'smallLoanFinanceRecords';
const currencyKey = 'financeCurrency';
let currentCurrency = localStorage.getItem(currencyKey) || 'CNY';
const dateInput = document.querySelector('input[name="date"]');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const cardNameFilterInput = document.getElementById('cardNameFilter');
const statusFilterInput = document.getElementById('statusFilter');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const currencySelect = document.getElementById('currencySelect');
const formCurrencySelect = document.getElementById('formCurrencySelect');
const loginPage = document.getElementById('loginPage');
const loginForm = document.getElementById('loginForm');
const loginNameInput = document.getElementById('loginName');
const generateLinkForm = document.getElementById('generateLinkForm');
const linkNameInput = document.getElementById('linkName');
const shareLinkOutput = document.getElementById('shareLinkOutput');
const linksList = document.getElementById('linksList');
const loginMessage = document.getElementById('loginMessage');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const authStorageKey = 'financeLoginLinks';
const currentUserKey = 'financeLoggedInUser';

let currentUser = null;
let records = JSON.parse(localStorage.getItem(storageKey) || '[]');
let currentFilter = {
  startDate: '',
  endDate: '',
  cardName: '',
  status: '',
};
let editingId = null;

function getStoredLoginLinks() {
  return JSON.parse(localStorage.getItem(authStorageKey) || '[]');
}

function saveStoredLoginLinks(links) {
  localStorage.setItem(authStorageKey, JSON.stringify(links));
}

function createToken(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatShareLink(user, token) {
  const baseUrl = location.href.split('?')[0];
  return `${baseUrl}?user=${encodeURIComponent(user)}&auth=${encodeURIComponent(token)}`;
}

function renderLoginLinks() {
  const links = getStoredLoginLinks();
  if (!links.length) {
    linksList.innerHTML = '<div class="link-card">当前没有可用登录链接。</div>';
    return;
  }
  linksList.innerHTML = links
    .map(
      (item) => `
      <div class="link-card">
        <div>
          <span>${item.user}</span>
          <button type="button" data-delete-token="${item.token}">删除链接</button>
        </div>
        <div>${formatShareLink(item.user, item.token)}</div>
      </div>
    `
    )
    .join('');
}

function showLoginMessage(text, isError = true) {
  if (!loginMessage) return;
  loginMessage.textContent = text || '';
  loginMessage.style.color = isError ? '#dc2626' : '#166534';
}

function showApp() {
  if (loginPage) loginPage.style.display = 'none';
  const app = document.querySelector('.app');
  if (app) app.style.display = 'flex';
  if (userNameDisplay) userNameDisplay.textContent = currentUser || '未知用户';
  if (logoutBtn) logoutBtn.style.display = 'inline-flex';
}

function showLogin() {
  if (loginPage) loginPage.style.display = 'flex';
  const app = document.querySelector('.app');
  if (app) app.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'none';
}

function loginAs(user) {
  currentUser = user;
  localStorage.setItem(currentUserKey, user);
  showApp();
  showLoginMessage('', false);
}

function validateLoginFromUrl() {
  const params = new URLSearchParams(location.search);
  const user = params.get('user');
  const token = params.get('auth');
  if (!user || !token) return false;
  const validLink = getStoredLoginLinks().find((item) => item.user === user && item.token === token);
  if (validLink) {
    loginAs(user);
    history.replaceState(null, '', location.pathname);
    return true;
  }
  showLoginMessage('无效登录链接，请重新生成或手动登录。');
  return false;
}

function initAuth() {
  renderLoginLinks();
  if (validateLoginFromUrl()) return;
  const remembered = localStorage.getItem(currentUserKey);
  if (remembered) {
    loginAs(remembered);
  } else {
    showLogin();
  }
}

if (dateInput) {
  dateInput.value = new Date().toISOString().slice(0, 10);
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = loginNameInput?.value.trim();
    if (!name) {
      showLoginMessage('请输入姓名登录。');
      return;
    }
    loginAs(name);
  });
}

if (generateLinkForm) {
  generateLinkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = linkNameInput?.value.trim();
    if (!name) {
      showLoginMessage('请输入姓名来生成登录链接。');
      return;
    }
    const links = getStoredLoginLinks();
    const token = createToken(12);
    links.unshift({ user: name, token, createdAt: new Date().toISOString() });
    saveStoredLoginLinks(links.slice(0, 20));
    renderLoginLinks();
    const link = formatShareLink(name, token);
    if (shareLinkOutput) shareLinkOutput.value = link;
    showLoginMessage('已生成登录链接，复制后发送给其他财务人员。', false);
  });
}

if (linksList) {
  linksList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('button[data-delete-token]');
    if (!deleteButton) return;
    const token = deleteButton.getAttribute('data-delete-token');
    if (!token) return;
    const links = getStoredLoginLinks().filter((item) => item.token !== token);
    saveStoredLoginLinks(links);
    renderLoginLinks();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem(currentUserKey);
    showLogin();
  });
}

initAuth();

// 初始化货币选择
if (currencySelect) {
  currencySelect.value = currentCurrency;
  updateCurrencyLabel();
  currencySelect.addEventListener('change', () => {
    currentCurrency = currencySelect.value;
    localStorage.setItem(currencyKey, currentCurrency);
    updateCurrencyLabel();
    render();
  });
}

function updateCurrencyLabel() {
  const label = document.getElementById('currencyLabel');
  if (label) {
    label.textContent = currentCurrency === 'USD' ? '$' : '¥';
  }
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function getFilteredRecords() {
  const keyword = currentFilter.cardName.trim().toLowerCase();

  return records.filter((item) => {
    const date = item.date || '';
    const matchesStart = !currentFilter.startDate || date >= currentFilter.startDate;
    const matchesEnd = !currentFilter.endDate || date <= currentFilter.endDate;
    const matchesCard = !keyword || (item.cardName || '').toLowerCase().includes(keyword);
    const matchesStatus = !currentFilter.status || (item.status || '未对账') === currentFilter.status;
    return matchesStart && matchesEnd && matchesCard && matchesStatus;
  });
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2);
}

function formatCurrency(value, currency = 'CNY') {
  const amount = Number(value || 0).toFixed(2);
  return currency === 'USD' ? `$${amount}` : `¥${amount}`;
}

function renderStats() {
  const visibleRecords = getFilteredRecords();
  const income = visibleRecords
    .filter((item) => item.type === '收入')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = visibleRecords
    .filter((item) => item.type === '支出')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = income - expense;
  const checkedCount = visibleRecords.filter((item) => item.status === '已对账').length;
  const pendingCount = visibleRecords.filter((item) => item.status !== '已对账').length;
  const cardCounts = visibleRecords.reduce((map, item) => {
    const name = item.cardName || '未命名';
    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});
  const topCards = Object.entries(cardCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name}(${count})`)
    .join(' / ');

  stats.innerHTML = `
    <div><strong>${visibleRecords.length}</strong> 条当前筛选结果</div>
    <div><strong>${records.length}</strong> 条总记录</div>
    <div>收入：${formatCurrency(income)} | 支出：${formatCurrency(expense)} | 结余：${formatCurrency(balance)}</div>
    <div>对账：${checkedCount} | 未对账：${pendingCount}</div>
    <div>常用卡名称：${topCards || '暂无'}</div>
  `;
}

function renderReports() {
  const visibleRecords = getFilteredRecords();
  const typeSummary = ['收入', '支出'].map((type) => {
    const total = visibleRecords
      .filter((item) => item.type === type)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `${type}：${formatCurrency(total)}`;
  });

  const cardSummary = Object.entries(
    visibleRecords.reduce((map, item) => {
      const name = item.cardName || '未命名';
      map[name] = (map[name] || 0) + Number(item.amount || 0);
      return map;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, total]) => `<li>${name}：${formatCurrency(total)}</li>`)
    .join('');

  const dateSummary = Object.entries(
    visibleRecords.reduce((map, item) => {
      const date = item.date || '未填写';
      map[date] = (map[date] || 0) + Number(item.amount || 0);
      return map;
    }, {})
  )
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .map(([date, total]) => `<li>${date}：${formatCurrency(total)}</li>`)
    .join('');

  reports.innerHTML = `
    <div class="report-card">
      <h3>按收支类型</h3>
      <ul>
        <li>${typeSummary[0]}</li>
        <li>${typeSummary[1]}</li>
      </ul>
    </div>
    <div class="report-card">
      <h3>按卡名称汇总</h3>
      <ul>${cardSummary || '<li>暂无</li>'}</ul>
    </div>
    <div class="report-card">
      <h3>按日期汇总</h3>
      <ul>${dateSummary || '<li>暂无</li>'}</ul>
    </div>
  `;
}

function render() {
  const visibleRecords = getFilteredRecords();
  summary.textContent = `共 ${visibleRecords.length} 条记录（总计 ${records.length} 条）`;

  if (!visibleRecords.length) {
    tableBody.innerHTML = '<tr><td colspan="12">暂无匹配记录</td></tr>';
    renderStats();
    renderReports();
    return;
  }

  const fieldTypes = {
    date: 'date',
    cardName: 'text',
    bankCard: 'text',
    toCardNumber: 'text',
    toCardName: 'text',
    cardUse: 'text',
    expenseUse: 'select',
    type: 'select',
    amount: 'number',
    status: 'select',
    remark: 'text',
  };

  tableBody.innerHTML = visibleRecords
    .map((item) => {
      const recordIndex = records.indexOf(item);
      return `
      <tr data-record-index="${recordIndex}">
        <td data-field="date" data-type="date">${item.date || '-'}</td>
        <td data-field="bankCard" data-type="text">${item.bankCard || '-'}</td>
        <td data-field="cardName" data-type="text">${item.cardName || '-'}</td>
        <td data-field="toCardNumber" data-type="text">${item.toCardNumber || '-'}</td>
        <td data-field="toCardName" data-type="text">${item.toCardName || '-'}</td>
        <td data-field="cardUse" data-type="text">${item.cardUse || '-'}</td>
        <td data-field="expenseUse" data-type="text">${item.expenseUse || '-'}</td>
        <td data-field="type" data-type="select">${item.type || '-'}</td>
        <td data-field="amount" data-type="number">${formatCurrency(item.amount, item.currency)}</td>
        <td data-field="status" data-type="select" class="status-cell"><span class="status-badge ${item.status === '已对账' ? 'done' : 'pending'}">${item.status || '未对账'}</span></td>
        <td data-field="remark" data-type="text">${item.remark || '-'}</td>
        <td>
          <div class="action-cell">
            <button class="delete-btn" type="button" data-delete-index="${recordIndex}">删除</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  renderStats();
  renderReports();
  attachCellEditListeners();
}

function createEditControl(fieldName, value) {
  const escapedValue = String(value || '');
  if (fieldName === 'date') {
    return `<input type="date" class="edit-input" value="${escapedValue}" />`;
  } else if (fieldName === 'amount') {
    return `<input type="number" class="edit-input" step="0.01" min="0" value="${escapedValue}" />`;
  } else if (fieldName === 'type') {
    return `<select class="edit-input" style="font-size:14px;padding:6px;border:1px solid #2563eb;">
      <option value="收入" ${escapedValue === '收入' ? 'selected' : ''}>收入</option>
      <option value="支出" ${escapedValue === '支出' ? 'selected' : ''}>支出</option>
    </select>`;
  } else if (fieldName === 'status') {
    return `<select class="edit-input" style="font-size:14px;padding:6px;border:1px solid #2563eb;">
      <option value="未对账" ${escapedValue === '未对账' ? 'selected' : ''}>未对账</option>
      <option value="已对账" ${escapedValue === '已对账' ? 'selected' : ''}>已对账</option>
    </select>`;
  } else if (fieldName === 'expenseUse') {
    return `<select class="edit-input" style="font-size:14px;padding:6px;border:1px solid #2563eb;">
      <option value=""></option>
      <option value="投资款" ${escapedValue === '投资款' ? 'selected' : ''}>投资款</option>
      <option value="伙食费" ${escapedValue === '伙食费' ? 'selected' : ''}>伙食费</option>
      <option value="房租" ${escapedValue === '房租' ? 'selected' : ''}>房租</option>
      <option value="水电" ${escapedValue === '水电' ? 'selected' : ''}>水电</option>
      <option value="招待费" ${escapedValue === '招待费' ? 'selected' : ''}>招待费</option>
      <option value="办公用品" ${escapedValue === '办公用品' ? 'selected' : ''}>办公用品</option>
      <option value="固定资产" ${escapedValue === '固定资产' ? 'selected' : ''}>固定资产</option>
      <option value="其它费用" ${escapedValue === '其它费用' ? 'selected' : ''}>其它费用</option>
    </select>`;
  } else {
    return `<input type="text" class="edit-input" value="${escapedValue}" />`;
  }
}

function attachCellEditListeners() {
  const cells = tableBody.querySelectorAll('td[data-field]');
  cells.forEach((cell) => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('dblclick', (event) => {
      if (cell.querySelector('.edit-input')) return;
      const fieldName = cell.getAttribute('data-field');
      const recordIndex = parseInt(cell.closest('tr').getAttribute('data-record-index'), 10);
      const record = records[recordIndex];
      if (!record) return;
      const currentValue = record[fieldName] ?? '';
      const html = createEditControl(fieldName, currentValue);
      cell.innerHTML = html;
      const input = cell.querySelector('.edit-input');
      if (input) {
        input.focus();
        if (input.type === 'text') input.select();
        const saveCellEdit = () => {
          const newValue = input.value.trim();
          if (fieldName === 'amount') {
            record[fieldName] = Number(newValue || 0);
          } else {
            record[fieldName] = newValue || '';
          }
          saveRecords();
          render();
        };
        input.addEventListener('blur', saveCellEdit);
        input.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter') saveCellEdit();
          if (evt.key === 'Escape') render();
        });
      }
    });
  });
}

function fillForm(item) {
  const entries = Object.entries(form.elements);
  entries.forEach(([key, element]) => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) return;
    if (element.name) {
      element.value = item[element.name] ?? '';
    }
  });
  if (dateInput) {
    dateInput.value = item.date || new Date().toISOString().slice(0, 10);
  }
  if (formCurrencySelect) {
    formCurrencySelect.value = item.currency || 'CNY';
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const record = {
    date: data.date,
    bankCard: data.bankCard,
    cardName: data.cardName,
    toCardNumber: data.toCardNumber,
    toCardName: data.toCardName,
    cardUse: data.cardUse,
    expenseUse: data.expenseUse,
    type: data.type,
    amount: Number(data.amount || 0),
    currency: data.currency || 'CNY',
    status: data.status || '未对账',
    remark: data.remark || '',
  };

  if (editingId !== null) {
    records[editingId] = record;
    editingId = null;
  } else {
    records.unshift(record);
  }

  saveRecords();
  form.reset();
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  if (formCurrencySelect) {
    formCurrencySelect.value = 'CNY';
  }
  submitBtn.textContent = '新增记录';
  cancelEditBtn.style.display = 'none';
  render();
});

filterBtn.addEventListener('click', () => {
  currentFilter = {
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    cardName: cardNameFilterInput.value,
    status: statusFilterInput.value,
  };
  render();
});

resetBtn.addEventListener('click', () => {
  currentFilter = { startDate: '', endDate: '', cardName: '', status: '' };
  startDateInput.value = '';
  endDateInput.value = '';
  cardNameFilterInput.value = '';
  statusFilterInput.value = '';
  render();
});

clearBtn.addEventListener('click', () => {
  if (!records.length) {
    alert('当前没有可清空的记录');
    return;
  }
  if (confirm('确定要清空全部记录吗？')) {
    records = [];
    saveRecords();
    render();
  }
});

exportBtn.addEventListener('click', () => {
  const exportData = getFilteredRecords();
  if (!exportData.length) {
    alert('当前没有可导出的记录');
    return;
  }

  const header = ['日期', '转账银行卡号码', '卡名称', '转入银行卡卡号', '卡收款人名称', '卡用途', '支出用途', '收支类型', '金额', '货币单位', '对账状态', '备注'];
  const rows = exportData.map((item) => [
    item.date || '',
    item.bankCard || '',
    item.cardName || '',
    item.toCardNumber || '',
    item.toCardName || '',
    item.cardUse || '',
    item.expenseUse || '',
    item.type || '',
    formatAmount(item.amount),
    item.currency === 'USD' ? '美元' : '人民币',
    item.status || '未对账',
    item.remark || '',
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '小贷财务记录.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

tableBody.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('button[data-delete-index]');
  if (!deleteButton) return;

  const index = Number(deleteButton.getAttribute('data-delete-index'));
  if (confirm('确定要删除这条记录吗？')) {
    records.splice(index, 1);
    saveRecords();
    render();
  }
});

render();
