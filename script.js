(function(){
  "use strict";
  //==============================
  // 配置與 LocalStorage 鍵值
  //==============================
  const LS_KEYS = {
    darkMode: "converter_darkMode",
    lastInput: "converter_lastInput",
    mode: "converter_mode", // "r2c" 或 "c2r"
    history: "converter_history"
  };
  const CONFIG = {
    baseThreshold: 45,
    baseArray: [0,1,2,4,5],
    extraRanges: [
      {a: 46, b: 111, f: 1},
      {a: 112, b: 500, f: 2},
      {a: 501, b: 1000, f: 3},
      {a: 1001, b: 1500, f: 4},
      {a: 1501, b: Infinity, f: 5}
    ],
    chart: { maxRounds: 1600, step: 50 }
  };

  //==============================
  // 翻譯字典設定
  //==============================
  let currentLang = "zh-TW";
  const translations = {
    "zh-TW": {
      nav: {
         calculator: "換算器",
         common: "常用換算",
         chartSection: "關係圖",
         history: "歷史記錄",
         closeMenu: "關閉選單"
      },
      calculator: {
         title: "卡片數 / 回合數 換算器",
         modeR2C: "回合 → 卡片",
         modeC2R: "卡片 → 回合",
         inputLabel: "輸入數字：",
         calcBtn: "計算",
         processBtn: "換算過程",
         invalidInput: "請輸入有效且大於 0 的數值"
      },
      common: { title: "常用換算", r2c: "回合 → 卡片", c2r: "卡片 → 回合" },
      chart: {
         title: "卡數 - 回合數 關係圖",
         chartTypeLabel: "圖表類型：",
         optionLine: "折線圖",
         optionBar: "柱狀圖",
         xAxis: "回合數",
         yAxis: "卡片數",
         showAnnotationsLabel: "顯示標註線",
         showPointsLabel: "顯示資料點",
         showGridLabel: "顯示網格線",
         roundSuffix: "回"
      },
      history: { title: "換算歷史記錄", clearHistory: "清除歷史", noRecord: "無歷史記錄" },
      process: {
         r2cTitle: "【回合 → 卡片 換算過程】",
         c2rTitle: "【卡片 → 回合 換算過程】",
         r2cStep1: "1. 前45回部分：",
         r2cLine1: "   - 回合數：min({input}, 45) = {r}",
         r2cLine2: "   - 基礎卡片 = floor({r}/5) * 8 = {baseCalc}",
         r2cLine3: "   - 餘數 {mod} → 加成 {lookup} 卡",
         r2cLine4: "   → 小計 = {subtotal}",
         r2cStep2: "2. 超過45回部分：",
         r2cLineExtra: "   - 區間 {a}～{b} (倍率 {f})：計算得 {extra}",
         r2cStep3: "3. 總卡片數 = 基礎 ({subtotal}) + 超過部分 ({extraTotal}) = {result} 卡",
         c2rStep1: "1. 利用二分搜尋法尋找最小回合數，使換算後卡片數 ≥ 輸入卡片數。",
         c2rStep2: "   - 初始範圍：低 = 1, 高 = {high}",
         c2rStep3: "   - 迭代：回合數 {mid} → {cards} 卡",
         c2rStep4: "   → 結果：最小回合數 = {result}"
      },
      tables: {
        r2c: { header1: "回合數", header2: "卡片數" },
        c2r: { header1: "卡片數", header2: "回合數" },
        history: { header1: "時間", header2: "模式", header3: "輸入值", header4: "結果" }
      },
      units: { r2c: " 卡片", c2r: " 回合" },
      pagination: { prev: "上一頁", next: "下一頁", pageInfo: "第 {current} 頁 / 共 {total} 頁" },
      credits: "網頁、圖表製作：Discord 𝕫𝕙𝕚𝕝𝕚 @zhili_71",
      darkMode: { light: "白天模式", dark: "黑夜模式" },
      siteTitleSub: "協同模式卡片計算器",
      easterEgg: {
        click1: "Thinking🤔",
        click3: "雙倍 Thinking🤔",
        click5: "三倍 Thinking🤔！",
        click7: "主宰一切！",
        click10: "狂暴攻擊！！",
        click15: "終極 Thinking🤔！！",
        click25: "無人能擋！！",
        click35: "變態殺戮！！",
        click45: "猛獸級 Thinking🤔！！！",
        click60: "超神的！！！！",
        click80: "比神還神！！！！"
      }
    },
    // 此處可補上其它語系（zh-CN、en、ja、ko）
  };

  // 根據語系回傳 locale
  function getLocale(lang) {
    switch(lang) {
      case "zh-TW": return "zh-TW";
      case "zh-CN": return "zh-CN";
      case "en": return "en-US";
      case "ja": return "ja-JP";
      case "ko": return "ko-KR";
      default: return lang;
    }
  }

  //==============================
  // DOM 元素取得
  //==============================
  const body = document.body;
  const inputValueElem = document.getElementById("inputValue");
  const resultDiv = document.getElementById("result");
  const processInfo = document.getElementById("processInfo");
  const btnR2C = document.getElementById("btnR2C");
  const btnC2R = document.getElementById("btnC2R");
  const calcBtn = document.getElementById("calcBtn");
  const processBtn = document.getElementById("processBtn");
  const chartTypeSelect = document.getElementById("chartType");
  const toggleAnnotationsCheckbox = document.getElementById("toggleAnnotations");
  const togglePointsCheckbox = document.getElementById("togglePoints");
  const toggleGridCheckbox = document.getElementById("toggleGrid");
  const r2cTableBody = document.getElementById("r2cTable").querySelector("tbody");
  const c2rTableBody = document.getElementById("c2rTable").querySelector("tbody");
  const historyTableBody = document.getElementById("historyTable").querySelector("tbody");
  const clearHistoryBtn = document.getElementById("clearHistory");
  const navTopBtn = document.getElementById("navTop");
  const navPrevBtn = document.getElementById("navPrev");
  const navNextBtn = document.getElementById("navNext");
  const historyPagination = document.getElementById("historyPagination");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const darkModeIcon = document.getElementById("darkModeIcon");
  const darkModeText = document.getElementById("darkModeText");
  const langSelect = document.getElementById("langSelect");
  const sideMenuToggle = document.getElementById("sideMenuToggle");
  const siteTitleContainer = document.getElementById("siteTitleContainer");
  const siteTitle = document.getElementById("siteTitle");
  const siteTitleSub = document.getElementById("siteTitleSub");
  const easterEggText = document.getElementById("easterEggText");

  let myChart = null;
  let currentChartType = chartTypeSelect.value;
  let mode = "r2c";
  let historyData = [];
  let currentHistoryPage = 0;
  const recordsPerPage = 5;
  let typewriterInterval = null;
  let typewriterIndex = 0;
  let processTextCache = "";
  let eggClickCount = 0;
  let eggTimeout = null;

  //==============================
  // 限制輸入僅允許數字
  //==============================
  inputValueElem.addEventListener("input", function(){
    this.value = this.value.replace(/\D/g, "");
  });

  //==============================
  // 儲存與讀取 LocalStorage
  //==============================
  function saveLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function loadLS(key, defaultValue) {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  }

  //==============================
  // 初始化偏好與歷史記錄
  //==============================
  function initPreferences(){
    const darkPref = loadLS(LS_KEYS.darkMode, null);
    if(darkPref !== null){
      if(darkPref) body.classList.add("dark");
      else body.classList.remove("dark");
    } else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
      body.classList.add("dark");
    }
    renderToggleBtn();
    const lastInput = loadLS(LS_KEYS.lastInput, "100");
    inputValueElem.value = lastInput;
    mode = loadLS(LS_KEYS.mode, "r2c");
    if(mode === "r2c"){
      btnR2C.classList.add("active");
      btnC2R.classList.remove("active");
    } else {
      btnC2R.classList.add("active");
      btnR2C.classList.remove("active");
    }
    historyData = loadLS(LS_KEYS.history, []);
    renderHistory();
    updateLanguage();
  }

  //==============================
  // 側邊選單開關功能
  //==============================
  sideMenuToggle.addEventListener("click", function(){
    document.getElementById("sideMenu").classList.toggle("collapsed");
    if(document.getElementById("sideMenu").classList.contains("collapsed")){
      sideMenuToggle.style.left = "0px";
    } else {
      sideMenuToggle.style.left = "250px";
    }
  });

  //==============================
  // Dark 模式切換
  //==============================
  function renderToggleBtn(){
    if(body.classList.contains("dark")){
      darkModeIcon.innerHTML = getSunSVG();
      darkModeText.textContent = translations[currentLang].darkMode.light;
    } else {
      darkModeIcon.innerHTML = getMoonSVG();
      darkModeText.textContent = translations[currentLang].darkMode.dark;
    }
    updateChartAxisColor();
  }
  function getSunSVG(){
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }
  function getMoonSVG(){
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.37 5.51A7 7 0 0 0 12 19a7 7 0 0 0 6.49-9.64A9 9 0 1 1 9.37 5.51z"/>
    </svg>`;
  }
  darkModeToggle.addEventListener("click", function(){
    body.classList.toggle("dark");
    renderToggleBtn();
    saveLS(LS_KEYS.darkMode, body.classList.contains("dark"));
  });

  //==============================
  // 桌面版快速滾動功能
  //==============================
  if(window.innerWidth > 768) {
    window.addEventListener("wheel", function(e) {
      e.preventDefault();
      const sections = Array.from(document.querySelectorAll("section"));
      const currentScroll = window.scrollY;
      let target = null;
      if(e.deltaY > 0){
        for(let i = 0; i < sections.length; i++){
          if(sections[i].offsetTop > currentScroll + 50){
            target = sections[i];
            break;
          }
        }
      } else {
        for(let i = sections.length - 1; i >= 0; i--){
          if(sections[i].offsetTop < currentScroll - 50){
            target = sections[i];
            break;
          }
        }
      }
      if(target) target.scrollIntoView({ behavior: "smooth" });
    }, {passive: false});
  }

  //==============================
  // 桌面版頁面導航按鈕
  //==============================
  let ticking = false;
  window.addEventListener("scroll", function(){
    if (!ticking) {
      window.requestAnimationFrame(function(){
        if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 150){
          document.getElementById("hiddenCredits").classList.add("visible");
        } else {
          document.getElementById("hiddenCredits").classList.remove("visible");
        }
        updateSideMenuHighlight();
        ticking = false;
      });
      ticking = true;
    }
  });
  navTopBtn.addEventListener("click", function(){
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  navPrevBtn.addEventListener("click", function(){
    const sections = Array.from(document.querySelectorAll("section"));
    const currentScroll = window.scrollY;
    let target = null;
    for(let i = sections.length - 1; i >= 0; i--){
      if(sections[i].offsetTop < currentScroll - 50){
        target = sections[i];
        break;
      }
    }
    if(target) target.scrollIntoView({ behavior: "smooth" });
  });
  navNextBtn.addEventListener("click", function(){
    const sections = Array.from(document.querySelectorAll("section"));
    const currentScroll = window.scrollY;
    let target = null;
    for(let i = 0; i < sections.length; i++){
      if(sections[i].offsetTop > currentScroll + 50){
        target = sections[i];
        break;
      }
    }
    if(target) target.scrollIntoView({ behavior: "smooth" });
  });

  function updateSideMenuHighlight() {
    const sections = document.querySelectorAll("section");
    let currentSectionId = "";
    sections.forEach(sec => {
      if(window.scrollY >= sec.offsetTop - 100) {
        currentSectionId = sec.id;
      }
    });
    document.querySelectorAll("#sideMenu a").forEach(link => {
      if(link.getAttribute("href") === "#" + currentSectionId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  //==============================
  // BigInt 版本換算：回合轉卡片
  //==============================
  function roundsToCards(t){
    let T;
    try { T = BigInt(t); } catch(e){ return 0n; }
    if(T < 1n) return 0n;
    const baseThreshold = BigInt(CONFIG.baseThreshold);
    let r = T < baseThreshold ? T : baseThreshold;
    const baseArray = CONFIG.baseArray.map(x => BigInt(x));
    let base = (r / 5n) * 8n + baseArray[Number(r % 5n)];
    let extra = 0n;
    CONFIG.extraRanges.forEach(range => {
      let a = BigInt(range.a);
      let b = (range.b === Infinity) ? T : BigInt(range.b);
      let f = BigInt(range.f);
      if(T >= a){
        let x = T < b ? T : b;
        let term1 = x - a + 1n;
        let term2 = ((x + 1n) / 2n) - (a / 2n);
        extra += 2n * f * (term1 + 2n * term2);
      }
    });
    return base + extra;
  }
  //==============================
  // BigInt 版本換算：卡片轉回合
  //==============================
  function cardsToRounds(x){
    let X;
    try { X = BigInt(x); } catch(e){ return 0n; }
    if(X < 1n) return 0n;
    let l = 1n, h = 1n;
    while(roundsToCards(h) < X){ h *= 2n; }
    while(l < h){
      let m = (l + h) / 2n;
      if(roundsToCards(m) < X) l = m + 1n; else h = m;
    }
    return l;
  }

  //==============================
  // 換算過程打字動畫
  //==============================
  function animateProcessText(text) {
    if(processTextCache === text) return;
    processTextCache = text;
    typewriterIndex = 0;
    if(typewriterInterval) clearInterval(typewriterInterval);
    processInfo.innerHTML = "";
    let currentBlinker = null;
    typewriterInterval = setInterval(() => {
      if(typewriterIndex < text.length) {
        if(currentBlinker) {
          currentBlinker.remove();
          currentBlinker = null;
        }
        let charSpan = document.createElement("span");
        charSpan.className = "char";
        charSpan.textContent = text[typewriterIndex];
        let blinker = document.createElement("span");
        blinker.className = "blinker";
        blinker.textContent = "●";
        charSpan.appendChild(blinker);
        currentBlinker = blinker;
        processInfo.appendChild(charSpan);
        requestAnimationFrame(() => { charSpan.style.opacity = "1"; });
        typewriterIndex++;
      } else {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
      }
    }, 2);
  }

  //==============================
  // 更新換算結果與過程
  //==============================
  function updateResult(){
    let inputStr = inputValueElem.value.trim();
    if(!/^\d+$/.test(inputStr) || inputStr === "0"){
      resultDiv.innerText = translations[currentLang].calculator.invalidInput;
      resultDiv.classList.add("visible");
      return;
    }
    saveLS(LS_KEYS.lastInput, inputStr);
    let calcResult;
    if(mode === "r2c"){
      calcResult = roundsToCards(inputStr);
      resultDiv.innerText = "→ " + calcResult.toString() + translations[currentLang].units.r2c;
    } else {
      calcResult = cardsToRounds(inputStr);
      resultDiv.innerText = "→ " + calcResult.toString() + translations[currentLang].units.c2r;
    }
    resultDiv.classList.add("visible");
    updateProcessInfo(inputStr);
    addHistoryRecord(Date.now(), mode, inputStr);
  }
  function updateProcessInfo(inputStr){
    if(resultDiv.innerText.trim() === "→") return;
    if(!/^\d+$/.test(inputStr) || inputStr === "0"){
      processInfo.innerHTML = "<pre>" + translations[currentLang].calculator.invalidInput + "</pre>";
      return;
    }
    let explanation = "";
    if(mode === "r2c"){
      explanation += translations[currentLang].process.r2cTitle + "\n\n";
      const r = BigInt(inputStr) < BigInt(CONFIG.baseThreshold) ? BigInt(inputStr) : BigInt(CONFIG.baseThreshold);
      const baseCalc = (r / 5n) * 8n;
      const baseArray = CONFIG.baseArray.map(x => BigInt(x));
      const lookup = baseArray[Number(r % 5n)];
      let subtotal = baseCalc + lookup;
      explanation += translations[currentLang].process.r2cStep1 + "\n";
      explanation += translations[currentLang].process.r2cLine1.replace("{input}", inputStr).replace("{r}", r.toString()) + "\n";
      explanation += translations[currentLang].process.r2cLine2.replace("{r}", r.toString()).replace("{baseCalc}", baseCalc.toString()) + "\n";
      explanation += translations[currentLang].process.r2cLine3.replace("{mod}", (r % 5n).toString()).replace("{lookup}", lookup.toString()) + "\n";
      explanation += translations[currentLang].process.r2cLine4.replace("{subtotal}", subtotal.toString()) + "\n\n";
      let extraTotal = 0n;
      if(BigInt(inputStr) > BigInt(CONFIG.baseThreshold)){
        explanation += translations[currentLang].process.r2cStep2 + "\n";
        CONFIG.extraRanges.forEach(range => {
          let a = BigInt(range.a);
          let b = (range.b === Infinity) ? BigInt(inputStr) : BigInt(range.b);
          let f = BigInt(range.f);
          if(BigInt(inputStr) >= a){
            let x = BigInt(inputStr) < b ? BigInt(inputStr) : b;
            let term1 = x - a + 1n;
            let term2 = ((x + 1n) / 2n) - (a / 2n);
            let extra = 2n * f * (term1 + 2n * term2);
            explanation += translations[currentLang].process.r2cLineExtra
              .replace("{a}", a.toString())
              .replace("{b}", (b === BigInt(inputStr) ? inputStr : b.toString()))
              .replace("{f}", f.toString())
              .replace("{extra}", extra.toString()) + "\n";
            extraTotal += extra;
          }
        });
        explanation += "\n" + translations[currentLang].process.r2cStep3
          .replace("{subtotal}", subtotal.toString())
          .replace("{extraTotal}", extraTotal.toString())
          .replace("{result}", roundsToCards(inputStr).toString()) + "\n";
      }
    } else {
      explanation += translations[currentLang].process.c2rTitle + "\n\n";
      explanation += translations[currentLang].process.c2rStep1 + "\n";
      let low = 1n, high = 1n;
      while(roundsToCards(high) < BigInt(inputStr)){ high *= 2n; }
      explanation += translations[currentLang].process.c2rStep2.replace("{high}", high.toString()) + "\n";
      while(low < high){
        let mid = (low + high) / 2n;
        explanation += translations[currentLang].process.c2rStep3.replace("{mid}", mid.toString()).replace("{cards}", roundsToCards(mid).toString()) + "\n";
        if(roundsToCards(mid) < BigInt(inputStr)) low = mid + 1n; else high = mid;
      }
      explanation += translations[currentLang].process.c2rStep4.replace("{result}", low.toString()) + "\n";
    }
    animateProcessText(explanation);
  }
  function addHistoryRecord(time, mode, inputVal){
    const record = { time, mode, input: inputVal, result: resultDiv.innerText };
    historyData.push(record);
    saveLS(LS_KEYS.history, historyData);
    renderHistory();
  }
  function renderHistory(){
    historyTableBody.innerHTML = "";
    historyData.forEach(record => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${new Date(record.time).toLocaleString()}</td>
                      <td>${record.mode}</td>
                      <td>${record.input}</td>
                      <td>${record.result}</td>`;
      historyTableBody.appendChild(tr);
    });
  }
  function updateChartAxisColor(){
    if(myChart){
      myChart.options.scales.x.ticks.color = body.classList.contains("dark") ? "#fff" : "#333";
      myChart.options.scales.y.ticks.color = body.classList.contains("dark") ? "#fff" : "#333";
      myChart.update();
    }
  }
  function populateTables(){
    const r2cValues = [111,200,300,1000,1500,2000,2500,10000,20000];
    const c2rValues = [40,400,4000,8000,12000,16000,20000,40000,400000];
    r2cValues.forEach(rounds => {
      const cards = roundsToCards(rounds);
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${rounds}</td><td>${cards.toString()}</td>`;
      r2cTableBody.appendChild(tr);
    });
    c2rValues.forEach(cards => {
      const rounds = cardsToRounds(cards);
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${cards}</td><td>${rounds.toString()}</td>`;
      c2rTableBody.appendChild(tr);
    });
  }
  function generateChart(){
    const dataPoints = [];
    const maxRounds = CONFIG.chart.maxRounds;
    const step = CONFIG.chart.step;
    for(let r=0; r<=maxRounds; r+=step){
      dataPoints.push({x: r, y: Number(roundsToCards(r))});
    }
    const maxY = Number(roundsToCards(maxRounds));
    const ctx = document.getElementById("chart").getContext("2d");
    if(myChart) myChart.destroy();
    const t = translations[currentLang];
    const datasetOptions = {
      label: t.chart.yAxis,
      data: dataPoints,
      borderColor: "rgba(75,192,192,1)",
      backgroundColor: "rgba(75,192,192,0.2)",
      pointRadius: togglePointsCheckbox.checked ? 4 : 0,
      fill: false,
      tension: 0.15
    };
    const chartOptions = {
      type: currentChartType,
      data: { datasets: [ datasetOptions ] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeInOutQuad' },
        plugins: {
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function(context){
                return t.chart.xAxis + ": " + context.parsed.x + ", " + t.chart.yAxis + ": " + context.parsed.y;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: t.chart.xAxis },
            min: 0,
            max: maxRounds,
            ticks: { font: { size: 14 }, color: body.classList.contains("dark") ? "#fff" : "#333" },
            grid: { display: toggleGridCheckbox.checked }
          },
          y: {
            title: { display: true, text: t.chart.yAxis },
            min: 0,
            max: maxY,
            ticks: { stepSize: 3000, callback: function(value) { return Math.round(value); }, font: { size: 14 }, color: body.classList.contains("dark") ? "#fff" : "#333" }
          }
        }
      }
    };
    myChart = new Chart(ctx, chartOptions);
  }

  //==============================
  // 事件綁定
  //==============================
  calcBtn.addEventListener("click", updateResult);
  processBtn.addEventListener("click", function(){
    processInfo.classList.toggle("visible");
    addProcessTopBtn();
  });
  btnR2C.addEventListener("click", function(){
    mode = "r2c";
    btnR2C.classList.add("active");
    btnC2R.classList.remove("active");
    saveLS(LS_KEYS.mode, mode);
    updateResult();
  });
  btnC2R.addEventListener("click", function(){
    mode = "c2r";
    btnC2R.classList.add("active");
    btnR2C.classList.remove("active");
    saveLS(LS_KEYS.mode, mode);
    updateResult();
  });
  langSelect.addEventListener("change", function(){
    currentLang = langSelect.value;
    updateLanguage();
  });
  // 更新語系文字內容
