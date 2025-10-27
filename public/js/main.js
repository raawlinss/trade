(function(){
  let currentLanguage='en';
  let selectedPosition='long';
  const $=id=>document.getElementById(id);

  function translatePage(lang){
    currentLanguage=lang;
    document.querySelectorAll('[data-translate]').forEach(el=>{
      const k=el.getAttribute('data-translate');
      const dict=(window.translations[lang]||window.translations.en)||{};
      if(dict[k]) el.textContent=dict[k];
    });
  }

  function setupLanguage(){
    const dropdown=$('languageDropdown');
    const menu=$('languageMenu');
    const toggle=()=>{ if(menu.classList.contains('hidden')){menu.classList.remove('hidden'); setTimeout(()=>menu.classList.add('show'),10);} else {menu.classList.remove('show'); setTimeout(()=>menu.classList.add('hidden'),300);} };
    dropdown.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle();});
    dropdown.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();setTimeout(()=>dropdown.click(),10);});
    dropdown.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();});
    document.addEventListener('click',e=>{ if(!dropdown.contains(e.target)&&!menu.contains(e.target)){ menu.classList.remove('show'); setTimeout(()=>menu.classList.add('hidden'),300);} });
    document.querySelectorAll('.language-option').forEach(opt=>{
      opt.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const lang=opt.getAttribute('data-lang');
        const flag=opt.getAttribute('data-flag');
        const name=opt.getAttribute('data-name');
        $('currentFlag').src=`https://flagcdn.com/${flag}.svg`;
        $('currentLanguage').textContent=name;
        translatePage(lang);
        menu.classList.remove('show'); setTimeout(()=>menu.classList.add('hidden'),300);
      });
      opt.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();setTimeout(()=>opt.click(),10);});
      opt.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();});
    });
  }

  function setupDarkMode(){
    const btn=$('darkModeToggle');
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();document.body.classList.toggle('dark-mode');document.body.classList.toggle('light-mode');$('modeIcon').textContent=document.body.classList.contains('dark-mode')?'☀️':'🌙';});
    btn.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();setTimeout(()=>btn.click(),10);});
    btn.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();});
  }

  function setupTabs(){
    $('winRateTab').addEventListener('click',function(){ $('winRateSection').classList.remove('hidden'); $('leverageSection').classList.add('hidden'); this.className='btn btn-tab active'; $('leverageTab').className='btn btn-tab'; });
    $('leverageTab').addEventListener('click',function(){ $('leverageSection').classList.remove('hidden'); $('winRateSection').classList.add('hidden'); this.className='btn btn-tab active'; $('winRateTab').className='btn btn-tab'; });
  }

  function setupLeverage(){
    $('longBtn').addEventListener('click',function(){ selectedPosition='long'; this.className='btn btn-position long'; $('shortBtn').className='btn btn-position inactive'; calcOptimal(); });
    $('shortBtn').addEventListener('click',function(){ selectedPosition='short'; this.className='btn btn-position short'; $('longBtn').className='btn btn-position inactive'; calcOptimal(); });
    $('leverageSlider').addEventListener('input',function(){ $('leverageDisplay').textContent=this.value+'x'; });
    $('balancePercentage').addEventListener('input',function(){ const p=+this.value, b=parseFloat($('balance').value)||0; const s=b*p/100; $('percentageDisplay').textContent=p+'%'; $('positionSizeDisplay').textContent='$'+s.toLocaleString('tr-TR',{maximumFractionDigits:2}); });
    $('balance').addEventListener('input',function(){ const p=+$('balancePercentage').value, b=parseFloat(this.value)||0; const s=b*p/100; $('positionSizeDisplay').textContent='$'+s.toLocaleString('tr-TR',{maximumFractionDigits:2}); calcOptimal(); });
    $('calculateLeverage').addEventListener('click',()=>{
      const l=+$('leverageSlider').value, e=parseFloat($('entryPrice').value), bal=parseFloat($('balance').value), pct=parseFloat($('balancePercentage').value), qty=parseFloat($('quantity').value);
      if(!l||!e||!bal||!pct||!qty){ alert((window.translations[currentLanguage]||window.translations.en).fillAllFields); return; }
      const used=bal*pct/100;
      const liq= selectedPosition==='long' ? e*(1-(1/l)) : e*(1+(1/l));
      $('positionTypeResult').textContent= selectedPosition==='long'?'📈 LONG':'📉 SHORT';
      $('positionTypeResult').className= selectedPosition==='long'?'font-bold text-green-600 text-lg':'font-bold text-red-600 text-lg';
      $('leverageResult').textContent=l+'x';
      $('positionSizeResult').textContent='$'+(used*l).toLocaleString('tr-TR',{maximumFractionDigits:2});
      $('quantityResult').textContent=(qty.toFixed(8))+' Units';
      $('usedBalanceResult').textContent='$'+used.toLocaleString('tr-TR',{maximumFractionDigits:2});
      $('liquidationPrice').textContent='$'+liq.toLocaleString('tr-TR',{maximumFractionDigits:2});
      $('finalBalanceResult').textContent='$'+bal.toLocaleString('tr-TR',{maximumFractionDigits:2});
      $('finalBalanceResult').className='font-bold text-blue-600 text-xl';
      $('leverageResults').classList.remove('hidden');
      const sp=$('stopPrice'); if(sp) sp.addEventListener('input',calcOptimal);
      $('leverageResults').scrollIntoView({behavior:'smooth'});
    });
  }

  function calcOptimal(){
    const e=parseFloat($('entryPrice').value); const s=parseFloat(($('stopPrice')||{}).value);
    if(!e||!s){ $('optimalLeverage').textContent='-'; return; }
    let opt= selectedPosition==='long' ? 1/(1-(s/e)) : 1/((s/e)-1);
    if(opt>0 && opt<=1000){ $('optimalLeverage').textContent=opt.toFixed(2)+'x'; $('optimalLeverage').className='text-orange-600 font-bold text-lg'; }
    else { $('optimalLeverage').textContent='Invalid'; $('optimalLeverage').className='text-red-600 font-bold text-lg'; }
  }

  function generateTrades(totalTrades, winRate){
    const container=$('tradesContainer'); container.innerHTML='';
    const start=parseFloat($('startingBalance').value); const tp=parseFloat($('takeProfit').value); const sl=parseFloat($('stopLoss').value); const lev=parseFloat($('leverage').value);
    const wins=Math.floor(totalTrades*(winRate/100)); const losses=totalTrades-wins; const arr=[...Array(wins).fill(1),...Array(losses).fill(0)];
    for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]}
    let bal=start, w=0, l=0;
    arr.forEach((t,idx)=>{
      const isWin=t===1; const entry=bal; if(isWin) w++; else l++;
      const pnl=isWin? (bal*tp*lev)/100 : -(bal*sl*lev)/100; const pnlPct=isWin? tp*lev : -sl*lev; bal+=pnl;
      const tr=document.createElement('tr'); tr.className='border-b border-gray-100 hover:bg-gray-50 transition-colors';
      tr.innerHTML=`
        <td class="py-2 px-2 text-secondary text-xs">#${idx+1}</td>
        <td class="py-2 px-2"><span class="px-2 py-1 rounded text-xs font-medium ${isWin?'bg-success-light text-success':'bg-danger-light text-danger'}">${isWin?(window.translations[currentLanguage]||window.translations.en).win:(window.translations[currentLanguage]||window.translations.en).loss}</span></td>
        <td class="py-2 px-2 text-xs">$${entry.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
        <td class="py-2 px-2 text-xs">$${bal.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
        <td class="py-2 px-2 text-xs ${pnl>=0?'text-success':'text-danger'}">${pnl>=0?'+':''}$${pnl.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
        <td class="py-2 px-2 text-xs ${pnlPct>=0?'text-success':'text-danger'}">${pnlPct>=0?'+':''}${pnlPct.toFixed(2)}%</td>`;
      container.appendChild(tr);
    });
    const totalPnL=bal-start; const rate=(totalPnL/start)*100; return {finalBalance:bal,totalPnL,netProfitRate:rate,actualWins:w,actualLosses:l};
  }

  async function analyzeWithAI(data){
    const sec=$('aiAnalysis'), spin=$('aiLoadingSpinner'), text=$('aiAnalysisText');
    sec.classList.remove('hidden'); spin.classList.remove('hidden'); text.textContent=(window.translations[currentLanguage]||window.translations.en).aiAnalyzing;
    try{
      const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:currentLanguage,data})});
      if(!res.ok) throw new Error('bad_response');
      const js=await res.json(); spin.classList.add('hidden'); typeWriter(text, js.message||js.output||'');
    }catch(err){
      spin.classList.add('hidden');
      const errs={ en:"AI analysis temporarily unavailable. Please check your API key and try again.", tr:"AI analizi geçici olarak kullanılamıyor. API anahtarınızı kontrol edin ve tekrar deneyin." };
      text.textContent=errs[currentLanguage]||errs.en; text.className='text-red-300 text-sm leading-relaxed min-h-20';
    }
  }

  function typeWriter(el, str){ el.textContent=''; el.className='text-white text-sm leading-relaxed min-h-20'; let i=0; (function step(){ if(i<str.length){ el.textContent+=str.charAt(i++); setTimeout(step,20);} })(); }

  function setupWinRate(){
    $('runStrategy').addEventListener('click',()=>{
      const start=parseFloat($('startingBalance').value); const tp=parseFloat($('takeProfit').value); const sl=parseFloat($('stopLoss').value); const wr=parseFloat($('winRate').value); const n=parseInt($('numberOfTrades').value); const lev=parseFloat($('leverage').value);
      if(!start||!tp||!sl||!wr||!n||!lev){ alert((window.translations[currentLanguage]||window.translations.en).fillAllFields); return; }
      const rr=tp/sl; const res=generateTrades(n,wr);
      $('riskReward').textContent='1:'+rr.toFixed(2);
      $('totalProfitLoss').textContent='$'+res.totalPnL.toLocaleString('tr-TR',{maximumFractionDigits:2});
      $('totalProfitLoss').className= res.totalPnL>=0?'font-medium text-success':'font-medium text-danger';
      $('winningTrades').textContent= res.actualWins+' ('+((res.actualWins/n)*100).toFixed(1)+'%)';
      $('losingTrades').textContent= res.actualLosses+' ('+((res.actualLosses/n)*100).toFixed(1)+'%)';
      $('netProfitRate').textContent= res.netProfitRate.toFixed(2)+'%';
      $('netProfitRate').className= res.netProfitRate>=0?'font-medium text-success':'font-medium text-danger';
      $('finalBalance').textContent='$'+res.finalBalance.toLocaleString('tr-TR',{maximumFractionDigits:2});
      $('finalBalance').className= res.finalBalance>=start?'font-medium text-success':'font-medium text-danger';
      $('results').classList.remove('hidden'); $('tradeList').classList.remove('hidden');
      analyzeWithAI({ startingBalance:start,takeProfit:tp,stopLoss:sl,winRate:wr,numberOfTrades:n,leverage:lev,riskReward:rr.toFixed(2),finalBalance:res.finalBalance,totalPnL:res.totalPnL,netProfitRate:res.netProfitRate });
      setTimeout(()=>{ $('tradeList').scrollIntoView({behavior:'smooth',block:'center'}); },800);
    });
  }

  // init
  setupLanguage();
  setupDarkMode();
  setupTabs();
  setupLeverage();
  setupWinRate();
})();
