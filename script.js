// ── DATA STORE ────────────────────────────────────────────────────
let accounts = JSON.parse(localStorage.getItem('novapay_accounts') || '[]');
let transactions = JSON.parse(localStorage.getItem('novapay_txns') || '[]');

function saveData() {
  localStorage.setItem('novapay_accounts', JSON.stringify(accounts));
  localStorage.setItem('novapay_txns', JSON.stringify(transactions));
}

// ── UTILS ─────────────────────────────────────────────────────────
function getDate() {
  return new Date().toLocaleString('en-IN', { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function toast(msg, type='info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}
function showResult(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg; el.className = `result-box ${type} show`;
  setTimeout(() => el.classList.remove('show'), 4500);
}

// ── NAVIGATION ────────────────────────────────────────────────────
const pageTitles = { dashboard:'Dashboard', accounts:'All Accounts', create:'Create Account', deposit:'Deposit Funds', withdraw:'Withdraw Funds', search:'Search Account', transactions:'Transaction Log' };
function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.closest('.nav-item') ? el.classList.add('active') : el.classList.add('active');
  document.getElementById('topbarTitle').textContent = pageTitles[page] || page;
  if (page === 'dashboard') refreshDashboard();
  if (page === 'accounts') renderAccountsTable();
  if (page === 'transactions') renderAllTxn();
  if (page === 'deposit') renderRecentDeposits();
  if (page === 'withdraw') renderRecentWithdrawals();
}

// ── TOPBAR DATE ───────────────────────────────────────────────────
function updateDate() {
  document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
}
updateDate();

// ── CREATE ACCOUNT ────────────────────────────────────────────────
function createAccount() {
  const accNo = parseInt(document.getElementById('c-accno').value);
  const name = document.getElementById('c-name').value.trim();
  const balance = parseFloat(document.getElementById('c-balance').value);
  if (!accNo || accNo <= 0) { showResult('create-result','⚠️ Account number must be a positive integer.','error'); return; }
  if (accounts.find(a => a.accNo === accNo)) { showResult('create-result',`⚠️ Account ${accNo} already exists.`,'error'); return; }
  if (!name) { showResult('create-result','⚠️ Please enter the account holder name.','error'); return; }
  if (!balance || balance < 500) { showResult('create-result','⚠️ Minimum initial deposit is ₹500.','error'); return; }
  accounts.push({ accNo, name, balance });
  logTxn(accNo, 'DEPOSIT', balance);
  saveData();
  showResult('create-result', `✅ Account ${accNo} created for ${name} with balance ${fmt(balance)}.`, 'success');
  toast(`Account ${accNo} created successfully!`, 'success');
  clearCreate();
}
function clearCreate() {
  ['c-accno','c-name','c-balance'].forEach(id => document.getElementById(id).value = '');
}

// ── DEPOSIT ───────────────────────────────────────────────────────
function deposit() {
  const accNo = parseInt(document.getElementById('d-accno').value);
  const amount = parseFloat(document.getElementById('d-amount').value);
  const acc = accounts.find(a => a.accNo === accNo);
  if (!acc) { showResult('deposit-result','⚠️ Account not found.','error'); return; }
  if (!amount || amount <= 0) { showResult('deposit-result','⚠️ Amount must be positive.','error'); return; }
  acc.balance += amount;
  logTxn(accNo, 'DEPOSIT', amount);
  saveData();
  showResult('deposit-result', `✅ Deposited ${fmt(amount)} to account ${accNo}. New balance: ${fmt(acc.balance)}`, 'success');
  toast(`Deposited ${fmt(amount)} to Acc #${accNo}`, 'success');
  document.getElementById('d-amount').value = '';
  previewAccount('d-accno','d-preview');
  renderRecentDeposits();
}

// ── WITHDRAW ──────────────────────────────────────────────────────
function withdraw() {
  const accNo = parseInt(document.getElementById('w-accno').value);
  const amount = parseFloat(document.getElementById('w-amount').value);
  const acc = accounts.find(a => a.accNo === accNo);
  if (!acc) { showResult('withdraw-result','⚠️ Account not found.','error'); return; }
  if (!amount || amount <= 0) { showResult('withdraw-result','⚠️ Amount must be positive.','error'); return; }
  if (acc.balance - amount < 0) { showResult('withdraw-result',`⚠️ Insufficient balance. Available: ${fmt(acc.balance)}`,'error'); return; }
  acc.balance -= amount;
  logTxn(accNo, 'WITHDRAW', amount);
  saveData();
  showResult('withdraw-result', `✅ Withdrawn ${fmt(amount)} from account ${accNo}. New balance: ${fmt(acc.balance)}`, 'success');
  toast(`Withdrew ${fmt(amount)} from Acc #${accNo}`, 'success');
  document.getElementById('w-amount').value = '';
  previewAccount('w-accno','w-preview');
  renderRecentWithdrawals();
}

// ── SEARCH ────────────────────────────────────────────────────────
function searchAccount() {
  const accNo = parseInt(document.getElementById('s-accno').value);
  const acc = accounts.find(a => a.accNo === accNo);
  const detail = document.getElementById('search-detail');
  if (!acc) {
    showResult('search-result', `⚠️ No account found with Acc No ${accNo}.`, 'error');
    detail.style.display = 'none'; return;
  }
  showResult('search-result', `✅ Account found!`, 'success');
  const txns = transactions.filter(t => t.accNo === accNo);
  detail.style.display = 'block';
  detail.innerHTML = `
    <div class="account-detail">
      <div class="ad-label">Account Holder</div>
      <div class="ad-name">${acc.name}</div>
      <div class="ad-row">
        <div class="ad-field"><div class="f-label">Account No</div><div class="f-val">#${acc.accNo}</div></div>
        <div class="ad-field"><div class="f-label">Balance</div><div class="f-val">${fmt(acc.balance)}</div></div>
        <div class="ad-field"><div class="f-label">Transactions</div><div class="f-val">${txns.length}</div></div>
      </div>
    </div>`;
}

// ── TRANSACTIONS ──────────────────────────────────────────────────
function logTxn(accNo, type, amount) {
  transactions.push({ accNo, type, amount, date: getDate() });
  saveData();
}
function viewLastTransactions() {
  const accNo = parseInt(document.getElementById('t-accno').value);
  const acc = accounts.find(a => a.accNo === accNo);
  const box = document.getElementById('txn-result');
  const list = document.getElementById('txn-list');
  if (!acc) { showResult('txn-result','⚠️ Account not found.','error'); list.innerHTML = ''; return; }
  const txns = transactions.filter(t => t.accNo === accNo);
  if (!txns.length) { showResult('txn-result',`ℹ️ No transactions for account ${accNo}.`,'info'); list.innerHTML = '<div class="empty-state"><div class="e-icon">📭</div><p>No transactions.</p></div>'; return; }
  const last5 = txns.slice(-5).reverse();
  box.style.display = 'none';
  list.innerHTML = `<table>
    <thead><tr><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
    <tbody>${last5.map(t => `<tr>
      <td><span class="badge badge-${t.type.toLowerCase()}">${t.type}</span></td>
      <td class="amount-${t.type.toLowerCase()}">${t.type==='DEPOSIT'?'+':'-'}${fmt(t.amount)}</td>
      <td style="color:var(--slate-400);font-size:0.82rem">${t.date}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// ── PREVIEW ACCOUNT ───────────────────────────────────────────────
function previewAccount(inputId, previewId) {
  const accNo = parseInt(document.getElementById(inputId).value);
  const el = document.getElementById(previewId);
  const acc = accounts.find(a => a.accNo === accNo);
  if (!acc) { el.innerHTML = ''; return; }
  el.innerHTML = `<div style="display:flex;align-items:center;gap:12px;background:var(--sky-50);border:1.5px solid var(--sky-100);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:4px">
    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--sky-400),var(--sky-600));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.85rem;flex-shrink:0">${acc.name.charAt(0).toUpperCase()}</div>
    <div>
      <div style="font-weight:600;font-size:0.9rem;color:var(--slate-700)">${acc.name}</div>
      <div style="font-size:0.8rem;color:var(--slate-400)">Acc #${acc.accNo} &nbsp;•&nbsp; Balance: <span style="color:var(--sky-700);font-weight:600">${fmt(acc.balance)}</span></div>
    </div>
  </div>`;
}

// ── RENDER TABLES ─────────────────────────────────────────────────
function renderAccountsTable() {
  const q = (document.getElementById('accountSearch').value || '').toLowerCase();
  const filtered = accounts.filter(a => !q || a.name.toLowerCase().includes(q) || String(a.accNo).includes(q));
  document.getElementById('accCount').textContent = filtered.length + ' accounts';
  const body = document.getElementById('accountsTableBody');
  if (!filtered.length) { body.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="e-icon">🗂️</div><p>No accounts found.</p></div></td></tr>'; return; }
  body.innerHTML = filtered.sort((a,b)=>b.balance-a.balance).map(a => `
    <tr>
      <td><span class="acc-no">#${a.accNo}</span></td>
      <td><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--sky-400),var(--sky-600));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.75rem">${a.name.charAt(0)}</div><span>${a.name}</span></div></td>
      <td style="font-weight:600;color:var(--slate-700)">${fmt(a.balance)}</td>
      <td><span class="badge badge-active">Active</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="quickView(${a.accNo})">👁 View</button>
        <button class="btn btn-success btn-sm" onclick="quickDeposit(${a.accNo})">+ Dep</button>
        <button class="btn btn-danger btn-sm" onclick="quickWithdraw(${a.accNo})">- Wtd</button>
      </div></td>
    </tr>`).join('');
}
function filterAccounts() { renderAccountsTable(); }

function renderAllTxn() {
  const body = document.getElementById('allTxnBody');
  document.getElementById('txn-all-count').textContent = transactions.length + ' records';
  if (!transactions.length) { body.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="e-icon">📭</div><p>No transactions yet.</p></div></td></tr>'; return; }
  body.innerHTML = [...transactions].reverse().map(t => `
    <tr>
      <td><span class="acc-no">#${t.accNo}</span></td>
      <td><span class="badge badge-${t.type.toLowerCase()}">${t.type}</span></td>
      <td class="amount-${t.type.toLowerCase()}">${t.type==='DEPOSIT'?'+':'-'}${fmt(t.amount)}</td>
      <td style="color:var(--slate-400);font-size:0.82rem">${t.date}</td>
    </tr>`).join('');
}

function renderRecentDeposits() {
  const deps = transactions.filter(t=>t.type==='DEPOSIT').slice(-4).reverse();
  const el = document.getElementById('recent-deposits');
  if (!deps.length) { el.innerHTML = '<div class="empty-state"><div class="e-icon">📥</div><p>No deposits yet.</p></div>'; return; }
  el.innerHTML = `<table><thead><tr><th>Acc No</th><th>Amount</th><th>Date</th></tr></thead><tbody>${deps.map(t=>`<tr><td><span class="acc-no">#${t.accNo}</span></td><td class="amount-deposit">+${fmt(t.amount)}</td><td style="font-size:0.8rem;color:var(--slate-400)">${t.date}</td></tr>`).join('')}</tbody></table>`;
}
function renderRecentWithdrawals() {
  const wds = transactions.filter(t=>t.type==='WITHDRAW').slice(-4).reverse();
  const el = document.getElementById('recent-withdrawals');
  if (!wds.length) { el.innerHTML = '<div class="empty-state"><div class="e-icon">📤</div><p>No withdrawals yet.</p></div>'; return; }
  el.innerHTML = `<table><thead><tr><th>Acc No</th><th>Amount</th><th>Date</th></tr></thead><tbody>${wds.map(t=>`<tr><td><span class="acc-no">#${t.accNo}</span></td><td class="amount-withdraw">-${fmt(t.amount)}</td><td style="font-size:0.8rem;color:var(--slate-400)">${t.date}</td></tr>`).join('')}</tbody></table>`;
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function refreshDashboard() {
  const totalBal = accounts.reduce((s,a)=>s+a.balance,0);
  const totalDep = transactions.filter(t=>t.type==='DEPOSIT').reduce((s,t)=>s+t.amount,0);
  const totalWd = transactions.filter(t=>t.type==='WITHDRAW').reduce((s,t)=>s+t.amount,0);
  document.getElementById('stat-total-accounts').textContent = accounts.length;
  document.getElementById('stat-total-balance').textContent = fmt(totalBal);
  document.getElementById('stat-total-deposit').textContent = fmt(totalDep);
  document.getElementById('stat-total-withdraw').textContent = fmt(totalWd);

  // Recent txns
  const recentEl = document.getElementById('dash-recent-txn');
  const recent = [...transactions].reverse().slice(0,5);
  if (!recent.length) { recentEl.innerHTML = '<div class="empty-state"><div class="e-icon">📭</div><p>No transactions yet.</p></div>'; }
  else recentEl.innerHTML = `<table><thead><tr><th>Acc</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead><tbody>${recent.map(t=>`<tr><td><span class="acc-no">#${t.accNo}</span></td><td><span class="badge badge-${t.type.toLowerCase()}">${t.type}</span></td><td class="amount-${t.type.toLowerCase()}">${t.type==='DEPOSIT'?'+':'-'}${fmt(t.amount)}</td><td style="font-size:0.78rem;color:var(--slate-400)">${t.date}</td></tr>`).join('')}</tbody></table>`;

  // Top accounts
  const topEl = document.getElementById('dash-top-accounts');
  const top = [...accounts].sort((a,b)=>b.balance-a.balance).slice(0,5);
  if (!top.length) { topEl.innerHTML = '<div class="empty-state"><div class="e-icon">🗂️</div><p>No accounts yet.</p></div>'; }
  else {
    const max = top[0].balance || 1;
    topEl.innerHTML = `<div style="padding:16px 20px;display:flex;flex-direction:column;gap:14px">${top.map(a=>`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <div style="font-size:0.88rem;font-weight:500;color:var(--slate-700)">${a.name} <span style="color:var(--slate-400);font-size:0.78rem">#${a.accNo}</span></div>
          <div style="font-weight:700;font-size:0.88rem;color:var(--sky-700)">${fmt(a.balance)}</div>
        </div>
        <div style="height:6px;background:var(--sky-100);border-radius:6px;overflow:hidden">
          <div style="height:100%;width:${(a.balance/max*100).toFixed(1)}%;background:linear-gradient(90deg,var(--sky-400),var(--sky-600));border-radius:6px;transition:width 0.4s"></div>
        </div>
      </div>`).join('')}</div>`;
  }
}

// ── QUICK ACTIONS FROM ALL ACCOUNTS ──────────────────────────────
function quickView(accNo) {
  navigate('search', null);
  document.getElementById('s-accno').value = accNo;
  searchAccount();
  document.querySelector('[onclick*="search"]').classList.add('active');
}
function quickDeposit(accNo) {
  navigate('deposit', null);
  document.getElementById('d-accno').value = accNo;
  previewAccount('d-accno','d-preview');
  document.querySelector('[onclick*="deposit"]').classList.add('active');
}
function quickWithdraw(accNo) {
  navigate('withdraw', null);
  document.getElementById('w-accno').value = accNo;
  previewAccount('w-accno','w-preview');
  document.querySelector('[onclick*="withdraw"]').classList.add('active');
}

// ── INIT ──────────────────────────────────────────────────────────
refreshDashboard();