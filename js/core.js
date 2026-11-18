/*
 * 겨울 간식 포장마차 — 공통 규칙 (손님, 하트, 점수, 서빙)
 * 간식별 만드는 과정은 js/logic/ 폴더에 있습니다.
 *
 * 이벤트는 ev 배열에 쌓입니다.
 *   { type: "pop", at, text, cls }   화면에 글자 띄우기 (at: 작업대 id 또는 "customer")
 *   { type: "served", earned }
 *   { type: "heartLost", hearts }
 *   { type: "gameOver" }
 */
var GameCore = (function () {
  "use strict";

  function create(common, snack, flavors, rng) {
    var ready = {};
    flavors.forEach(function (f) { ready[f] = 0; });
    return {
      common: common,
      snack: snack,
      flavors: flavors,        // 붕어빵: ["red", "cream"], 나머지: ["plain"]
      rng: rng || Math.random,
      time: 0,
      score: 0,
      hearts: common.startHearts,
      over: false,
      sold: 0,
      customers: [],           // [0]이 맨 앞 손님
      nextCustomerIn: common.firstCustomerDelay,
      nextId: 1,
      ready: ready,            // 완성되어 기다리는 간식 (맛별)
      tutorial: false          // 튜토리얼 중에는 손님이 기다려 주고 하트가 줄지 않음
    };
  }

  function pop(ev, at, text, cls) { ev.push({ type: "pop", at: at, text: text, cls: cls || "" }); }

  function update(s, dt, ev) {
    if (s.over) return;
    s.time += dt;

    for (var i = 0; i < s.customers.length; i++) {
      var cu = s.customers[i];
      if (cu.leaving) {
        cu.leaveTimer -= dt;
        continue;
      }
      if (s.tutorial) continue;
      cu.patience -= dt;
      if (cu.patience <= 0) {
        cu.patience = 0;
        cu.leaving = "angry";
        cu.leaveTimer = 0.9;
        s.hearts -= 1;
        ev.push({ type: "heartLost", hearts: s.hearts });
        if (s.hearts <= 0) {
          s.hearts = 0;
          s.over = true;
          ev.push({ type: "gameOver" });
          return;
        }
      }
    }
    s.customers = s.customers.filter(function (c) { return !(c.leaving && c.leaveTimer <= 0); });

    if (s.tutorial) return;
    s.nextCustomerIn -= dt;
    if (s.nextCustomerIn <= 0) {
      if (s.customers.length >= s.common.maxCustomers) {
        s.nextCustomerIn = 0.5;
      } else {
        s.customers.push(makeCustomer(s));
        s.nextCustomerIn = spawnInterval(s);
      }
    }
  }

  function spawnInterval(s) {
    var c = s.common;
    return Math.max(c.spawnIntervalMin, c.spawnIntervalStart - s.time * c.spawnIntervalDecay);
  }

  function orderCount(s) {
    var table = s.common.orderWeights, w = table[table.length - 1].weights, k;
    for (k = 0; k < table.length; k++) if (s.time < table[k].until) { w = table[k].weights; break; }
    var total = 0;
    for (k = 0; k < w.length; k++) total += w[k];
    var r = s.rng() * total;
    for (k = 0; k < w.length; k++) { r -= w[k]; if (r < 0) return k + 1; }
    return 1;
  }

  function makeCustomer(s) {
    var n = orderCount(s), need = {};
    s.flavors.forEach(function (f) { need[f] = 0; });
    for (var i = 0; i < n; i++) need[s.flavors[Math.floor(s.rng() * s.flavors.length)]]++;
    var p = (s.snack.patienceBase + n * s.snack.patiencePerItem) * (s.common.patienceMultiplier || 1);
    return {
      id: s.nextId++,
      look: Math.floor(s.rng() * 3),
      total: n,
      need: need,            // 아직 받아야 하는 개수 (맛별)
      patience: p,
      maxPatience: p,
      leaving: null,
      leaveTimer: 0
    };
  }

  // 튜토리얼용 손님 (주문을 직접 정함)
  function addCustomer(s, need) {
    var total = 0;
    for (var f in need) total += need[f];
    var p = s.snack.patienceBase + total * s.snack.patiencePerItem;
    s.customers.push({ id: s.nextId++, look: 0, total: total, need: need, patience: p, maxPatience: p, leaving: null, leaveTimer: 0 });
  }

  function front(s) {
    var c = s.customers[0];
    return c && !c.leaving ? c : null;
  }

  // 맨 앞 손님에게 주기. flavor를 생략하면 그 간식의 유일한 맛.
  function serve(s, flavor, ev) {
    if (s.over) return;
    var cu = front(s);
    if (!cu) { pop(ev, "customer", "기다리는 손님이 없어요", "small"); return; }
    flavor = flavor || s.flavors[0];
    if (cu.need[flavor] === 0) {
      cu.patience = Math.max(0.5, cu.patience - s.common.wrongItemPenalty);
      pop(ev, "customer", s.flavors.length > 1 ? "그 맛 아니에요!" : "다 받았어요", "fail");
      return;
    }
    if (s.ready[flavor] <= 0) { pop(ev, "counter", "완성된 게 없어요", "small"); return; }
    var give = Math.min(s.ready[flavor], cu.need[flavor]);
    s.ready[flavor] -= give;
    cu.need[flavor] -= give;
    var left = 0;
    for (var f in cu.need) left += cu.need[f];
    if (left === 0) {
      var earned = cu.total * s.snack.price;
      s.score += earned;
      s.sold += cu.total;
      cu.leaving = "happy";
      cu.leaveTimer = 0.7;
      ev.push({ type: "served", earned: earned });
    } else {
      pop(ev, "customer", left + "개 더!", "small");
    }
  }

  function addReady(s, flavor) { s.ready[flavor || s.flavors[0]] += 1; }

  function mood(s, cu) {
    if (cu.leaving === "angry") return "furious";
    if (cu.leaving === "happy") return "happy";
    var r = cu.patience / cu.maxPatience, t = s.common.moodThresholds;
    return r >= t.happy ? "happy" : r >= t.neutral ? "neutral" : "angry";
  }

  return {
    create: create, update: update, serve: serve, addReady: addReady,
    mood: mood, front: front, pop: pop, spawnInterval: spawnInterval, addCustomer: addCustomer
  };
})();

if (typeof module !== "undefined") module.exports = GameCore;
