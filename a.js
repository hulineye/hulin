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
const businessTypeSelect = document.querySelector('select[name="businessType"]');
const typeSelect = document.querySelector('select[name="type"]');
const toBusinessLabel = document.getElementById('toBusinessLabel');
const toBusinessSelect = document.getElementById('toBusinessType');

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

// 控制转入业务板块显示
function toggleToBusiness() {
  const isExpense = typeSelect && typeSelect.value === '支出';
  if (toBusinessLabel) {
    toBusinessLabel.style.display = isExpense ? 'flex' : 'none';
  }
  if (toBusinessSelect) {
    toBusinessSelect.required = isExpense;
  }
  // 更新可选板块列表，排除当前选择的板块
  if (toBusinessSelect && isExpense) {
    const currentBusiness = businessTypeSelect ? businessTypeSelect.value : '主卡';
    const options = toBusinessSelect.querySelectorAll('option');
    options.forEach(opt => {
      if (opt.value === '' || opt.value === currentBusiness) {
        opt.style.display = '';
      } else {
        opt.style.display = '';
      }
    });
  }
}

if (businessTypeSelect) {
  businessTypeSelect.addEventListener('change', toggleToBusiness);
}
if (typeSelect) {
  typeSelect.addEventListener('change', toggleToBusiness);
}
toggleToBusiness(); // 初始化

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
    tableBody.innerHTML = '<tr><td colspan="13">暂无匹配记录</td></tr>';
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
    expenseUse: 'text',
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
        <td data-field="businessType" data-type="select">${item.businessType || '-'}</td>
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
  } else if (fieldName === 'businessType') {
    return `<select class="edit-input" style="font-size:14px;padding:6px;border:1px solid #2563eb;">
      <option value="主卡" ${escapedValue === '主卡' ? 'selected' : ''}>主卡</option>
      <option value="小贷业务" ${escapedValue === '小贷业务' ? 'selected' : ''}>小贷业务</option>
      <option value="汽车业务" ${escapedValue === '汽车业务' ? 'selected' : ''}>汽车业务</option>
      <option value="手机分期" ${escapedValue === '手机分期' ? 'selected' : ''}>手机分期</option>
    </select>`;
  } else if (fieldName === 'status') {
    return `<select class="edit-input" style="font-size:14px;padding:6px;border:1px solid #2563eb;">
      <option value="未对账" ${escapedValue === '未对账' ? 'selected' : ''}>未对账</option>
      <option value="已对账" ${escapedValue === '已对账' ? 'selected' : ''}>已对账</option>
    </select>`;
  } else if (fieldName === 'expenseUse') {
    return `<input type="text" class="edit-input" list="editExpenseUseList" value="${escapedValue}" />
    <datalist id="editExpenseUseList">
      <option value="银行放款">
      <option value="投资款">
      <option value="伙食费">
      <option value="房租">
      <option value="水电">
      <option value="招待费">
      <option value="办公用品">
      <option value="固定资产">
      <option value="其它费用">
    </datalist>`;
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
    businessType: data.businessType || '主卡',
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

    // 主卡转出时，自动在被转入板块生成收入记录
    if (record.businessType === '主卡' && record.type === '支出' && data.toBusinessType && data.toBusinessType !== '主卡') {
      const incomeRecord = {
        date: record.date,
        bankCard: record.toCardNumber || '',
        cardName: record.toCardName || '',
        toCardNumber: '',
        toCardName: '',
        cardUse: '从主卡转入',
        businessType: data.toBusinessType,
        expenseUse: '银行放款',
        type: '收入',
        amount: record.amount,
        currency: record.currency,
        status: '已对账',
        remark: `从主卡 ${record.bankCard} 转入`,
      };
      records.unshift(incomeRecord);
    }

    // 业务板块转回主卡时，自动在主卡生成收入记录
    if (record.businessType !== '主卡' && record.type === '支出' && data.toBusinessType === '主卡') {
      const incomeRecord = {
        date: record.date,
        bankCard: record.toCardNumber || record.bankCard || '',
        cardName: record.toCardName || record.cardName || '',
        toCardNumber: '',
        toCardName: '',
        cardUse: `${record.businessType}转入`,
        businessType: '主卡',
        expenseUse: '银行放款',
        type: '收入',
        amount: record.amount,
        currency: record.currency,
        status: '已对账',
        remark: `${record.businessType} ${record.bankCard} 转回主卡`,
      };
      records.unshift(incomeRecord);
    }
  }

  saveRecords();
  form.reset();
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  if (formCurrencySelect) {
    formCurrencySelect.value = 'CNY';
  }
  if (toBusinessSelect) {
    toBusinessSelect.value = '';
  }
  toggleToBusiness();
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

  const header = ['日期', '转账银行卡号码', '卡名称', '业务板块', '转入银行卡卡号', '卡收款人名称', '卡用途', '支出用途', '收支类型', '金额', '货币单位', '对账状态', '备注'];
  const rows = exportData.map((item) => [
    item.date || '',
    item.bankCard || '',
    item.cardName || '',
    item.businessType || '',
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

// 页面切换
const navItems = document.querySelectorAll('.nav-item');
const pages = {
  entry: document.getElementById('entryPage'),
  ledger: document.getElementById('ledgerPage'),
  reconcile: document.getElementById('reconcilePage'),
};

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');
    navItems.forEach((n) => n.classList.remove('active'));
    item.classList.add('active');
    Object.values(pages).forEach((p) => p && (p.style.display = 'none'));
    if (pages[page]) pages[page].style.display = 'block';
    if (page === 'ledger') renderLedger();
  });
});