function updateLanguage(){
  const t = translations[currentLang];
  // 更新網頁標題
  document.title = t.calculator.title;
  
  // 更新側邊選單
  document.getElementById("menuCalculator").textContent = t.nav.calculator;
  document.getElementById("menuCommon").textContent = t.nav.common;
  document.getElementById("menuChartSection").textContent = t.nav.chartSection;
  document.getElementById("menuHistory").textContent = t.nav.history;
  
  // 更新 Calculator 模組
  const calcHeading = document.querySelector("#calculator h2");
  if(calcHeading) calcHeading.textContent = t.calculator.title;
  const inputLabel = document.querySelector("label[for='inputValue']");
  if(inputLabel) inputLabel.textContent = t.calculator.inputLabel;
  if(calcBtn) calcBtn.textContent = t.calculator.calcBtn;
  if(processBtn) processBtn.textContent = t.calculator.processBtn;
  
  // 更新 Common 模組
  const commonHeading = document.querySelector("#common h2");
  if(commonHeading) commonHeading.textContent = t.common.title;
  const commonTables = document.querySelectorAll("#common .table-box h3");
  if(commonTables.length >= 2){
    commonTables[0].textContent = t.common.r2c;
    commonTables[1].textContent = t.common.c2r;
  }
  
  // 更新 Chart 模組
  const chartHeading = document.querySelector("#chartSection h2");
  if(chartHeading) chartHeading.textContent = t.chart.title;
  const chartTypeLabel = document.querySelector("label[for='chartType']");
  if(chartTypeLabel) chartTypeLabel.textContent = t.chart.chartTypeLabel;
  const annotationsLabel = document.getElementById("annotationsLabel");
  if(annotationsLabel) annotationsLabel.textContent = t.chart.showAnnotationsLabel;
  const pointsLabel = document.getElementById("pointsLabel");
  if(pointsLabel) pointsLabel.textContent = t.chart.showPointsLabel;
  const gridLabel = document.getElementById("gridLabel");
  if(gridLabel) gridLabel.textContent = t.chart.showGridLabel;
  
  // 更新 History 模組
  const historyHeading = document.querySelector("#history h2");
  if(historyHeading) historyHeading.textContent = t.history.title;
  if(clearHistoryBtn) clearHistoryBtn.textContent = t.history.clearHistory;
  
  // 更新頁尾 Credits
  const hiddenCredits = document.getElementById("hiddenCredits");
  if(hiddenCredits) hiddenCredits.textContent = t.credits;
}

  clearHistoryBtn.addEventListener("click", function(){
    historyData = [];
    saveLS(LS_KEYS.history, historyData);
    renderHistory();
  });

  function addProcessTopBtn(){
    if(!document.getElementById("processTopBtn")){
      const topBtn = document.createElement("button");
      topBtn.id = "processTopBtn";
      topBtn.innerHTML = "⥔";
      topBtn.addEventListener("click", function(){
        processInfo.scrollTo({ top: 0, behavior: "smooth" });
      });
      processInfo.appendChild(topBtn);
    }
  }

  //==============================
  // 初始化
  //==============================
  document.addEventListener("DOMContentLoaded", function(){
    initPreferences();
    populateTables();
    generateChart();
  });
})();
