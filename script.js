(function(){
  const $ = id=>document.getElementById(id);

  // Grundwerte
  const targetEl=$('target');
  const yearsEl=$('years');
  const startEl=$('start');
  const rateEl=$('rate');
  const incomeEl=$('income');
  const expensesEl=$('expenses');
  const strategyEl=$('strategy');
  const fixedEl=$('fixed');
  const percentEl=$('percent');
  const chosenMonthlyEl=$('chosenMonthly');
  const finalBalanceEl=$('finalBalance');
  const remainingEl=$('remaining');
  const monthsLeftEl=$('monthsLeft');
  const recommendedMonthlyEl=$('recommendedMonthly');
  const faceEl=$('face');
  const toggleThemeBtn=$('toggleTheme');
  const downloadCSVBtn=$('downloadCSV');
  const saveLocalBtn=$('saveLocal');
  const fixedSection=$('fixed-section');
  const percentSection=$('percent-section');
  const roundupSection=$('roundup-section');
  const canvas=$('chart');
  const ctx=canvas.getContext('2d');

  // Monatlicher Sparplan
  const monthsCountEl=$('monthsCount');
  const monthlyPlanContainer=$('monthlyPlanContainer');
  let monthlyPlanData=[];

  // Tooltip
  const tooltipEl=document.createElement('div');
  tooltipEl.style.position='absolute';
  tooltipEl.style.padding='6px 10px';
  tooltipEl.style.background='rgba(0,0,0,0.7)';
  tooltipEl.style.color='#fff';
  tooltipEl.style.borderRadius='6px';
  tooltipEl.style.pointerEvents='none';
  tooltipEl.style.fontSize='12px';
  tooltipEl.style.display='none';
  tooltipEl.style.transition='0.05s';
  document.body.appendChild(tooltipEl);

  const formatEUR=v=>Number(v).toLocaleString('de-DE',{minimumFractionDigits:0,maximumFractionDigits:2})+' €';

  // Berechnungen
  function requiredMonthlyDeposit(target,current,years,rate){
    const n=years*12;
    if(n===0||target<=current)return 0;
    const fvNeeded=target-current;
    const r=rate/100/12;
    if(r===0)return +(fvNeeded/n).toFixed(2);
    return +((fvNeeded*r)/(Math.pow(1+r,n)-1)).toFixed(2);
  }

  function buildProjection(start,monthlyDeposit,years,rate){
    const months=years*12;
    const r=rate/100/12;
    const arr=[];
    let balance=start;
    for(let i=1;i<=months;i++){
      balance=balance*(1+r)+monthlyDeposit;
      arr.push({month:i,balance:+balance.toFixed(2)});
    }
    return arr;
  }

  function buildProjectionNoInterest(start,monthlyDeposit,years){
    const months=years*12;
    const arr=[];
    let balance=start;
    for(let i=1;i<=months;i++){
      balance+=monthlyDeposit;
      arr.push({month:i,balance:+balance.toFixed(2)});
    }
    return arr;
  }

  function updateFace(progress){
    if(progress<0.3) faceEl.textContent='😢';
    else if(progress<0.6) faceEl.textContent='😐';
    else if(progress<0.9) faceEl.textContent='🙂';
    else faceEl.textContent='😎';
  }

  let projection=[],projectionNoInterest=[];

  // --- Monatsplan ---
  function buildMonthlyTable(){
    const count=Number(monthsCountEl.value)||12;
    monthlyPlanContainer.innerHTML='';
    monthlyPlanData=[];
    const table=document.createElement('table');
    const trHead=document.createElement('tr');
    ['Monat','Geplant (€)','Tatsächlich gespart (€)'].forEach(h=>{
      const th=document.createElement('th');
      th.textContent=h;
      trHead.appendChild(th);
    });
    table.appendChild(trHead);

    for(let i=0;i<count;i++){
      const tr=document.createElement('tr');
      const tdMonth=document.createElement('td');
      tdMonth.textContent=`Monat ${i+1}`;
      tr.appendChild(tdMonth);

      const tdPlanned=document.createElement('td');
      const inpPlanned=document.createElement('input');
      inpPlanned.type='number';
      inpPlanned.min='0';
      inpPlanned.value='0';
      tdPlanned.appendChild(inpPlanned);
      tr.appendChild(tdPlanned);

      const tdActual=document.createElement('td');
      const inpActual=document.createElement('input');
      inpActual.type='number';
      inpActual.min='0';
      inpActual.value='0';
      tdActual.appendChild(inpActual);
      tr.appendChild(tdActual);

      table.appendChild(tr);
      monthlyPlanData.push({plannedEl:inpPlanned,actualEl:inpActual});
    }
    monthlyPlanContainer.appendChild(table);
  }

  function updateAll(){
    const target=Number(targetEl.value)||0;
    const years=Math.max(1,Number(yearsEl.value)||1);
    const start=Number(startEl.value)||0;
    const rate=Number(rateEl.value)||0;
    const income=Number(incomeEl.value)||0;
    const expenses=Number(expensesEl.value)||0;
    const strategy=strategyEl.value;

    const requiredFixed=requiredMonthlyDeposit(target,start,years,rate);
    let chosenMonthly=0;
    const savingsCapacity=income-expenses;

    fixedSection.classList.add('hidden');
    percentSection.classList.add('hidden');
    roundupSection.classList.add('hidden');

    switch(strategy){
      case 'fixed':
        fixedSection.classList.remove('hidden');
        const fixed=fixedEl.value?Number(fixedEl.value):requiredFixed;
        chosenMonthly=fixed>0?fixed:0;
        fixedEl.placeholder=`Empfohlen: ${formatEUR(requiredFixed)}`;
        break;
      case 'percent':
        percentSection.classList.remove('hidden');
        const percent=Number(percentEl.value)||0;
        chosenMonthly= +(income*(percent/100)).toFixed(2);
        break;
      case 'roundup':
        roundupSection.classList.remove('hidden');
        chosenMonthly= savingsCapacity>0?+(savingsCapacity*0.2).toFixed(2):0;
        break;
      default:
        chosenMonthly=0;
    }

    projection=buildProjection(start,chosenMonthly,years,rate);
    projectionNoInterest=buildProjectionNoInterest(start,chosenMonthly,years);

    const finalBalance=projection.length?projection[projection.length-1].balance:start;
    const remaining=Math.max(0,target-start);
    const monthsLeft=years*12;
    const requiredIfNoInterest=Math.max(0,(target-start)/monthsLeft);

    chosenMonthlyEl.textContent=formatEUR(chosenMonthly);
    finalBalanceEl.textContent=formatEUR(finalBalance);
    remainingEl.textContent=formatEUR(remaining);
    monthsLeftEl.textContent=`Monate: ${monthsLeft}`;
    recommendedMonthlyEl.textContent=`Ohne Zinsen: ${formatEUR(requiredIfNoInterest)}/Monat`;

    updateFace(finalBalance/target);
    drawChart(projection, projectionNoInterest, target);
  }

  // --- Chart ---
  function drawChart(data,data2,target){
    const dpr=window.devicePixelRatio||1;
    const width=canvas.clientWidth;
    const height=300;
    canvas.width=width*dpr;
    canvas.height=height*dpr;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,width,height);
    const padding=50;
    const w=width-padding*2;
    const h=height-padding*2;

    const isDark=document.documentElement.dataset.theme==='dark';
    const bgColor=isDark?'#1f2937':'#fff';
    const axisColor=isDark?'#9ca3af':'#6b7280';
    const gridColor=isDark?'#374151':'#f1f5f9';
    document.body.style.background=bgColor;

    const maxVal=Math.max(target,...data.map(d=>d.balance),...data2.map(d=>d.balance));
    const minVal=0;
    const range=maxVal-minVal;

    // Achsen
    ctx.strokeStyle=axisColor;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(padding,padding);
    ctx.lineTo(padding,padding+h);
    ctx.lineTo(padding+w,padding+h);
    ctx.stroke();

    // Y Labels
    ctx.fillStyle=axisColor;
    ctx.font='12px system-ui';
    for(let i=0;i<=4;i++){
      const val=minVal+(i/4)*range;
      const y=padding+h-(i/4)*h;
      ctx.fillText(Math.round(val).toLocaleString('de-DE')+' €',6,y+4);
      ctx.strokeStyle=gridColor;
      ctx.beginPath();
      ctx.moveTo(padding,y);
      ctx.lineTo(padding+w,y);
      ctx.stroke();
    }

    // X Labels
    const step=Math.ceil(data.length/12);
    ctx.textAlign='center';
    ctx.textBaseline='top';
    for(let i=0;i<data.length;i+=step){
      const x=padding+(i/(data.length-1))*w;
      ctx.fillStyle=axisColor;
      ctx.fillText(data[i].month,x,padding+h+4);
    }

    function drawLine(d,color){
      ctx.strokeStyle=color;
      ctx.lineWidth=2;
      ctx.beginPath();
      for(let j=0;j<d.length;j++){
        const x=padding+(j/(d.length-1))*w;
        const y=padding+h-((d[j].balance-minVal)/range)*h;
        if(j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    drawLine(data,'#2563eb');
    drawLine(data2,'#f97316');
  }

  canvas.addEventListener('mousemove',e=>{
    const rect=canvas.getBoundingClientRect();
    const xMouse=e.clientX-rect.left;
    const yMouse=e.clientY-rect.top;
    const padding=50;
    const w=rect.width-padding*2;
    const h=300-padding*2;
    if(!projection.length) return;
    let idx=Math.round((xMouse-padding)/w*(projection.length-1));
    idx=Math.max(0,Math.min(projection.length-1,idx));
    const dataPoint=projection[idx];
    const dataPoint2=projectionNoInterest[idx];
    tooltipEl.style.left=e.pageX+10+'px';
    tooltipEl.style.top=e.pageY+10+'px';
    tooltipEl.innerHTML=`Monat: ${dataPoint.month}<br>Mit Zins: ${formatEUR(dataPoint.balance)}<br>Ohne Zins: ${formatEUR(dataPoint2.balance)}`;
    tooltipEl.style.display='block';
    updateFace(dataPoint.balance/Number(targetEl.value));
  });

  canvas.addEventListener('mouseleave',()=>{tooltipEl.style.display='none';});

  function attachEvents(){
    ['input','change'].forEach(evt=>{
      [targetEl, yearsEl, startEl, rateEl, incomeEl, expensesEl, strategyEl, fixedEl, percentEl, monthsCountEl].forEach(el=>{
        el.addEventListener(evt,()=>{
          buildMonthlyTable();
          updateAll();
        });
      });
    });
  }

  downloadCSVBtn.addEventListener('click',()=>{
    let rows=[['Month','Mit Zins','Ohne Zins','Geplant','Tatsächlich']];
    for(let i=0;i<projection.length;i++){
      let planned=monthlyPlanData[i]?.plannedEl.value||0;
      let actual=monthlyPlanData[i]?.actualEl.value||0;
      rows.push([projection[i].month,projection[i].balance,projectionNoInterest[i].balance,planned,actual]);
    }
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='sparplan.csv';a.click();
    URL.revokeObjectURL(url);
  });

  saveLocalBtn.addEventListener('click',()=>{
    const s={
      target:Number(targetEl.value),
      years:Number(yearsEl.value),
      start:Number(startEl.value),
      rate:Number(rateEl.value),
      income:Number(incomeEl.value),
      expenses:Number(expensesEl.value),
      strategy:strategyEl.value,
      fixed: fixedEl.value?Number(fixedEl.value):null,
      percent:Number(percentEl.value),
      monthsCount:Number(monthsCountEl.value),
      monthlyPlan:monthlyPlanData.map(d=>({planned:Number(d.plannedEl.value)||0,actual:Number(d.actualEl.value)||0}))
    };
    localStorage.setItem('sparapp:monthly',JSON.stringify(s));
    alert('Einstellungen gespeichert');
  });

  toggleThemeBtn.addEventListener('click',()=>{
    document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'':'dark';
    updateAll();
  });

  window.addEventListener('resize',updateAll);

  // Initial
  buildMonthlyTable();
  attachEvents();
  updateAll();
})();
