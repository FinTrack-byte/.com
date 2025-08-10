// storage.js - LocalStorage layer
const Storage = (function(){
  const TX_KEY = 'ft_tx_v2';
  const GOAL_KEY = 'ft_goals_v2';
  const PREF_KEY = 'ft_prefs_v2';

  function read(key, def){
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch(e){ return def; }
  }
  function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  return {
    getTx: ()=> read(TX_KEY, sampleTx()),
    saveTx: (arr)=> write(TX_KEY, arr),
    getGoals: ()=> read(GOAL_KEY, sampleGoals()),
    saveGoals: (arr)=> write(GOAL_KEY, arr),
    getPrefs: ()=> read(PREF_KEY, {theme:'auto'}),
    savePrefs: (p)=> write(PREF_KEY, p),
    exportAll: ()=> JSON.stringify({tx: read(TX_KEY, []), goals: read(GOAL_KEY, []), prefs: read(PREF_KEY, {theme:'auto'})}, null, 2),
    importAll: (json)=> { if(json.tx) write(TX_KEY, json.tx); if(json.goals) write(GOAL_KEY, json.goals); if(json.prefs) write(PREF_KEY, json.prefs); }
  };

  // sample data so first-time user sees content
  function sampleTx(){
    return [
      {id:1,type:'income',category:'Salary',amount:1500,date:todayOffset(-10),description:'July salary'},
      {id:2,type:'expense',category:'Food',amount:45.5,date:todayOffset(-9),description:'Groceries'},
      {id:3,type:'expense',category:'Transport',amount:12.25,date:todayOffset(-8),description:'Taxi'},
      {id:4,type:'expense',category:'Entertainment',amount:20,date:todayOffset(-6),description:'Games'},
      {id:5,type:'income',category:'Freelance',amount:200,date:todayOffset(-4),description:'Design job'},
    ];
  }
  function sampleGoals(){
    return [
      {id:101,title:'New Phone',target:600,saved:160,date:futureOffset(40)},
      {id:102,title:'Trip',target:1200,saved:400,date:futureOffset(120)}
    ];
  }
  function todayOffset(offsetDays){
    const d=new Date(); d.setDate(d.getDate()+offsetDays); return d.toISOString().slice(0,10);
  }
  function futureOffset(days){ return todayOffset(days); }

})();
window.Storage = Storage;
