/*
 * 겨울 간식 포장마차 — 화면과 입력
 * 키보드: ←→ 작업대 고르기 / 스페이스 하기(꾹 = 계속) / ↑↓ 고르기·조절 / 엔터 손님에게 주기 / Esc 메뉴
 * 마우스: 클릭 = 스페이스, 꾹 클릭 = 스페이스 꾹, 화면의 ▲▼ 버튼 = ↑↓
 * 터치:   탭, 길게 누르기, 문지르기(연타 대신)
 */
(function () {
  "use strict";

  var CFG = GAME_CONFIG;
  var W = 393, H = 852;
  var COUNTER = { x: 10, y: 338, w: 373, h: 84 };
  var RUB_STEP = 60; // 문지르기 이만큼(px)이 연타 1번

  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage");

  var screen = "menu";       // menu | play | over
  var menuIndex = 0;
  var snackId = null, L = null, V = null, g = null, st = null;
  var ids = [], focus = 0;
  var holdId = null, pointer = null;
  var running = false, lastT = 0, scale = 1;
  var inputMode = matchMedia("(hover: none)").matches ? "touch" : "mouse";
  var lastPop = {};
  var tut = null;            // 튜토리얼 진행 상태

  // ── 화면 맞추기 ─────────────────────────────
  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = "scale(" + scale + ")";
    stage.style.setProperty("--fit", "scale(" + scale + ")");
  }

  // ── 눈 ─────────────────────────────────────
  function makeSnow() {
    var box = $("snow"), html = "";
    for (var i = 0; i < 38; i++) {
      var size = 2 + Math.random() * 4;
      html += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;width:" + size.toFixed(1) + "px;height:" + size.toFixed(1) +
        "px;animation-duration:" + (6 + Math.random() * 8).toFixed(1) + "s;animation-delay:-" + (Math.random() * 12).toFixed(1) +
        "s;opacity:" + (0.4 + Math.random() * 0.5).toFixed(2) + '"></i>';
    }
    box.innerHTML = html;
  }

  // ── 메뉴 ───────────────────────────────────
  function menuArt(id) {
    if (Assets.has("menu_" + id)) return Assets.img("menu_" + id, "menu-img");
    if (id === "bungeo") return '<div class="menu-fish">' + Kit.fish("#dd9440", "#8a4a10", Kit.fishDetails("#8a4a10")) + "</div>";
    if (id === "hotteok") return '<div class="menu-disc"></div>';
    return '<div class="menu-emoji">🍢</div>';
  }

  function renderMenu() {
    $("menuCards").innerHTML = CFG.snackOrder.map(function (id, i) {
      var s = CFG.snacks[id];
      return '<div class="menu-col"><button type="button" class="menu-card' + (i === menuIndex ? " selected" : "") + '" data-snack="' + id + '">' +
        menuArt(id) + '<span class="menu-name">' + s.name + '</span><span class="menu-price">' + s.price.toLocaleString("ko-KR") +
        '원</span><span class="menu-best">' + (tutDone(id) ? "최고 " + readBest(id).toLocaleString("ko-KR") + "원" : "처음이면 튜토리얼부터") +
        '</span></button><button type="button" class="tut-chip" data-tut="' + id + '">튜토리얼</button></div>';
    }).join("");
  }

  function showMenu() {
    running = false;
    screen = "menu";
    releaseHold();
    $("overScreen").hidden = true;
    $("tutDone").hidden = true;
    $("menuScreen").hidden = false;
    tut = null;
    stage.classList.remove("in-tutorial");
    $("tut").innerHTML = "";
    renderMenu();
  }

  // ── 게임 시작 ──────────────────────────────
  function start(id, tutorial) {
    snackId = id;
    $("tutDone").hidden = true;
    L = SNACK_LOGIC[id];
    V = SNACK_VIEW[id];
    g = GameCore.create(CFG.common, CFG.snacks[id], L.flavors);
    st = L.create(CFG.snacks[id]);
    g.tutorial = !!tutorial;
    tut = tutorial ? { script: TUTORIALS[id], step: -1, wantFocus: null, html: "" } : null;
    stage.classList.toggle("in-tutorial", !!tut);
    $("tut").innerHTML = "";
    ids = L.stations(st).concat(["counter"]);
    focus = 0;
    holdId = null;
    pointer = null;
    buildStations();
    $("street").innerHTML = "";
    customerEls = {};
    $("menuScreen").hidden = true;
    $("overScreen").hidden = true;
    stage.dataset.snack = id;
    screen = "play";
    running = true;
    lastT = performance.now();
    render();
    requestAnimationFrame(loop);
  }

  // ── 작업대 DOM ─────────────────────────────
  var stationEls = {};

  function buildStations() {
    var box = $("stations");
    box.innerHTML = "";
    stationEls = {};
    ids.forEach(function (id, i) {
      var lay = id === "counter" ? COUNTER : V.layout[id];
      var el = document.createElement("div");
      el.className = "station st-" + id.replace(/\d/, "");
      el.dataset.id = id;
      el.style.left = lay.x + "px";
      el.style.top = lay.y + "px";
      el.style.width = lay.w + "px";
      el.style.height = lay.h + "px";
      el.innerHTML = '<div class="st-body"></div><div class="st-buttons"></div>' +
        '<div class="st-label"><b>' + (i + 1) + "</b>" + (id === "counter" ? "주기" : lay.label) + "</div>";
      box.appendChild(el);
      stationEls[id] = { el: el, body: el.children[0], btns: el.children[1], html: "", btnKey: "" };
    });
  }

  // ── 그리기 ─────────────────────────────────
  var customerEls = {};

  function renderHearts() {
    var box = $("hearts"), html = "";
    for (var i = 0; i < CFG.common.startHearts; i++) {
      var full = i < g.hearts, k = full ? "common_heart_full" : "common_heart_empty";
      html += '<span class="heart' + (full ? "" : " empty") + '">' + Assets.img(k, "fill", full ? "❤️" : "🤍") + "</span>";
    }
    if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
  }

  function orderHtml(cu) {
    return g.flavors.map(function (f) {
      if (!cu.need[f] && g.flavors.length > 1) return "";
      var name = g.flavors.length > 1 ? '<em class="fl-' + f + '">' + V.flavorNames[f] + "</em>" : "";
      return '<span class="order-item' + (cu.need[f] ? "" : " got") + '">' + Kit.itemIcon(V.items[f]) + name + "<b>×" + cu.need[f] + "</b></span>";
    }).join("");
  }

  function renderCustomers() {
    var street = $("street"), seen = {};
    g.customers.forEach(function (cu, i) {
      seen[cu.id] = true;
      var ref = customerEls[cu.id];
      if (!ref) {
        var el = document.createElement("div");
        el.className = "customer enter look" + cu.look;
        el.innerHTML = '<div class="bubble"></div><div class="patience"><i></i></div><div class="face"></div><div class="scarf"></div>';
        street.appendChild(el);
        void el.offsetWidth;
        el.classList.remove("enter");
        ref = customerEls[cu.id] = { el: el, order: "", mood: "" };
      }
      var el2 = ref.el;
      el2.classList.toggle("front", i === 0);
      el2.classList.toggle("back", i > 0);
      var oh = orderHtml(cu);
      if (ref.order !== oh) { el2.children[0].innerHTML = oh; ref.order = oh; }
      var r = cu.patience / cu.maxPatience, t = CFG.common.moodThresholds;
      var bar = el2.children[1].firstChild;
      bar.style.width = (r * 100).toFixed(1) + "%";
      bar.style.background = r >= t.happy ? "var(--good)" : r >= t.neutral ? "var(--warn)" : "var(--bad)";
      var mood = GameCore.mood(g, cu);
      if (ref.mood !== mood) {
        ref.mood = mood;
        el2.children[2].innerHTML = Assets.img("common_customer_" + mood, "face-img",
          '<span class="face-emoji">' + { happy: "😊", neutral: "😐", angry: "😠", furious: "🤬" }[mood] + "</span>");
        el2.classList.toggle("angry", mood === "angry");
      }
      if (cu.leaving) el2.classList.add("leave-" + cu.leaving);
    });
    Object.keys(customerEls).forEach(function (id) {
      if (!seen[id]) { customerEls[id].el.remove(); delete customerEls[id]; }
    });
  }

  function counterHtml() {
    var trays = g.flavors.map(function (f) {
      var name = g.flavors.length > 1 ? V.flavorNames[f] : "완성";
      return '<div class="tray' + (g.ready[f] ? "" : " empty") + '" data-serve="' + f + '">' +
        Kit.itemIcon(V.items[f]) + '<span class="tray-name">' + name + '</span><b class="tray-count">' + g.ready[f] + "</b></div>";
    }).join("");
    return '<div class="trays n' + g.flavors.length + '">' + trays + "</div>";
  }

  function hintFor(id) {
    if (id === "counter") {
      if (g.flavors.length > 1) return { act: "맛을 골라 앞 손님에게 주기", mode: null, up: "팥 주기", down: "슈크림 주기", go: true };
      return { act: "앞 손님에게 주기", mode: "tap", go: g.ready.plain > 0 };
    }
    return V.hint(g, st, id);
  }

  var MODE_TEXT = {
    key:   { tap: "스페이스", hold: "스페이스 꾹", mash: "스페이스 연타" },
    mouse: { tap: "클릭", hold: "꾹 클릭", mash: "연타" },
    touch: { tap: "탭", hold: "길게 누르기", mash: "연타·문지르기" }
  };

  function renderHintbar() {
    var id = ids[focus], h = hintFor(id), parts = [];
    if (h.mode) parts.push("<kbd>" + MODE_TEXT[inputMode][h.mode] + "</kbd> " + h.act);
    else parts.push(h.act);
    if (h.up) parts.push(inputMode === "key" ? "<kbd>↑</kbd> " + h.up + " <kbd>↓</kbd> " + h.down : "버튼으로 고르기");
    if (inputMode === "key" && h.alt) parts.push(h.alt);
    var nav = inputMode === "key" ? '<span class="nav"><kbd>←</kbd><kbd>→</kbd> 작업대</span>' : "";
    var html = '<span class="where">' + (id === "counter" ? "주기" : V.layout[id].label) + "</span>" + parts.join(" · ") + nav;
    var bar = $("hintbar");
    if (bar.dataset.html !== html) { bar.innerHTML = html; bar.dataset.html = html; }
  }

  function render() {
    renderHearts();
    $("score").textContent = g.score.toLocaleString("ko-KR");
    renderCustomers();

    ids.forEach(function (id, i) {
      var ref = stationEls[id];
      var html = id === "counter" ? counterHtml() : V.render(g, st, id, { holding: holdId === id });
      if (ref.html !== html) { ref.body.innerHTML = html; ref.html = html; }
      var h = hintFor(id);
      ref.el.classList.toggle("focused", i === focus);
      ref.el.classList.toggle("go", !!h.go && h.mode !== null && id !== "counter");
      ref.el.classList.toggle("holding", holdId === id);
      var btnKey = h.up && id !== "counter" ? h.up + "|" + h.down : "";
      if (ref.btnKey !== btnKey) {
        ref.btnKey = btnKey;
        ref.btns.innerHTML = btnKey ? '<button type="button" class="ud-btn" data-dir="up">▲ ' + h.up +
          '</button><button type="button" class="ud-btn" data-dir="down">▼ ' + h.down + "</button>" : "";
      }
    });
    renderHintbar();
    if (tut) renderTutorial();
  }

  // ── 튜토리얼 ───────────────────────────────
  function tutDone(id) {
    try { return localStorage.getItem("winter_tut_" + id) === "1"; } catch (e) { return false; }
  }
  function markTutDone(id) {
    try { localStorage.setItem("winter_tut_" + id, "1"); } catch (e) { /* 저장 불가 */ }
  }

  function updateTutorial() {
    var steps = tut.script.steps, p = tut.script.progress(g, st);
    if (p !== tut.step) {
      tut.step = p;
      if (p >= steps.length) {
        markTutDone(snackId);
        $("tut").innerHTML = "";
        tut.html = "";
        running = false;
        screen = "tutdone";
        releaseHold();
        setTimeout(function () { $("tutDone").hidden = false; }, 700);
        return;
      }
      tut.wantFocus = ids.indexOf(steps[p].focus);
      if (steps[p].serve && g.customers.length === 0) {
        var need = {};
        g.flavors.forEach(function (f) { need[f] = 0; });
        need[tut.script.serveFlavor(g)] = 1;
        GameCore.addCustomer(g, need);
      }
    }
    if (tut.wantFocus !== null && tut.wantFocus >= 0 && !holdId) { focus = tut.wantFocus; tut.wantFocus = null; }
  }

  function renderTutorial() {
    var box = $("tut");
    if (!tut || tut.step < 0 || tut.step >= tut.script.steps.length) return;
    var step = tut.script.steps[tut.step], warn = tut.script.warn(g, st);
    var html = (step.serve ? "" : '<div class="mentor" aria-hidden="true">👵</div>') +
      '<div class="tut-card' + (step.serve ? " serve" : "") + '">' +
      '<div class="tut-top"><span class="tut-step">' + (tut.step + 1) + " / " + tut.script.steps.length + '</span>' +
      '<button type="button" class="tut-skip" id="tutSkip">건너뛰기</button></div>' +
      '<p class="tut-text">' + (inputMode === "key" ? step.key : step.tap) + "</p>" +
      (warn ? '<p class="tut-warn">' + warn + "</p>" : "") + "</div>";
    if (tut.html !== html) { box.innerHTML = html; tut.html = html; }
    var target = step.focus;
    ids.forEach(function (id) { stationEls[id].el.classList.toggle("tut-target", id === target); });
  }

  // ── 효과 ───────────────────────────────────
  function posOf(at) {
    if (at === "customer") return [110, 190];
    if (at === "counter") return [COUNTER.x + COUNTER.w / 2, COUNTER.y + 10];
    var l = V.layout[at];
    return l ? [l.x + l.w / 2, l.y + l.h / 2 - 10] : [W / 2, H / 2];
  }

  function pop(text, at, cls) {
    var key = at + text, now = performance.now();
    if (cls === "small" && lastPop[key] && now - lastPop[key] < 900) return;
    lastPop[key] = now;
    var p = posOf(at), el = document.createElement("div");
    el.className = "pop " + (cls || "");
    el.textContent = text;
    el.style.left = p[0] + "px";
    el.style.top = p[1] + "px";
    $("fx").appendChild(el);
    setTimeout(function () { el.remove(); }, 1100);
  }

  function bump(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function handle(ev) {
    ev.forEach(function (e) {
      if (e.type === "pop") pop(e.text, e.at, e.cls);
      else if (e.type === "served") {
        pop("+" + e.earned.toLocaleString("ko-KR") + "원", "customer", "money");
        bump(document.querySelector(".score"), "bump");
      } else if (e.type === "heartLost") {
        bump($("flash"), "on");
        bump(stage, "shake");
        try { if (navigator.vibrate) navigator.vibrate(120); } catch (err) { /* 무시 */ }
      } else if (e.type === "gameOver") {
        setTimeout(showOver, 900);
      }
    });
  }

  // ── 동작 ───────────────────────────────────
  function act(fn) {
    if (screen !== "play" || g.over) return;
    var ev = [];
    fn(ev);
    handle(ev);
    render(); // 누르자마자 화면에 반영
  }

  function serve(flavor) {
    act(function (ev) {
      if (g.flavors.length > 1 && !flavor) {
        focus = ids.indexOf("counter");
        GameCore.pop(ev, "counter", "↑ 팥 / ↓ 슈크림을 골라 주세요", "small");
        return;
      }
      GameCore.serve(g, flavor || null, ev);
    });
  }

  function beginPress(id) {
    if (id === "counter") { if (g.flavors.length === 1) serve(); else serve(null); return; }
    releaseHold();
    act(function (ev) { L.press(g, st, id, ev); });
    holdId = id;
  }

  function releaseHold() {
    if (!holdId) return;
    var id = holdId;
    holdId = null;
    if (screen === "play") act(function (ev) { L.release(g, st, id, ev); });
  }

  function arrow(dir) {
    var id = ids[focus];
    if (id === "counter") {
      if (g.flavors.length > 1) serve(dir === "up" ? "red" : "cream");
      return;
    }
    act(function (ev) { L[dir](g, st, id, ev); });
  }

  function moveFocus(d) {
    releaseHold();
    focus = (focus + d + ids.length) % ids.length;
  }

  // ── 키보드 ─────────────────────────────────
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].indexOf(k) >= 0) e.preventDefault();
    inputMode = "key";

    if (screen === "menu") {
      if (k === "ArrowLeft") { menuIndex = (menuIndex + 2) % 3; renderMenu(); }
      else if (k === "ArrowRight") { menuIndex = (menuIndex + 1) % 3; renderMenu(); }
      else if ((k === " " || k === "Enter") && !e.repeat) { var mid = CFG.snackOrder[menuIndex]; start(mid, !tutDone(mid)); }
      else if (k === "t" || k === "T") start(CFG.snackOrder[menuIndex], true);
      return;
    }
    if (screen === "tutdone") {
      if ((k === " " || k === "Enter") && !e.repeat) start(snackId, false);
      else if (k === "Escape") showMenu();
      return;
    }
    if (screen === "over") {
      if ((k === " " || k === "Enter") && !e.repeat) start(snackId);
      else if (k === "Escape") showMenu();
      return;
    }
    if (k === "Escape") { showMenu(); return; }
    if (tut && (k === "s" || k === "S")) { markTutDone(snackId); start(snackId, false); return; }
    if (k === "ArrowLeft") moveFocus(-1);
    else if (k === "ArrowRight") moveFocus(1);
    else if (k === "ArrowUp" && !e.repeat) arrow("up");
    else if (k === "ArrowDown" && !e.repeat) arrow("down");
    else if (k === " " && !e.repeat) beginPress(ids[focus]);
    else if (k === "Enter" && !e.repeat) serve(null);
    else if (/^[1-9]$/.test(k) && +k <= ids.length) { releaseHold(); focus = +k - 1; }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === " " && screen === "play") releaseHold();
  });

  // ── 마우스 / 터치 ──────────────────────────
  function toStage(e) {
    var r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }

  stage.addEventListener("pointerdown", function (e) {
    inputMode = e.pointerType === "touch" ? "touch" : "mouse";
    var t = e.target, el;

    if (screen === "menu") {
      if ((el = t.closest(".tut-chip"))) start(el.dataset.tut, true);
      else if ((el = t.closest(".menu-card"))) start(el.dataset.snack, !tutDone(el.dataset.snack));
      return;
    }
    if (t.closest("#tutSkip")) { markTutDone(snackId); start(snackId, false); e.preventDefault(); return; }
    if (screen !== "play") return;

    if ((el = t.closest("[data-serve]"))) {
      focus = ids.indexOf("counter");
      serve(g.flavors.length > 1 ? el.dataset.serve : null);
    } else if (t.closest(".customer")) {
      serve(null);
    } else if ((el = t.closest(".ud-btn"))) {
      var sid = el.closest(".station").dataset.id;
      focus = ids.indexOf(sid);
      arrow(el.dataset.dir);
    } else if ((el = t.closest(".station"))) {
      var id = el.dataset.id;
      focus = ids.indexOf(id);
      beginPress(id);
      var p = toStage(e);
      pointer = { id: e.pointerId, station: id, x: p.x, y: p.y, acc: 0 };
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    } else {
      return;
    }
    e.preventDefault();
  });

  window.addEventListener("pointermove", function (e) {
    if (!pointer || pointer.id !== e.pointerId || screen !== "play") return;
    var p = toStage(e);
    pointer.acc += Math.hypot(p.x - pointer.x, p.y - pointer.y);
    pointer.x = p.x; pointer.y = p.y;
    if (!L.rubbable(st, pointer.station)) return;
    while (pointer.acc >= RUB_STEP) {
      pointer.acc -= RUB_STEP;
      act(function (ev) { L.press(g, st, pointer.station, ev); });
    }
  });

  function pointerEnd(e) {
    if (!pointer || pointer.id !== e.pointerId) return;
    pointer = null;
    releaseHold();
  }
  window.addEventListener("pointerup", pointerEnd);
  window.addEventListener("pointercancel", pointerEnd);
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  window.addEventListener("blur", releaseHold);

  // ── 루프 ───────────────────────────────────
  function loop(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    var ev = [];
    if (holdId) L.hold(g, st, holdId, dt, ev);
    L.update(g, st, dt, ev);
    GameCore.update(g, dt, ev);
    handle(ev);
    if (tut) updateTutorial();
    if (!running) return;
    render();
    if (g.over) { running = false; holdId = null; return; }
    requestAnimationFrame(loop);
  }

  // ── 결과 ───────────────────────────────────
  function readBest(id) {
    try { return parseInt(localStorage.getItem("winter_best_" + id) || "0", 10) || 0; } catch (e) { return 0; }
  }
  function writeBest(id, v) {
    try { localStorage.setItem("winter_best_" + id, String(v)); } catch (e) { /* 저장 불가 */ }
  }

  function showOver() {
    screen = "over";
    var best = readBest(snackId), isNew = g.score > best;
    if (isNew) writeBest(snackId, g.score);
    var s = CFG.snacks[snackId];
    $("overSnack").textContent = s.name + " 가게";
    $("finalScore").textContent = g.score.toLocaleString("ko-KR");
    $("finalDetail").textContent = s.name + " " + g.sold + "개를 팔았어요";
    $("finalBest").textContent = isNew && g.score > 0 ? "최고 기록이에요!" : "최고 기록 " + Math.max(best, g.score).toLocaleString("ko-KR") + "원";
    $("overScreen").hidden = false;
  }

  // ── 시작 ───────────────────────────────────
  $("menuBtn").addEventListener("click", showMenu);
  $("retryBtn").addEventListener("click", function () { start(snackId); });
  $("backBtn").addEventListener("click", showMenu);
  $("tutStartBtn").addEventListener("click", function () { start(snackId, false); });
  $("tutMenuBtn").addEventListener("click", showMenu);
  window.addEventListener("resize", fit);
  fit();
  makeSnow();
  renderMenu();
  Assets.preload("assets/", function () { if (screen === "menu") renderMenu(); });
})();
