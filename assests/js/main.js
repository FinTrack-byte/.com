// main.js - page logic used across pages
document.addEventListener('DOMContentLoaded', ()=>{
  // set year
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

  // theme
  const prefs = Storage.getPrefs();
  applyTheme(prefs.theme||'auto');
  const themeSelect = document.getElementById('theme-select'); if(themeSelect) themeSelect.value = prefs.theme||'auto';
  if(themeSelect) themeSelect.addEventListener('change', ()=>{ Storage.savePrefs({theme:themeSelect.value}); applyTheme(themeSelect.value); });

  // page-specific init
  if(location.pathname.endsWith('index.html') || location.pathname.endsWith('/')){
    renderOverview(); dashboardCharts();
  }
  if(location.pathname.endsWith('transactions.html')){
    initTransactions(); renderTxList();
  }
  if(location.pathname.endsWith('goals.html')){
    initGoals(); renderGoals();
  }
  if(location.pathname.endsWith('settings.html')){
    initSettings();
  }
});

function applyTheme(mode){
  if(mode==='auto'){
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark? 'dark':'light');
  }else document.documentElement.setAttribute('data-theme', mode==='dark'?'dark':'light');
}

// Overview render
function renderOverview(){
  const tx = Storage.getTx();
  const income = tx.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const bal = income - expense;
  document.getElementById('total-income').textContent = formatMoney(income);
  document.getElementById('total-expense').textContent = formatMoney(expense);
  document.getElementById('balance').textContent = formatMoney(bal);

  const recent = document.getElementById('recent-list');
  if(recent){
    recent.innerHTML = '';
    tx.slice().reverse().slice(0,6).forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${t.category}</strong> <div class="muted">${t.description||''}</div></div><div>${t.type==='expense'?'-':''}${formatMoney(t.amount)}</div>`;
      recent.appendChild(li);
    });
  }
}
function formatMoney(v){ return '$'+Number(v).toFixed(2); }

// Transactions page
function initTransactions(){
  const form = document.getElementById('tx-form');
  if(form) form.addEventListener('submit', e=>{ e.preventDefault(); addTxFromForm(); });
  const clearBtn = document.getElementById('clear-btn'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ if(confirm('Clear all transactions?')){ Storage.saveTx([]); renderTxList(); alert('Cleared.'); } });
  const search = document.getElementById('search'); if(search) search.addEventListener('input', renderTxList);
  const filterType = document.getElementById('filter-type'); if(filterType) filterType.addEventListener('change', renderTxList);
}

function addTxFromForm(){
  const type = document.getElementById('type').value;
  const cat = document.getElementById('category').value;
  const amount = document.getElementById('amount').value;
  const date = document.getElementById('date').value;
  const desc = document.getElementById('description').value;
  if(!amount || !date) return alert('Please fill amount and date');
  const arr = Storage.getTx();
  arr.push({id:Date.now(), type, category:cat, amount: Number(amount), date, description:desc});
  Storage.saveTx(arr);
  document.getElementById('tx-form').reset(); renderTxList(); alert('Added');
}

function renderTxList(){
  const list = document.getElementById('tx-list'); if(!list) return;
  const q = (document.getElementById('search')?.value||'').toLowerCase();
  const filterType = document.getElementById('filter-type')?.value||'all';
  const arr = Storage.getTx().filter(t=>{
    if(filterType!=='all' && t.type!==filterType) return false;
    if(q && !(t.category.toLowerCase().includes(q) || (t.description||'').toLowerCase().includes(q))) return false;
    return true;
  }).slice().reverse();
  list.innerHTML = '';
  arr.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${t.category}</strong><div class="muted">${t.date} • ${t.description||''}</div></div>
      <div>
        <span>${t.type==='expense'? '-': ''}${formatMoney(t.amount)}</span>
        <div style="margin-top:6px"><button class="btn outline" onclick="deleteTx(${t.id})">Delete</button></div>
      </div>`;
    list.appendChild(li);
  });
  // update dashboard numbers if present
  renderOverview();
}

function deleteTx(id){
  if(!confirm('Delete this transaction?')) return;
  const arr = Storage.getTx().filter(t=>t.id!==id);
  Storage.saveTx(arr); renderTxList();
}

// Goals
function initGoals(){
  const form = document.getElementById('goal-form'); if(form) form.addEventListener('submit', e=>{ e.preventDefault(); addGoalFromForm(); });
}
function addGoalFromForm(){
  const title = document.getElementById('goal-title').value;
  const target = Number(document.getElementById('goal-target').value);
  const saved = Number(document.getElementById('goal-saved').value);
  const date = document.getElementById('goal-date').value;
  if(!title || !target) return alert('Please fill required fields');
  const arr = Storage.getGoals(); arr.push({id:Date.now(), title, target, saved, date}); Storage.saveGoals(arr); document.getElementById('goal-form').reset(); renderGoals();
}
function renderGoals(){
  const list = document.getElementById('goal-list'); if(!list) return;
  const arr = Storage.getGoals(); list.innerHTML = '';
  arr.forEach(g=>{
    const pct = Math.min(100, Math.round((g.saved/g.target)*100));
    const li = document.createElement('li');
    li.innerHTML = `<div>
      <strong>${g.title}</strong>
      <div class="muted">Target ${formatMoney(g.target)} • Saved ${formatMoney(g.saved)} ${g.date? '• Due '+g.date: ''}</div>
      <div style="margin-top:8px;background:#eef4ff;border-radius:8px;padding:6px;"><div style="width:${pct}% ;background:linear-gradient(90deg,var(--accent1),var(--accent2));padding:6px;border-radius:6px;color:#fff; text-align:center">${pct}%</div></div>
    </div>
    <div><button class="btn outline" onclick="deleteGoal(${g.id})">Delete</button></div>`;
    list.appendChild(li);
  });
}
function deleteGoal(id){ if(!confirm('Delete goal?')) return; const arr = Storage.getGoals().filter(g=>g.id!==id); Storage.saveGoals(arr); renderGoals(); }

// Settings
function initSettings(){
  const exportBtn = document.getElementById('export-btn'); if(exportBtn) exportBtn.addEventListener('click', ()=>{
    const data = {tx:Storage.getTx(), goals:Storage.getGoals(), prefs:Storage.getPrefs()};
    const blob = new Blob([JSON.stringify(data, null, 2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='fintrack-data.json'; a.click(); URL.revokeObjectURL(url);
  });
  const input = document.getElementById('import-file'); if(input) input.addEventListener('change', e=>{
    const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ()=>{ try{ const j=JSON.parse(r.result); Storage.importAll(j); alert('Imported'); }catch(err){alert('Invalid file')} }; r.readAsText(f);
  });
}
