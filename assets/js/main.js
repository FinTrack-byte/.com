// main.js - app logic shared across pages
document.addEventListener('DOMContentLoaded', ()=>{
  // set years in footers
  const years = document.querySelectorAll('[id^="year"]');
  years.forEach(y=> y.textContent = new Date().getFullYear());

  // apply theme
  const prefs = Storage.getPrefs();
  applyTheme(prefs.theme || 'auto');
  const themeSelect = document.getElementById('theme-select');
  if(themeSelect) themeSelect.value = prefs.theme || 'auto';
  if(themeSelect) themeSelect.addEventListener('change', ()=>{ Storage.savePrefs({theme:themeSelect.value}); applyTheme(themeSelect.value); });

  // page-specific
  const path = location.pathname.split('/').pop();
  if(path === '' || path === 'index.html') {
    renderOverview();
    dashboardCharts();
  }
  if(path === 'transactions.html') {
    initTransactions();
    renderTxList();
  }
  if(path === 'goals.html') {
    initGoals();
    renderGoals();
  }
  if(path === 'settings.html') {
    initSettings();
  }
});

// theme helper
function applyTheme(mode){
  if(mode === 'auto'){
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark? 'dark':'light');
  } else {
    document.documentElement.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');
  }
}

// overview
function renderOverview(){
  const tx = Storage.getTx();
  const income = tx.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const balance = income - expense;
  const elIncome = document.getElementById('total-income');
  const elExpense = document.getElementById('total-expense');
  const elBalance = document.getElementById('balance');
  if(elIncome) elIncome.textContent = formatMoney(income);
  if(elExpense) elExpense.textContent = formatMoney(expense);
  if(elBalance) elBalance.textContent = formatMoney(balance);

  const recentList = document.getElementById('recent-list');
  if(recentList){
    recentList.innerHTML = '';
    tx.slice().reverse().slice(0,6).forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${t.category}</strong><div class="muted">${t.description||''}</div></div><div>${t.type==='expense' ? '-' : ''}${formatMoney(t.amount)}</div>`;
      recentList.appendChild(li);
    });
  }
}

function formatMoney(v){ return '$' + Number(v).toFixed(2); }

// Transactions
function initTransactions(){
  const form = document.getElementById('tx-form');
  if(form) form.addEventListener('submit', e => { e.preventDefault(); addTxFromForm(); });

  const clearBtn = document.getElementById('clear-btn');
  if(clearBtn) clearBtn.addEventListener('click', ()=> {
    if(confirm('Clear all transactions? This cannot be undone.')) {
      Storage.saveTx([]);
      renderTxList();
      alert('Transactions cleared.');
    }
  });

  const search = document.getElementById('search');
  if(search) search.addEventListener('input', renderTxList);
  const filterType = document.getElementById('filter-type');
  if(filterType) filterType.addEventListener('change', renderTxList);

  // prefill date
  const dateEl = document.getElementById('date');
  if(dateEl) dateEl.value = new Date().toISOString().slice(0,10);
}

function addTxFromForm(){
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const amount = Number(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  const desc = document.getElementById('description').value;
  if(!amount || !date) return alert('Please enter amount and date.');
  const arr = Storage.getTx();
  arr.push({ id: Date.now(), type, category, amount, date, description: desc });
  Storage.saveTx(arr);
  document.getElementById('tx-form').reset();
  renderTxList();
  renderOverview();
  dashboardCharts();
}

function renderTxList(){
  const list = document.getElementById('tx-list');
  if(!list) return;
  const q = (document.getElementById('search')?.value || '').toLowerCase();
  const filter = document.getElementById('filter-type')?.value || 'all';
  const arr = Storage.getTx().filter(t => {
    if(filter !== 'all' && t.type !== filter) return false;
    if(q && !(t.category.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false;
    return true;
  }).slice().reverse();

  list.innerHTML = '';
  arr.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${t.category}</strong><div class="muted">${t.date} • ${t.description || ''}</div></div>
      <div style="text-align:right">
        <div style="font-weight:700">${t.type==='expense' ? '-' : ''}${formatMoney(t.amount)}</div>
        <div style="margin-top:8px"><button class="btn outline" onclick="deleteTx(${t.id})">Delete</button></div>
      </div>`;
    list.appendChild(li);
  });

  // update overview and charts if present
  renderOverview();
  dashboardCharts();
}

function deleteTx(id){
  if(!confirm('Delete this transaction?')) return;
  const arr = Storage.getTx().filter(t => t.id !== id);
  Storage.saveTx(arr);
  renderTxList();
  renderOverview();
  dashboardCharts();
}

// Goals
function initGoals(){
  const form = document.getElementById('goal-form');
  if(form) form.addEventListener('submit', e => { e.preventDefault(); addGoalFromForm(); });
}

function addGoalFromForm(){
  const title = document.getElementById('goal-title').value;
  const target = Number(document.getElementById('goal-target').value);
  const saved = Number(document.getElementById('goal-saved').value);
  const date = document.getElementById('goal-date').value;
  if(!title || !target) return alert('Please fill required fields.');
  const arr = Storage.getGoals();
  arr.push({ id: Date.now(), title, target, saved, date });
  Storage.saveGoals(arr);
  document.getElementById('goal-form').reset();
  renderGoals();
}

function renderGoals(){
  const list = document.getElementById('goal-list');
  if(!list) return;
  const arr = Storage.getGoals();
  list.innerHTML = '';
  arr.forEach(g=>{
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    const li = document.createElement('li');
    li.innerHTML = `<div>
        <strong>${g.title}</strong>
        <div class="muted">Target ${formatMoney(g.target)} • Saved ${formatMoney(g.saved)} ${g.date ? '• Due ' + g.date : ''}</div>
        <div style="margin-top:10px;background:rgba(108,140,255,0.08);border-radius:10px;padding:6px">
          <div style="width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--secondary));padding:8px;border-radius:8px;color:#fff;text-align:center">${pct}%</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button class="btn outline" onclick="deleteGoal(${g.id})">Delete</button>
      </div>`;
    list.appendChild(li);
  });
}

function deleteGoal(id){
  if(!confirm('Delete this goal?')) return;
  const arr = Storage.getGoals().filter(g => g.id !== id);
  Storage.saveGoals(arr);
  renderGoals();
}

// Settings (export/import)
function initSettings(){
  const exportBtn = document.getElementById('export-btn');
  if(exportBtn) exportBtn.addEventListener('click', ()=>{
    const data = Storage.exportAll();
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  const input = document.getElementById('import-file');
  if(input) input.addEventListener('change', e=>{
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = ()=> {
      try{
        const j = JSON.parse(r.result);
        Storage.importAll(j);
        alert('Imported successfully.');
        location.reload();
      } catch(err){
        alert('Invalid file.');
      }
    };
    r.readAsText(f);
  });
}
