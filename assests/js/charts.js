// charts.js - create charts for dashboard
function createPie(ctx, data){
  return new Chart(ctx, {
    type:'pie',
    data: {
      labels: data.labels,
      datasets:[{data:data.values}]
    },
    options:{plugins:{legend:{position:'bottom'}}}
  });
}

function createBar(ctx, labels, values){
  return new Chart(ctx, {
    type:'bar',
    data:{labels, datasets:[{label:'Net', data:values, borderRadius:6}]},
    options:{scales:{y:{beginAtZero:true}}}
  });
}

function dashboardCharts(){
  const tx = Storage.getTx();
  const expenseByCat = {};
  const months = {};
  tx.forEach(t=>{
    const dt = new Date(t.date);
    const m = dt.getFullYear()+'-'+(dt.getMonth()+1);
    months[m] = (months[m]||0) + (t.type==='income'? Number(t.amount): -Number(t.amount));
    if(t.type==='expense') expenseByCat[t.category] = (expenseByCat[t.category]||0) + Number(t.amount);
  });
  // pie
  const pieCtx = document.getElementById('pieChart');
  if(pieCtx){
    const data={labels: Object.keys(expenseByCat), values: Object.values(expenseByCat)};
    createPie(pieCtx, data);
  }
  // bar
  const barCtx = document.getElementById('barChart');
  if(barCtx){
    const labels = Object.keys(months).sort();
    const values = labels.map(l=>months[l]);
    createBar(barCtx, labels, values);
  }
}

window.dashboardCharts = dashboardCharts;
