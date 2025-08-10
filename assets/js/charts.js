// charts.js - create dashboard charts using Chart.js
let pieChart = null, barChart = null;

function createPie(ctx, labels, values){
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{data:values, backgroundColor: generateColors(labels.length)}] },
    options:{
      plugins:{legend:{position:'bottom'}},
      cutout:'40%'
    }
  });
}

function createBar(ctx, labels, values){
  if(barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{label:'Net', data:values, borderRadius:6, backgroundColor: generateColors(values.length)}] },
    options:{scales:{y:{beginAtZero:true}}}
  });
}

function generateColors(n){
  const base = [['108','140','255'],['155','108','255'],['78','205','196'],['255','180','110'],['255','108','108']];
  const out=[];
  for(let i=0;i<n;i++){
    const b = base[i%base.length];
    out.push(`rgba(${b.join(',')},0.9)`);
  }
  return out;
}

function dashboardCharts(){
  const tx = Storage.getTx();
  // pie - expenses by category
  const expenseByCat = {};
  const months = {};
  tx.forEach(t=>{
    if(!t.date) return;
    const dt = new Date(t.date);
    const m = dt.getFullYear()+'-'+(dt.getMonth()+1);
    months[m] = (months[m] || 0) + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    if(t.type === 'expense'){
      expenseByCat[t.category] = (expenseByCat[t.category]||0) + Number(t.amount);
    }
  });

  const pieEl = document.getElementById('pieChart');
  if(pieEl){
    const labels = Object.keys(expenseByCat).length ? Object.keys(expenseByCat) : ['No data'];
    const values = Object.keys(expenseByCat).length ? Object.values(expenseByCat) : [1];
    createPie(pieEl, labels, values);
  }

  const barEl = document.getElementById('barChart');
  if(barEl){
    const labels = Object.keys(months).sort();
    const values = labels.map(l => months[l]);
    createBar(barEl, labels.length?labels:['No data'], values.length?values:[0]);
  }
}

window.dashboardCharts = dashboardCharts;
