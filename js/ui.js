/*
 * 호떡 만들기 — 화면 그리기와 터치 입력
 * 규칙은 logic.js, 숫자는 config.js에 있습니다.
 */
(function () {
  "use strict";

  var CFG = HOTTEOK_CONFIG;
  var L = HotteokLogic;
  var A = HotteokAssets;
  var W = 393, H = 852;

  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage");

  var state = null;
  var running = false;
  var lastT = 0;
  var scale = 1;
  var actions = {};     // pointerId → { kind, index, x, y }
  var lastHint = {};    // 같은 안내가 너무 자주 뜨지 않게

  // 화면 위치 (팝업 표시용, 393×852 기준)
  var STOVE = { x: 20, y: 548, w: 353, h: 252 };
  var SPOT = { tray: [70, 455], bowl: [197, 455], plate: [324, 455] };
  var DOUGH_POS = [[14, 32], [60, 32], [37, 58]];

  // ── 화면 크기 맞추기 ───────────────────────
  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.setProperty("--fit", "scale(" + scale + ")");
    stage.style.transform = "scale(" + scale + ")";
  }

  // ── 에셋 적용 ─────────────────────────────
  function useAsset(el, key) {
    if (!A.has(key)) return false;
    var img = el.querySelector("img.asset");
    if (!img) {
      img = document.createElement("img");
      img.className = "asset";
      img.alt = "";
      img.draggable = false;
      el.appendChild(img);
    }
    img.src = A.src(key);
    el.classList.add("has-img");
    return true;
  }

  function applyStaticAssets() {
    var els = document.querySelectorAll("[data-asset]");
    for (var i = 0; i < els.length; i++) useAsset(els[i], els[i].getAttribute("data-asset"));
    if (A.has("pan")) {
      document.querySelectorAll(".slot").forEach(function (s) { s.classList.add("has-img-pan"); });
    }
  }

  // ── DOM 만들기 ────────────────────────────
  var heartEls = [], customerEls = [], slotEls = [], doughEls = [];

  function build() {
    var hearts = $("hearts");
    hearts.innerHTML = "";
    heartEls = [];
    for (var h = 0; h < CFG.startHearts; h++) {
      var he = document.createElement("div");
      he.className = "heart";
      hearts.appendChild(he);
      heartEls.push(he);
    }

    var street = $("customers");
    street.innerHTML = "";
    customerEls = [];
    for (var c = 0; c < CFG.maxCustomers; c++) {
      var ce = document.createElement("div");
      ce.className = "customer";
      ce.dataset.index = c;
      ce.style.left = (2 + c * (W - 4) / CFG.maxCustomers) + "px";
      ce.style.width = ((W - 4) / CFG.maxCustomers) + "px";
      ce.innerHTML = '<div class="bubble"></div><div class="patience"><i></i></div><div class="face"></div>';
      ce.hidden = true;
      street.appendChild(ce);
      customerEls.push({ el: ce, id: null, key: "", moodKey: "" });
    }

    var slots = $("slots");
    slots.innerHTML = "";
    slotEls = [];
    CFG.panSlots.forEach(function (p, i) {
      var se = document.createElement("div");
      se.className = "slot";
      se.dataset.index = i;
      se.style.left = p.x + "%";
      se.style.top = p.y + "%";
      se.innerHTML = '<div class="hotteok" hidden></div><div class="gauge"></div><div class="slot-hint"></div>';
      slots.appendChild(se);
      slotEls.push({ el: se, hot: se.children[0], gauge: se.children[1], hint: se.children[2], lastState: "", gaugeKey: "" });
    });

    var balls = $("doughBalls");
    balls.innerHTML = "";
    doughEls = [];
    for (var d = 0; d < CFG.doughPlateCapacity; d++) {
      var de = document.createElement("div");
      de.className = "dough";
      de.dataset.index = d;
      var pos = DOUGH_POS[d % DOUGH_POS.length];
      de.style.left = pos[0] + "px";
      de.style.top = pos[1] + "px";
      de.innerHTML = '<div class="ring"><i></i></div><div class="ball"></div>';
      de.hidden = true;
      balls.appendChild(de);
      doughEls.push(de);
    }

    // 철판 위 호떡 이미지 레이어
    if (A.has("hotteok_raw")) {
      slotEls.forEach(function (s) {
        s.hot.classList.add("imgmode");
        ["hotteok_raw", "hotteok_golden", "hotteok_burnt", "hotteok_burst"].forEach(function (k) {
          var img = document.createElement("img");
          img.className = "asset";
          img.alt = "";
          img.dataset.layer = k;
          img.src = A.src(k) || "";
          s.hot.appendChild(img);
        });
      });
    }
  }

  // ── 그리기 ───────────────────────────────
  function lerpColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
    var g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
    var bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function cookColor(v) {
    if (v <= 1) return lerpColor("#f3dcae", "#d98a2b", v);
    return lerpColor("#d98a2b", "#3a2414", (v - 1) / (CFG.cookBurnt - 1));
  }

  function render() {
    var s = state;

    // 하트
    heartEls.forEach(function (he, i) {
      var full = i < s.hearts;
      var key = full ? "heart_full" : "heart_empty";
      if (he.dataset.key === key) return;
      he.dataset.key = key;
      he.innerHTML = "";
      he.classList.remove("has-img");
      if (!useAsset(he, key)) he.textContent = full ? "❤️" : "🤍";
    });

    // 점수
    $("score").textContent = s.score.toLocaleString("ko-KR");

    // 손님
    s.customers.forEach(function (cu, i) {
      var ref = customerEls[i], el = ref.el;
      if (!cu) {
        if (ref.id !== null) { el.hidden = true; ref.id = null; }
        return;
      }
      if (ref.id !== cu.id) {
        ref.id = cu.id;
        ref.key = "";
        ref.moodKey = "";
        el.hidden = false;
        el.className = "customer enter";
        void el.offsetWidth;
        el.className = "customer";
      }
      var key = cu.order + "-" + cu.received;
      if (ref.key !== key) {
        ref.key = key;
        var dots = "";
        for (var k = 0; k < cu.order; k++) dots += '<span class="order-dot' + (k < cu.received ? " got" : "") + '"></span>';
        el.children[0].innerHTML = dots;
      }
      var ratio = cu.patience / cu.maxPatience;
      var bar = el.children[1].firstChild;
      bar.style.width = (ratio * 100) + "%";
      bar.style.background = ratio >= CFG.moodThresholds.happy ? "var(--good)"
        : ratio >= CFG.moodThresholds.neutral ? "var(--warn)" : "var(--bad)";

      var mood = L.mood(s, cu);
      if (ref.moodKey !== mood) {
        ref.moodKey = mood;
        var face = el.children[2];
        face.innerHTML = "";
        face.classList.remove("has-img");
        if (!useAsset(face, "customer_" + mood)) {
          var em = { happy: "😊", neutral: "😐", angry: "😠", furious: "🤬" }[mood];
          face.innerHTML = '<span class="face-emoji">' + em + "</span>";
        }
        el.classList.toggle("angry", mood === "angry");
      }
      if (cu.leaving === "happy") el.classList.add("leave-happy");
      if (cu.leaving === "angry") el.classList.add("leave-angry");
    });

    // 완성 접시
    $("trayCount").textContent = s.ready;
    $("trayCount").classList.toggle("zero", s.ready === 0);
    var stack = $("trayStack");
    var shown = Math.min(s.ready, 5);
    if (stack.childElementCount !== shown) {
      stack.innerHTML = "";
      for (var t = 0; t < shown; t++) {
        var m = document.createElement("div");
        m.className = "mini";
        m.style.top = (46 - t * 9) + "px";
        if (A.has("hotteok_golden")) {
          m.style.background = "url(" + A.src("hotteok_golden") + ") center/contain no-repeat";
          m.style.border = "0";
        }
        stack.appendChild(m);
      }
    }

    // 볼
    $("stirBar").style.width = (s.stirProgress * 100) + "%";

    // 반죽 접시
    doughEls.forEach(function (de, i) {
      var d = s.doughs[i];
      if (!d) { de.hidden = true; return; }
      de.hidden = false;
      var ball = de.children[1];
      var useImg = A.has("dough_raw") && A.has("dough_round");
      var ready = d.shape >= 1;
      de.classList.toggle("ready", ready);
      de.firstChild.firstChild.style.width = (d.shape * 100) + "%";
      if (useImg) {
        var want = ready ? "dough_round" : "dough_raw";
        if (de.dataset.img !== want) {
          de.dataset.img = want;
          ball.style.background = "url(" + A.src(want) + ") center/contain no-repeat";
          ball.style.boxShadow = "none";
        }
      } else {
        var t2 = d.shape;
        var lump = function (a) { return (a + (50 - a) * t2).toFixed(1) + "%"; };
        ball.style.borderRadius = lump(38) + " " + lump(62) + " " + lump(66) + " " + lump(34) + " / " +
          lump(44) + " " + lump(36) + " " + lump(64) + " " + lump(56);
      }
    });

    // 철판
    var anyReadyDough = s.doughs.some(function (d) { return d.shape >= 1; });
    var pressingSlot = -1;
    Object.keys(actions).forEach(function (k) { if (actions[k].kind === "press") pressingSlot = actions[k].index; });

    s.slots.forEach(function (sl, i) {
      var r = slotEls[i], hot = r.hot, hint = "", go = false, g = null;
      if (sl.state !== r.lastState) {
        if (r.lastState === "cookA" && sl.state === "cookB") {
          hot.classList.remove("flip"); void hot.offsetWidth; hot.classList.add("flip");
        }
        r.lastState = sl.state;
      }
      hot.hidden = sl.state === "empty";
      hot.classList.toggle("dome", sl.state === "dough");
      hot.classList.toggle("burst", sl.state === "burst");

      var imgMode = hot.classList.contains("imgmode");
      if (sl.state === "empty") {
        if (anyReadyDough) { hint = "올리기"; go = true; }
      } else if (sl.state === "dough") {
        var f = 1 + sl.press * 0.35;
        hot.style.transform = "scale(" + f + "," + (1 / f) + ")";
        hint = pressingSlot === i ? "" : "꾹 누르기";
        g = { v: sl.press / CFG.pressBurst, z0: CFG.pressGoodMin / CFG.pressBurst, z1: 0.97, danger: sl.press > 0.85 * CFG.pressBurst };
      } else {
        hot.style.transform = "";
        var top, rim, shownV;
        if (sl.state === "cookA") {
          top = 0.05; rim = sl.cookA; shownV = sl.cookA;
          if (sl.cookA >= CFG.cookReady) { hint = "뒤집기"; go = true; }
          g = { v: sl.cookA / CFG.cookBurnt, z0: CFG.cookReady / CFG.cookBurnt, z1: 1.2 / CFG.cookBurnt, danger: sl.cookA > 1.25 };
        } else if (sl.state === "cookB") {
          top = sl.cookA; rim = sl.cookB; shownV = Math.max(sl.cookA, sl.cookB);
          if (sl.cookB >= CFG.cookReady) { hint = "꺼내기"; go = true; }
          g = { v: sl.cookB / CFG.cookBurnt, z0: CFG.cookReady / CFG.cookBurnt, z1: 1.2 / CFG.cookBurnt, danger: sl.cookB > 1.25 };
        } else if (sl.state === "burnt") {
          top = CFG.cookBurnt; rim = CFG.cookBurnt; shownV = CFG.cookBurnt;
          hint = "버리기";
        } else if (sl.state === "burst") {
          top = 0.05; rim = 0.1; shownV = 0;
          hint = "버리기";
        }
        if (imgMode) {
          hot.querySelectorAll("img.asset").forEach(function (img) {
            var k = img.dataset.layer, op = 0;
            if (sl.state === "burst") op = k === "hotteok_burst" ? 1 : 0;
            else if (k === "hotteok_raw") op = 1;
            else if (k === "hotteok_golden") op = Math.min(1, shownV);
            else if (k === "hotteok_burnt") op = Math.max(0, (shownV - 1) / (CFG.cookBurnt - 1));
            img.style.opacity = op;
          });
        } else {
          hot.style.background = cookColor(top);
          hot.style.borderColor = cookColor(rim);
        }
      }
      if (sl.state === "dough" && imgMode) {
        hot.querySelectorAll("img.asset").forEach(function (img) {
          img.style.opacity = img.dataset.layer === "hotteok_raw" ? 1 : 0;
        });
      }

      if (r.hint.textContent !== hint) r.hint.textContent = hint;
      r.hint.classList.toggle("go", go);

      // 게이지
      if (!g) {
        if (r.gaugeKey !== "none") { r.gauge.innerHTML = ""; r.gaugeKey = "none"; }
      } else {
        if (r.gaugeKey !== "on") {
          r.gauge.innerHTML = '<span class="zone"></span><i></i>';
          r.gaugeKey = "on";
        }
        var zone = r.gauge.firstChild, fill = r.gauge.lastChild;
        zone.style.left = (g.z0 * 100) + "%";
        zone.style.width = ((g.z1 - g.z0) * 100) + "%";
        fill.style.width = Math.min(100, g.v * 100) + "%";
        fill.style.background = g.danger ? "var(--bad)" : (g.v >= g.z0 ? "var(--good)" : "#fff");
      }
    });

    // 누르개
    var pr = $("presser");
    if (pressingSlot >= 0) {
      var p = CFG.panSlots[pressingSlot];
      pr.style.left = (p.x / 100 * STOVE.w) + "px";
      pr.style.top = (p.y / 100 * STOVE.h - 88) + "px";
      pr.classList.add("down");
    } else {
      pr.style.left = "";
      pr.style.top = "";
      pr.classList.remove("down");
    }
  }

  // ── 효과 ─────────────────────────────────
  function pop(text, x, y, cls) {
    var el = document.createElement("div");
    el.className = "pop" + (cls ? " " + cls : "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    $("fx").appendChild(el);
    setTimeout(function () { el.remove(); }, 1100);
  }
  function hintPop(key, text, x, y) {
    var now = performance.now();
    if (lastHint[key] && now - lastHint[key] < 1200) return;
    lastHint[key] = now;
    pop(text, x, y, "small");
  }
  function slotPos(i) {
    var p = CFG.panSlots[i];
    return [STOVE.x + p.x / 100 * STOVE.w, STOVE.y + p.y / 100 * STOVE.h];
  }
  function customerPos(i) {
    var w = (W - 4) / CFG.maxCustomers;
    return [2 + i * w + w / 2, 70 + 200];
  }
  function bump(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function handle(events) {
    events.forEach(function (e) {
      var p;
      switch (e.type) {
        case "plateFull": hintPop("plateFull", "접시가 꽉 찼어요", SPOT.bowl[0], SPOT.bowl[1] - 20); break;
        case "doughMade": pop("+1", SPOT.plate[0], SPOT.plate[1] - 30, "small"); break;
        case "needDough":
          p = slotPos(e.slot);
          hintPop("need", s_hasRaw() ? "반죽을 문질러 동그랗게!" : "먼저 반죽을 저어요", p[0], p[1] - 40);
          break;
        case "pressed": p = slotPos(e.slot); pop("납작!", p[0], p[1] - 40, "small"); break;
        case "notYet":
          p = slotPos(e.slot);
          hintPop("notYet" + e.slot, e.reason === "press" ? "더 꾹!" : "아직이에요", p[0], p[1] - 40);
          break;
        case "burst":
          p = slotPos(e.slot);
          pop("실패!", p[0], p[1] - 30, "fail");
          setTimeout(function () { pop("시럽이 터졌어요", p[0], p[1] + 10, "small"); }, 150);
          break;
        case "burnt": p = slotPos(e.slot); pop("실패!", p[0], p[1] - 30, "fail"); break;
        case "success": p = slotPos(e.slot); pop("성공!", p[0], p[1] - 30); break;
        case "served":
          p = customerPos(e.index);
          pop("+" + e.earned.toLocaleString("ko-KR") + "원", p[0], p[1] - 80, "money");
          bump(document.querySelector(".score"), "bump");
          break;
        case "partial": p = customerPos(e.index); pop(e.left + "개 더!", p[0], p[1] - 80, "small"); break;
        case "nothingToServe":
          p = customerPos(e.index);
          hintPop("nothing", "완성된 호떡이 없어요", p[0], p[1] - 80);
          break;
        case "heartLost":
          bump($("flash"), "on");
          bump(stage, "shake");
          var he = heartEls[e.hearts];
          if (he) bump(he, "lost");
          try { if (navigator.vibrate) navigator.vibrate(120); } catch (err) { /* 무시 */ }
          break;
        case "gameOver":
          setTimeout(showGameOver, 900);
          break;
      }
    });
  }
  function s_hasRaw() { return state && state.doughs.length > 0; }

  // ── 입력 ─────────────────────────────────
  function toStage(ev) {
    var r = stage.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / scale, y: (ev.clientY - r.top) / scale };
  }

  function onDown(ev) {
    if (!running) return;
    var t = ev.target, pt = toStage(ev), el;
    var act = null;

    if ((el = t.closest(".customer"))) {
      handle(L.serve(state, +el.dataset.index));
    } else if ((el = t.closest(".slot"))) {
      var i = +el.dataset.index;
      if (state.slots[i].state === "dough") act = { kind: "press", index: i };
      else handle(L.tapSlot(state, i));
    } else if ((el = t.closest(".dough"))) {
      act = { kind: "shape", index: +el.dataset.index };
    } else if (t.closest("#bowl")) {
      act = { kind: "stir" };
    }
    if (act) {
      act.x = pt.x; act.y = pt.y;
      actions[ev.pointerId] = act;
      try { stage.setPointerCapture(ev.pointerId); } catch (err) { /* 무시 */ }
    }
    ev.preventDefault();
  }

  function onMove(ev) {
    var act = actions[ev.pointerId];
    if (!act || !running) return;
    var pt = toStage(ev);
    var dist = Math.hypot(pt.x - act.x, pt.y - act.y);
    act.x = pt.x; act.y = pt.y;
    if (act.kind === "stir") {
      handle(L.stir(state, dist));
      var cx = 136 + 61, cy = 406 + 50;
      var ang = Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI + 90;
      $("spatulaPivot").style.transform = "rotate(" + ang + "deg)";
    } else if (act.kind === "shape") {
      handle(L.shape(state, act.index, dist));
    }
  }

  function onUp(ev) {
    var act = actions[ev.pointerId];
    if (!act) return;
    delete actions[ev.pointerId];
    if (act.kind === "press" && running) handle(L.pressRelease(state, act.index));
  }

  // ── 게임 흐름 ────────────────────────────
  function loop(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    Object.keys(actions).forEach(function (k) {
      var a = actions[k];
      if (a.kind === "press") {
        var ev = L.pressHold(state, a.index, dt);
        if (ev.length) { delete actions[k]; handle(ev); }
      }
    });
    handle(L.update(state, dt));
    render();
    if (state.over) { running = false; return; }
    requestAnimationFrame(loop);
  }

  function start() {
    state = L.create(CFG);
    actions = {};
    build();
    applyStaticAssets();
    $("startScreen").hidden = true;
    $("overScreen").hidden = true;
    running = true;
    lastT = performance.now();
    render();
    requestAnimationFrame(loop);
  }

  function readBest() {
    try { return parseInt(localStorage.getItem("hotteok_best") || "0", 10) || 0; } catch (e) { return 0; }
  }
  function writeBest(v) {
    try { localStorage.setItem("hotteok_best", String(v)); } catch (e) { /* 저장 불가 환경 */ }
  }

  function showGameOver() {
    var best = readBest(), isNew = state.score > best;
    if (isNew) writeBest(state.score);
    $("finalScore").textContent = state.score.toLocaleString("ko-KR");
    $("finalDetail").textContent = "호떡 " + state.servedCount + "개를 팔았어요";
    $("finalBest").textContent = isNew ? "최고 기록이에요!" : "최고 기록 " + best.toLocaleString("ko-KR") + "원";
    var rh = $("resultHotteok"), good = state.servedCount >= 10;
    rh.innerHTML = "";
    rh.className = "result-hotteok" + (good ? "" : " burnt");
    useAsset(rh, good ? "hotteok_golden" : "hotteok_burnt");
    $("overScreen").hidden = false;
  }

  // ── 시작 ─────────────────────────────────
  window.addEventListener("resize", fit);
  fit();
  stage.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  $("startBtn").addEventListener("click", start);
  $("retryBtn").addEventListener("click", start);

  A.preload("assets/", function () {
    applyStaticAssets();
  });
})();