// 台账明细渲染
function renderLedger() {
  // 按业务板块分组计算
  const businessTypes = ['主卡', '小贷业务', '汽车业务', '手机分期'];
  const businessGroups = {};
  businessTypes.forEach(type => {
    businessGroups[type] = {
      income: 0,
      expense: 0,
      cards: {},
      items: {},
    };
  });

  // 分类汇总
  records.forEach((item) => {
    const businessType = item.businessType || '主卡';
    if (!businessGroups[businessType]) {
      businessGroups[businessType] = { income: 0, expense: 0, cards: {}, items: {} };
    }

    const amount = Number(item.amount || 0);
    const bankCard = item.bankCard || '未填写';

    if (!businessGroups[businessType].cards[bankCard]) {
      businessGroups[businessType].cards[bankCard] = { income: 0, expense: 0 };
    }

    if (item.type === '收入') {
      businessGroups[businessType].income += amount;
      businessGroups[businessType].cards[bankCard].income += amount;
    } else {
      businessGroups[businessType].expense += amount;
      businessGroups[businessType].cards[bankCard].expense += amount;

      const expenseUse = item.expenseUse || '其它费用';
      if (!businessGroups[businessType].items[expenseUse]) {
        businessGroups[businessType].items[expenseUse] = 0;
      }
      businessGroups[businessType].items[expenseUse] += amount;
    }
  });

  // 渲染统计表格
  const summaryContainer = document.getElementById('ledgerSummary');
  if (summaryContainer) {
    // 计算各板块数据
    const mainGroup = businessGroups['主卡'];
    const xdGroup = businessGroups['小贷业务'];
    const qcGroup = businessGroups['汽车业务'];
    const sjGroup = businessGroups['手机分期'];

    // 主卡：实际转出投资款 = 转给小贷+汽车+手机分期的总金额
    const mainTransferOut = records
      .filter(r => r.businessType === '主卡' && r.type === '支出' && ['小贷业务', '汽车业务', '手机分期'].includes(r.toBusinessType))
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const mainActualIncome = mainGroup.income - mainTransferOut;
    const mainActualBalance = mainActualIncome - mainGroup.expense;

    // 各板块实际投资款 = 收到的主卡转入 - 转回主卡的支出
    const calcActual = (group, type) => {
      const incomeFromMain = records
        .filter(r => r.businessType === type && r.type === '收入' && r.expenseUse === '银行放款')
        .reduce((s, r) => s + Number(r.amount || 0), 0);
      const transferToMain = records
        .filter(r => r.businessType === type && r.type === '支出' && r.toBusinessType === '主卡')
        .reduce((s, r) => s + Number(r.amount || 0), 0);
      const actualInvest = incomeFromMain - transferToMain;
      const actualBalance = actualInvest - group.expense;
      return { actualInvest, actualBalance };
    };

    const xd = calcActual(xdGroup, '小贷业务');
    const qc = calcActual(qcGroup, '汽车业务');
    const sj = calcActual(sjGroup, '手机分期');

    summaryContainer.innerHTML = `
      <div class="ledger-table-container">
        <table class="ledger-table">
          <thead>
            <tr>
              <th style="width:140px;"></th>
              <th class="col-main">主卡</th>
              <th class="col-xd">小贷业务</th>
              <th class="col-qc">汽车业务</th>
              <th class="col-sj">手机分期业务</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-label">收入</td>
              <td class="col-main number income">${formatCurrency(mainGroup.income)}</td>
              <td class="col-xd number income">${formatCurrency(xdGroup.income)}</td>
              <td class="col-qc number income">${formatCurrency(qcGroup.income)}</td>
              <td class="col-sj number income">${formatCurrency(sjGroup.income)}</td>
            </tr>
            <tr>
              <td class="row-label">支出</td>
              <td class="col-main number expense">${formatCurrency(mainGroup.expense)}</td>
              <td class="col-xd number expense">${formatCurrency(xdGroup.expense)}</td>
              <td class="col-qc number expense">${formatCurrency(qcGroup.expense)}</td>
              <td class="col-sj number expense">${formatCurrency(sjGroup.expense)}</td>
            </tr>
            <tr>
              <td class="row-label">结余</td>
              <td class="col-main number balance">${formatCurrency(mainGroup.income - mainGroup.expense)}</td>
              <td class="col-xd number balance">${formatCurrency(xdGroup.income - xdGroup.expense)}</td>
              <td class="col-qc number balance">${formatCurrency(qcGroup.income - qcGroup.expense)}</td>
              <td class="col-sj number balance">${formatCurrency(sjGroup.income - sjGroup.expense)}</td>
            </tr>
            <tr style="height:20px;"><td colspan="5"></td></tr>
            <tr>
              <td class="row-label">实际收入</td>
              <td class="col-main number income">${formatCurrency(mainActualIncome)}</td>
              <td class="col-xd number income">${formatCurrency(xd.actualInvest)}</td>
              <td class="col-qc number income">${formatCurrency(qc.actualInvest)}</td>
              <td class="col-sj number income">${formatCurrency(sj.actualInvest)}</td>
            </tr>
            <tr>
              <td class="row-label">实际转出投资款</td>
              <td class="col-main number expense">${formatCurrency(mainTransferOut)}</td>
              <td class="col-xd">-</td>
              <td class="col-qc">-</td>
              <td class="col-sj">-</td>
            </tr>
            <tr>
              <td class="row-label">实际转入投资款</td>
              <td class="col-main">-</td>
              <td class="col-xd number income">${formatCurrency(xd.actualInvest)}</td>
              <td class="col-qc number income">${formatCurrency(qc.actualInvest)}</td>
              <td class="col-sj number income">${formatCurrency(sj.actualInvest)}</td>
            </tr>
            <tr>
              <td class="row-label">实际余额</td>
              <td class="col-main number balance">${formatCurrency(mainActualBalance)}</td>
              <td class="col-xd number balance">${formatCurrency(xd.actualBalance)}</td>
              <td class="col-qc number balance">${formatCurrency(qc.actualBalance)}</td>
              <td class="col-sj number balance">${formatCurrency(sj.actualBalance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const container = document.getElementById('ledgerDetails');
  if (!container) return;

  // 各板块银行卡明细
  let html = '';
  ['主卡', '小贷业务', '汽车业务', '手机分期'].forEach(type => {
    const group = businessGroups[type];
    if (Object.keys(group.cards).length === 0) return;

    const borderColor = type === '主卡' ? '#dc2626' : type === '小贷业务' ? '#2563eb' : type === '汽车业务' ? '#16a34a' : '#ca8a04';
    html += `
      <div class="ledger-card" style="border-left: 4px solid ${borderColor}; margin-top:16px;">
        <div class="ledger-card-header">${type} - 银行卡明细</div>
        ${Object.entries(group.cards).map(([card, data]) => `
          <div class="ledger-item">
            <span class="ledger-item-label">${card}</span>
            <span>
              <span class="ledger-item-value income">收 ${formatCurrency(data.income)}</span>
              <span style="margin: 0 6px; color: #ccc;">|</span>
              <span class="ledger-item-value expense">支 ${formatCurrency(data.expense)}</span>
            </span>
          </div>
        `).join('')}
      </div>
    `;
  });

  container.innerHTML = html || '<div style="padding:20px; color:#666;">暂无明细记录</div>';
}

render();
