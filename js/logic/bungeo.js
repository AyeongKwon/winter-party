/*
 * 붕어빵 — 만드는 과정 (틀 한 칸 기준)
 * 비어 있음 → 반죽 붓기(꾹) → 속 넣기(↑ 팥 / ↓ 슈크림) → 반죽 다시 붓기(꾹)
 * → 틀 덮기 → 앞면 굽기 → 뒤집기 → 뒷면 굽기 → 꺼내기
 */
var SNACK_LOGIC = (typeof SNACK_LOGIC !== "undefined") ? SNACK_LOGIC : {};
SNACK_LOGIC.bungeo = (function () {
  "use strict";
  var Core = (typeof GameCore !== "undefined") ? GameCore : require("../core.js");
  var pop = Core.pop;

  // state: empty | pour1 | fill | pour2 | close | cookA | cookB | burnt | spill
  function emptySlot() { return { state: "empty", pour: 0, flavor: null, cookA: 0, cookB: 0, holding: false }; }

  function create(cfg) {
    var slots = [];
    for (var i = 0; i < cfg.slots; i++) slots.push(emptySlot());
    return { cfg: cfg, slots: slots };
  }

  function stations(st) { return st.slots.map(function (_, i) { return "slot" + i; }); }
  function idx(id) { return +id.slice(4); }

  function update(g, st, dt, ev) {
    var c = st.cfg;
    st.slots.forEach(function (sl, i) {
      if (sl.state === "cookA") {
        sl.cookA += c.cookRateA * dt;
        if (sl.cookA >= c.cookBurnt) { sl.state = "burnt"; pop(ev, "slot" + i, "실패!", "fail"); }
      } else if (sl.state === "cookB") {
        sl.cookB += c.cookRateB * dt;
        if (sl.cookB >= c.cookBurnt) { sl.state = "burnt"; pop(ev, "slot" + i, "실패!", "fail"); }
      }
    });
  }

  function press(g, st, id, ev) {
    var i = idx(id), sl = st.slots[i], c = st.cfg;
    if (!sl) return;
    switch (sl.state) {
      case "empty": sl.state = "pour1"; sl.pour = 0; sl.holding = true; break;
      case "pour1": case "pour2": sl.holding = true; break;
      case "fill": pop(ev, id, "↑ 팥 / ↓ 슈크림", "small"); break;
      case "close": sl.state = "cookA"; break;
      case "cookA":
        if (sl.cookA < c.cookReady) { pop(ev, id, "아직이에요", "small"); return; }
        sl.state = "cookB";
        break;
      case "cookB":
        if (sl.cookB < c.cookReady) { pop(ev, id, "아직이에요", "small"); return; }
        Core.addReady(g, sl.flavor);
        st.slots[i] = emptySlot();
        pop(ev, id, "성공!");
        break;
      case "burnt": case "spill": st.slots[i] = emptySlot(); break;
    }
  }

  function hold(g, st, id, dt, ev) {
    var sl = st.slots[idx(id)];
    if (!sl || !sl.holding || (sl.state !== "pour1" && sl.state !== "pour2")) return;
    sl.pour += st.cfg.pourRate * dt;
    if (sl.pour >= st.cfg.pourOver) {
      sl.state = "spill";
      sl.holding = false;
      pop(ev, id, "실패!", "fail");
      pop(ev, id, "반죽이 넘쳤어요", "small");
    }
  }

  function release(g, st, id, ev) {
    var sl = st.slots[idx(id)];
    if (!sl) return;
    var wasHolding = sl.holding;
    sl.holding = false;
    if (!wasHolding || (sl.state !== "pour1" && sl.state !== "pour2")) return;
    if (sl.pour >= st.cfg.pourGoodMin) {
      sl.state = sl.state === "pour1" ? "fill" : "close";
      sl.pour = 0;
    } else if (sl.pour > 0.05) {
      pop(ev, id, "조금 더!", "small");
    }
  }

  function fill(st, id, flavor, ev) {
    var sl = st.slots[idx(id)];
    if (!sl || sl.state !== "fill") return;
    sl.flavor = flavor;
    sl.state = "pour2";
    sl.pour = 0;
    pop(ev, id, flavor === "red" ? "팥!" : "슈크림!", "small");
  }

  return {
    flavors: ["red", "cream"],
    create: create,
    stations: stations,
    update: update,
    press: press,
    hold: hold,
    release: release,
    up: function (g, st, id, ev) { fill(st, id, "red", ev); },
    down: function (g, st, id, ev) { fill(st, id, "cream", ev); },
    rubbable: function () { return false; }
  };
})();

if (typeof module !== "undefined") module.exports = SNACK_LOGIC.bungeo;
