(function(){
  "use strict";

  var state = { country: "jp", krMode: "general" };

  try {
    var savedC = localStorage.getItem("qc_country");
    if (savedC === "jp" || savedC === "kr") state.country = savedC;
  } catch(e) {}

  var app = document.getElementById("app");
  var amountInput = document.getElementById("amount");
  var amountLabel = document.getElementById("amount-label");
  var currencyPrefix = document.getElementById("currency-prefix");
  var calcTitle = document.getElementById("calc-title");
  var krModeWrap = document.getElementById("kr-mode-wrap");
  var bigItemCheckbox = document.getElementById("bigitem");
  var bigItemWrap = document.getElementById("bigitem-wrap");
  var resultTotal = document.getElementById("result-total");
  var breakdownEl = document.getElementById("breakdown");
  var termsJp = document.getElementById("terms-jp");
  var termsKr = document.getElementById("terms-kr");
  var overlay = document.getElementById("quote-overlay");
  var closeBtn = document.getElementById("quote-close");
  var quoteBtn = document.getElementById("quote-btn");

  // 本次代購匯率／手續費 — 需要調整時直接改這裡的數字即可
  var DEFAULT_RATES = { fee: 1.5, jpy: 0.23, krw: 40, usd: 33.5, big: 300 };
  var quoteOpen = false;

  function getRates(){
    return {
      fee: DEFAULT_RATES.fee / 100,
      jpy: DEFAULT_RATES.jpy,
      krw: DEFAULT_RATES.krw,
      usd: DEFAULT_RATES.usd,
      big: DEFAULT_RATES.big
    };
  }

  function fmtNT(n){ return "NT$ " + Math.round(n).toLocaleString("zh-Hant-TW"); }
  function fmtSrc(n, cur){
    var sym = cur === "JPY" ? "¥" : cur === "KRW" ? "₩" : "$";
    return sym + Math.round(n).toLocaleString("zh-Hant-TW");
  }

  function openQuote(){
    quoteOpen = true;
    overlay.hidden = false;
    closeBtn.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeQuote(){
    quoteOpen = false;
    overlay.hidden = true;
    closeBtn.hidden = true;
    document.body.style.overflow = "";
  }

  function requestQuote(){
    recalc();
    var price = parseFloat(amountInput.value);
    if (!price || price <= 0) {
      amountInput.focus();
      return;
    }
    openQuote();
  }

  function setCountry(c){
    state.country = c;
    app.setAttribute("data-country", c);
    document.querySelectorAll(".switch button").forEach(function(b){
      b.setAttribute("aria-pressed", b.getAttribute("data-c") === c ? "true" : "false");
    });
    try { localStorage.setItem("qc_country", c); } catch(e) {}

    if (c === "jp") {
      calcTitle.textContent = "日本代購報價試算";
      krModeWrap.hidden = true;
      amountLabel.textContent = "商品售價（日幣）";
      currencyPrefix.textContent = "¥";
      amountInput.placeholder = "輸入日本售價";
      termsJp.hidden = false;
      termsKr.hidden = true;
    } else {
      calcTitle.textContent = "韓國代購報價試算";
      krModeWrap.hidden = false;
      updateKrLabel();
      termsJp.hidden = true;
      termsKr.hidden = false;
    }
    bigItemWrap.classList.toggle("on", bigItemCheckbox.checked);
  }

  function updateKrLabel(){
    if (state.krMode === "general") {
      amountLabel.textContent = "商品售價（韓幣）";
      currencyPrefix.textContent = "₩";
      amountInput.placeholder = "輸入韓國售價";
    } else {
      amountLabel.textContent = "商品售價（美金／樂天免稅店）";
      currencyPrefix.textContent = "$";
      amountInput.placeholder = "輸入美金售價";
    }
  }

  function setKrMode(m){
    state.krMode = m;
    document.querySelectorAll(".seg button").forEach(function(b){
      b.setAttribute("aria-pressed", b.getAttribute("data-m") === m ? "true" : "false");
    });
    updateKrLabel();
  }

  function recalc(){
    var price = parseFloat(amountInput.value);
    var rates = getRates();
    var big = bigItemCheckbox.checked;
    bigItemWrap.classList.toggle("on", big);

    if (!price || price <= 0) {
      resultTotal.textContent = "NT$ 0元";
      breakdownEl.innerHTML = "";
      return;
    }

    var afterFee, converted, cur, rateLabel;
    if (state.country === "jp") {
      cur = "JPY";
      afterFee = price * (1 + rates.fee);
      converted = afterFee * rates.jpy;
      rateLabel = "× " + rates.jpy + "（匯率）";
    } else if (state.krMode === "general") {
      cur = "KRW";
      afterFee = price * (1 + rates.fee);
      converted = afterFee / rates.krw;
      rateLabel = "÷ " + rates.krw + "（匯率）";
    } else {
      cur = "USD";
      afterFee = price * (1 + rates.fee);
      converted = afterFee * rates.usd;
      rateLabel = "× " + rates.usd + "（匯率）";
    }

    afterFee = Math.round(afterFee);
    converted = Math.round(converted);
    var total = converted + (big ? rates.big : 0);
    resultTotal.textContent = fmtNT(total) + "元";

    var rows = [];
    rows.push(["商品售價", fmtSrc(price, cur)]);
    rows.push(["刷卡手續費 +" + (rates.fee * 100).toFixed(1) + "%", fmtSrc(afterFee, cur)]);
    rows.push(["匯率換算 " + rateLabel, fmtNT(converted)]);
    if (big) rows.push(["大體積代購費", "+ " + fmtNT(rates.big)]);

    breakdownEl.innerHTML = rows.map(function(r){
      return '<div class="row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join("");
  }

  document.querySelectorAll(".switch button").forEach(function(b){
    b.addEventListener("click", function(){ setCountry(b.getAttribute("data-c")); });
  });
  document.querySelectorAll(".seg button").forEach(function(b){
    b.addEventListener("click", function(){ setKrMode(b.getAttribute("data-m")); });
  });
  quoteBtn.addEventListener("click", requestQuote);
  amountInput.addEventListener("keydown", function(e){
    if (e.key === "Enter") {
      e.preventDefault();
      requestQuote();
    }
  });
  bigItemCheckbox.addEventListener("change", function(){
    bigItemWrap.classList.toggle("on", bigItemCheckbox.checked);
  });

  closeBtn.addEventListener("click", closeQuote);
  overlay.addEventListener("click", function(e){
    if (e.target === overlay) closeQuote();
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && quoteOpen) closeQuote();
  });

  setCountry(state.country);
})();
