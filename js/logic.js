/*
 * 호떡 만들기 — 게임 규칙과 상태 (화면 코드 없음)
 *
 * 모든 함수는 state를 바꾸고, 화면이 반응할 "이벤트" 배열을 돌려줍니다.
 * 이벤트 종류:
 *   doughMade, plateFull, doughShaped, placed, needDough,
 *   pressed, burst, flipped, notYet, burnt, success, discarded,
 *   served, partial, nothingToServe, customerArrived, customerLeft,
 *   heartLost, gameOver
 */
var HotteokLogic = (function () {
  "use strict";

  function create(cfg, rng) {
    var slots = [];
    for (var i = 0; i < cfg.panSlots.length; i++) slots.push(emptySlot());
    var customers = [];
    for (var c = 0; c < cfg.maxCustomers; c++) customers.push(null);

    return {
      cfg: cfg,
      rng: rng || Math.random,
      time: 0,
      score: 0,
      hearts: cfg.startHearts,
      over: false,
      servedCount: 0,     // 서빙한 호떡 수
      failedCount: 0,     // 실패한 호떡 수
      nextCustomerIn: cfg.firstCustomerDelay,
      nextCustomerId: 1,
      stirProgress: 0,    // 0~1
      doughs: [],         // 접시 위 반죽: { shape: 0~1 }
      slots: slots,       // 철판 칸
      ready: 0,           // 완성되어 대기 중인 호떡 수
      customers: customers
    };
  }

  function emptySlot() {
    // state: empty | dough | cookA | cookB | burnt | burst
    return { state: "empty", press: 0, cookA: 0, cookB: 0, timer: 0 };
  }

  // ── 시간 진행 ───────────────────────────────
  function update(s, dt) {
    var ev = [];
    if (s.over) return ev;
    s.time += dt;
    var cfg = s.cfg;

    // 철판 굽기
    for (var i = 0; i < s.slots.length; i++) {
      var sl = s.slots[i];
      if (sl.state === "cookA") {
        sl.cookA += cfg.cookRateA * dt;
        if (sl.cookA >= cfg.cookBurnt) burn(s, sl, i, ev);
      } else if (sl.state === "cookB") {
        sl.cookB += cfg.cookRateB * dt;
        sl.cookA += cfg.cookRateB * dt * 0.15; // 뒤집은 뒤에도 앞면이 살짝 더 익음
        if (sl.cookB >= cfg.cookBurnt) burn(s, sl, i, ev);
      }
    }

    // 손님
    for (var c = 0; c < s.customers.length; c++) {
      var cu = s.customers[c];
      if (!cu) continue;
      if (cu.leaving) {
        cu.leaveTimer -= dt;
        if (cu.leaveTimer <= 0) s.customers[c] = null;
        continue;
      }
      cu.patience -= dt;
      if (cu.patience <= 0) {
        cu.patience = 0;
        cu.leaving = "angry";
        cu.leaveTimer = 0.9;
        s.hearts -= 1;
        ev.push({ type: "customerLeft", index: c });
        ev.push({ type: "heartLost", hearts: s.hearts });
        if (s.hearts <= 0) {
          s.hearts = 0;
          s.over = true;
          ev.push({ type: "gameOver", score: s.score });
          return ev;
        }
      }
    }

    // 새 손님
    s.nextCustomerIn -= dt;
    if (s.nextCustomerIn <= 0) {
      var free = s.customers.indexOf(null);
      if (free === -1) {
        s.nextCustomerIn = 0.5; // 자리가 없으면 잠시 뒤 다시 확인
      } else {
        s.customers[free] = makeCustomer(s);
        s.nextCustomerIn = spawnInterval(s);
        ev.push({ type: "customerArrived", index: free });
      }
    }
    return ev;
  }

  function burn(s, sl, i, ev) {
    sl.state = "burnt";
    s.failedCount++;
    ev.push({ type: "burnt", slot: i });
  }

  function spawnInterval(s) {
    var cfg = s.cfg;
    return Math.max(cfg.spawnIntervalMin, cfg.spawnIntervalStart - s.time * cfg.spawnIntervalDecay);
  }

  function orderCount(s) {
    var table = s.cfg.orderWeights, w = table[table.length - 1].weights;
    for (var i = 0; i < table.length; i++) {
      if (s.time < table[i].until) { w = table[i].weights; break; }
    }
    var total = 0, k;
    for (k = 0; k < w.length; k++) total += w[k];
    var r = s.rng() * total;
    for (k = 0; k < w.length; k++) {
      r -= w[k];
      if (r < 0) return k + 1;
    }
    return 1;
  }

  function makeCustomer(s) {
    var n = orderCount(s);
    var p = s.cfg.patienceBase + n * s.cfg.patiencePerItem;
    return {
      id: s.nextCustomerId++,
      look: Math.floor(s.rng() * 4), // 손님 외형 번호 (에셋 여러 종일 때 사용)
      order: n,
      received: 0,
      patience: p,
      maxPatience: p,
      leaving: null,
      leaveTimer: 0
    };
  }

  // ── 1단계: 반죽 젓기 ─────────────────────────
  function stir(s, distance) {
    var ev = [];
    if (s.over) return ev;
    if (s.doughs.length >= s.cfg.doughPlateCapacity) {
      ev.push({ type: "plateFull" });
      return ev;
    }
    s.stirProgress += distance / s.cfg.stirDistancePerDough;
    if (s.stirProgress >= 1) {
      s.stirProgress = 0;
      s.doughs.push({ shape: 0 });
      ev.push({ type: "doughMade", index: s.doughs.length - 1 });
    }
    return ev;
  }

  // ── 2단계: 반죽 만지기 ───────────────────────
  function shape(s, index, distance) {
    var ev = [], d = s.doughs[index];
    if (s.over || !d || d.shape >= 1) return ev;
    d.shape = Math.min(1, d.shape + distance / s.cfg.shapeDistance);
    if (d.shape >= 1) ev.push({ type: "doughShaped", index: index });
    return ev;
  }

  // ── 3단계: 철판 ─────────────────────────────
  // 칸을 눌렀을 때 (빈 칸이면 반죽 올리기 / 굽는 중이면 뒤집기·꺼내기 / 실패작이면 버리기)
  function tapSlot(s, i) {
    var ev = [], sl = s.slots[i], cfg = s.cfg;
    if (s.over || !sl) return ev;

    if (sl.state === "empty") {
      var di = -1;
      for (var k = 0; k < s.doughs.length; k++) if (s.doughs[k].shape >= 1) { di = k; break; }
      if (di === -1) { ev.push({ type: "needDough", slot: i }); return ev; }
      s.doughs.splice(di, 1);
      s.slots[i] = emptySlot();
      s.slots[i].state = "dough";
      ev.push({ type: "placed", slot: i });
    } else if (sl.state === "cookA") {
      if (sl.cookA < cfg.cookReady) { ev.push({ type: "notYet", slot: i }); return ev; }
      sl.state = "cookB";
      ev.push({ type: "flipped", slot: i });
    } else if (sl.state === "cookB") {
      if (sl.cookB < cfg.cookReady) { ev.push({ type: "notYet", slot: i }); return ev; }
      s.slots[i] = emptySlot();
      s.ready += 1;
      ev.push({ type: "success", slot: i });
    } else if (sl.state === "burnt" || sl.state === "burst") {
      s.slots[i] = emptySlot();
      ev.push({ type: "discarded", slot: i });
    }
    return ev;
  }

  // 반죽이 올라간 칸을 꾹 누르고 있는 동안 매 프레임 호출
  function pressHold(s, i, dt) {
    var ev = [], sl = s.slots[i];
    if (s.over || !sl || sl.state !== "dough") return ev;
    sl.press += s.cfg.pressRate * dt;
    if (sl.press >= s.cfg.pressBurst) {
      sl.state = "burst";
      s.failedCount++;
      ev.push({ type: "burst", slot: i });
    }
    return ev;
  }

  // 손을 뗐을 때
  function pressRelease(s, i) {
    var ev = [], sl = s.slots[i];
    if (s.over || !sl || sl.state !== "dough") return ev;
    if (sl.press >= s.cfg.pressGoodMin) {
      sl.state = "cookA";
      ev.push({ type: "pressed", slot: i });
    } else {
      ev.push({ type: "notYet", slot: i, reason: "press" });
    }
    return ev;
  }

  // ── 4단계: 서빙 ─────────────────────────────
  function serve(s, index) {
    var ev = [], cu = s.customers[index];
    if (s.over || !cu || cu.leaving) return ev;
    if (s.ready <= 0) { ev.push({ type: "nothingToServe", index: index }); return ev; }
    var give = Math.min(s.ready, cu.order - cu.received);
    s.ready -= give;
    cu.received += give;
    if (cu.received >= cu.order) {
      var earned = cu.order * s.cfg.pricePerHotteok;
      s.score += earned;
      s.servedCount += cu.order;
      cu.leaving = "happy";
      cu.leaveTimer = 0.7;
      ev.push({ type: "served", index: index, earned: earned });
    } else {
      ev.push({ type: "partial", index: index, left: cu.order - cu.received });
    }
    return ev;
  }

  // 표정: happy | neutral | angry | furious
  function mood(s, cu) {
    if (cu.leaving === "angry") return "furious";
    if (cu.leaving === "happy") return "happy";
    var r = cu.patience / cu.maxPatience, t = s.cfg.moodThresholds;
    if (r >= t.happy) return "happy";
    if (r >= t.neutral) return "neutral";
    return "angry";
  }

  return {
    create: create,
    update: update,
    stir: stir,
    shape: shape,
    tapSlot: tapSlot,
    pressHold: pressHold,
    pressRelease: pressRelease,
    serve: serve,
    mood: mood,
    spawnInterval: spawnInterval
  };
})();

if (typeof module !== "undefined") module.exports = HotteokLogic;
