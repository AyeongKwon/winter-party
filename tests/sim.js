/*
 * 자동 플레이 테스트: node tests/sim.js
 * 간단한 봇이 각 간식을 플레이해서 규칙이 끝까지 잘 돌아가는지 확인합니다.
 */
var CFG = require("../js/config.js");
var Core = require("../js/core.js");
var LOGIC = {
  hotteok: require("../js/logic/hotteok.js"),
  bungeo: require("../js/logic/bungeo.js"),
  eomuk: require("../js/logic/eomuk.js")
};

var DT = 0.05;

function run(id, seconds, lazy) {
  var L = LOGIC[id], snack = CFG.snacks[id];
  var g = Core.create(CFG.common, snack, L.flavors);
  var st = L.create(snack);
  var ev = [], t = 0, holding = {};

  function act(sid) { L.press(g, st, sid, ev); }

  while (!g.over && t < seconds) {
    if (!lazy) bot(id, g, st, L, act, holding);
    Object.keys(holding).forEach(function (sid) { L.hold(g, st, sid, DT, ev); });
    L.update(g, st, DT, ev);
    Core.update(g, DT, ev);
    t += DT;
  }
  var fails = ev.filter(function (e) { return e.cls === "fail"; }).length;
  console.log(id.padEnd(8), lazy ? "(아무것도 안 함)" : "(봇)", "시간", t.toFixed(0) + "초",
    "점수", g.score, "판매", g.sold, "하트", g.hearts, "실패", fails);
  return g;
}

function bot(id, g, st, L, act, holding) {
  var ev = [];
  function holdUntil(sid, value, goal) {
    if (!holding[sid]) { act(sid); holding[sid] = true; }
    if (value() >= goal) { L.release(g, st, sid, ev); delete holding[sid]; }
  }
  if (id === "hotteok") {
    act("bowl"); act("plate");
    st.slots.forEach(function (sl, i) {
      var sid = "slot" + i;
      if (sl.state === "dough") holdUntil(sid, function () { return st.slots[i].press; }, 0.7);
      else if (sl.state === "cookA" && sl.cookA >= 0.9) act(sid);
      else if (sl.state === "cookB" && sl.cookB >= 0.9) act(sid);
      else if (sl.state !== "cookA" && sl.state !== "cookB") act(sid);
    });
    Core.serve(g, null, ev);
  } else if (id === "bungeo") {
    var cu = Core.front(g);
    st.slots.forEach(function (sl, i) {
      var sid = "slot" + i;
      if (sl.state === "pour1" || sl.state === "pour2" || sl.state === "empty") {
        holdUntil(sid, function () { return st.slots[i].pour; }, 0.75);
      } else if (sl.state === "fill") {
        var want = cu && cu.need.cream > g.ready.cream ? "down" : "up";
        L[want](g, st, sid, ev);
      } else if (sl.state === "close") act(sid);
      else if (sl.state === "cookA" && sl.cookA >= 0.9) act(sid);
      else if (sl.state === "cookB" && sl.cookB >= 0.9) act(sid);
      else if (sl.state === "burnt" || sl.state === "spill") act(sid);
    });
    if (cu) { Core.serve(g, cu.need.red > 0 ? "red" : "cream", ev); }
  } else if (id === "eomuk") {
    if (st.skewers < st.cfg.skewerCapacity) L[st.seq[st.seqPos]](g, st, "skewer", ev);
    var p = st.pot;
    if (p.state === "empty" || p.state === "water") holdUntil("pot", function () { return st.pot.water; }, 0.75);
    else if (p.state === "radish" || p.state === "crab" || p.state === "overflow") act("pot");
    else if (p.state === "heat") {
      if (p.temp < 0.6 && p.heat < 3) L.up(g, st, "pot", ev);
      if (p.temp > 0.78 && p.heat > 0) L.down(g, st, "pot", ev);
    }
    if (st.skewers > 0 && st.pot.state === "ready") holdUntil("bowl", function () { return st.ladle; }, 0.75);
    Core.serve(g, null, ev);
  }
}

var ok = true;
["bungeo", "hotteok", "eomuk"].forEach(function (id) {
  var good = run(id, 180, false);
  var lazy = run(id, 600, true);
  if (good.sold === 0) { ok = false; console.log("  ✗ 봇이 하나도 못 팔았어요"); }
  if (!lazy.over) { ok = false; console.log("  ✗ 가만히 있어도 게임 오버가 안 돼요"); }
});
console.log(ok ? "\n✓ 모든 테스트 통과" : "\n✗ 실패한 테스트가 있어요");
process.exit(ok ? 0 : 1);
