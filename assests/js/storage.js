// storage.js - handles LocalStorage for transactions and goals and prefs
const Storage = (function(){
  const TX_KEY = 'fin_tx_v1';
  const GOAL_KEY = 'fin_goals_v1';
  const PREF_KEY = 'fin_prefs_v1';

  function read(key, def){
    try{ const s = localStorage.getItem(key); return s? JSON.parse(s): def; }catch(e){return def}
  }
  function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  return {
    getTx:()=> read(TX_KEY, []),
    saveTx:(arr)=> write(TX_KEY, arr),
    getGoals:()=> read(GOAL_KEY, []),
    saveGoals:(arr)=> write(GOAL_KEY, arr),
    getPrefs:()=> read(PREF_KEY, {theme:'auto'}),
    savePrefs:(p)=> write(PREF_KEY, p),
    exportAll:()=> JSON.stringify({tx:Storage.getTx(), goals:Storage.getGoals(), prefs:Storage.getPrefs()}),
    importAll:(json)=>{
      if(json.tx) write(TX_KEY,json.tx);
      if(json.goals) write(GOAL_KEY,json.goals);
      if(json.prefs) write(PREF_KEY,json.prefs);
    }
  };
})();

// expose Storage to other scripts
window.Storage = Storage;
