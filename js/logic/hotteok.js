/*
 * 호떡 — 만드는 과정
 * 작업대: bowl(젓기) → plate(만지기) → slot0~2(철판: 올리기, 꾹 누르기, 뒤집기, 꺼내기)
 */
var SNACK_LOGIC = (typeof SNACK_LOGIC !== "undefined") ? SNACK_LOGIC : {};
SNACK_LOGIC.hotteok = (function () {
  "use strict";
  var Core = (typeof GameCore !== "undefined") ? GameCore : require("../core.js");
  var pop = Core.pop;

  function emptySlot() { return { state: "empty", press: 0, cookA: 0, cookB: 0 }; }

  function create(cfg) {
    var slots = [];
    for (var i = 0; i < cfg.slots; i++) slots.push(emptySlot());
    return { cfg: cfg, stir: 0, doughs: [], slots: slots, lastDir: null };
  }

  function stations(st) {
    var ids = ["bowl", "plate"];
    st.slots.forEach(function (_, i) { ids.push("slot" + i); });
    return ids;
  }

  function slotIndex(id) { return id.indexOf("slot") === 0 ? +id.slice(4) : -1; }

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

  function stirTap(st, ev) {
    if (st.doughs.length >= st.cfg.doughCapacity) { pop(ev, "bowl", "접시가 꽉 찼어요", "small"); return; }
    st.stir += 1 / st.cfg.stirTaps;
    if (st.stir >= 0.999) {
      st.stir = 0;
      st.doughs.push({ shape: 0 });
      pop(ev, "plate", "+1", "small");
    }
  }

  function shapeTap(st, ev) {
    for (var i = 0; i < st.doughs.length; i++) {
      if (st.doughs[i].shape < 1) {
        st.doughs[i].shape = Math.min(1, st.doughs[i].shape + 1 / st.cfg.shapeTaps);
        if (st.doughs[i].shape >= 1) pop(ev, "plate", "동글!", "small");
        return;
      }
    }
    pop(ev, "plate", st.doughs.length ? "다 동그래요. 철판에 올려요" : "먼저 반죽을 저어요", "small");
  }

  function press(g, st, id, ev) {
    if (id === "bowl") return stirTap(st, ev);
    if (id === "plate") return shapeTap(st, ev);
    var i = slotIndex(id), sl = st.slots[i], c = st.cfg;
    if (!sl) return;
    if (sl.state === "empty") {
      var k = -1;
      for (var d = 0; d < st.doughs.length; d++) if (st.doughs[d].shape >= 1) { k = d; break; }
      if (k === -1) { pop(ev, id, st.doughs.length ? "반죽을 동그랗게!" : "반죽이 없어요", "small"); return; }
      st.doughs.splice(k, 1);
      st.slots[i] = emptySlot();
      st.slots[i].state = "dough";
    } else if (sl.state === "cookA") {
      if (sl.cookA < c.cookReady) { pop(ev, id, "아직이에요", "small"); return; }
      sl.state = "cookB";
    } else if (sl.state === "cookB") {
      if (sl.cookB < c.cookReady) { pop(ev, id, "아직이에요", "small"); return; }
      st.slots[i] = emptySlot();
      Core.addReady(g);
      pop(ev, id, "성공!");
    } else if (sl.state === "burnt" || sl.state === "burst") {
      st.slots[i] = emptySlot();
    }
  }

  // 반죽을 꾹 누르는 중
  function hold(g, st, id, dt, ev) {
    var sl = st.slots[slotIndex(id)];
    if (!sl || sl.state !== "dough") return;
    sl.press += st.cfg.pressRate * dt;
    if (sl.press >= st.cfg.pressBurst) {
      sl.state = "burst";
      pop(ev, id, "실패!", "fail");
      pop(ev, id, "시럽이 터졌어요", "small");
    }
  }

  function release(g, st, id, ev) {
    var sl = st.slots[slotIndex(id)];
    if (!sl || sl.state !== "dough") return;
    if (sl.press >= st.cfg.pressGoodMin) { sl.state = "cookA"; pop(ev, id, "납작!", "small"); }
    else if (sl.press > 0.05) pop(ev, id, "더 꾹!", "small");
  }

  // ↑↓을 번갈아 누르면 젓기·만지기
  function updown(g, st, id, dir, ev) {
    if (id !== "bowl" && id !== "plate") return;
    if (st.lastDir === dir) return;
    st.lastDir = dir;
    press(g, st, id, ev);
  }

  return {
    flavors: ["plain"],
    create: create,
    stations: stations,
    update: update,
    press: press,
    hold: hold,
    release: release,
    up: function (g, st, id, ev) { updown(g, st, id, "up", ev); },
    down: function (g, st, id, ev) { updown(g, st, id, "down", ev); },
    rubbable: function (st, id) { return id === "bowl" || id === "plate"; }
  };
})();

if (typeof module !== "undefined") module.exports = SNACK_LOGIC.hotteok;
