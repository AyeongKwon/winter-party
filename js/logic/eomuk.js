/*
 * 어묵 — 만드는 과정
 * skewer(꼬치): 화면에 뜨는 ↑↓ 순서대로 눌러 지그재그로 꽂기
 * pot(냄비):   물 붓기(꾹) → 무 손질(연타) → 꽃게 손질(연타) → 불 조절(↑↓)로 끓이기 → 국물 완성
 * bowl(그릇):  꼬치 + 국물 담기(꾹) → 한 그릇 완성
 */
var SNACK_LOGIC = (typeof SNACK_LOGIC !== "undefined") ? SNACK_LOGIC : {};
SNACK_LOGIC.eomuk = (function () {
  "use strict";
  var Core = (typeof GameCore !== "undefined") ? GameCore : require("../core.js");
  var pop = Core.pop;

  function newSeq(st, rng) {
    var seq = [];
    for (var i = 0; i < st.cfg.skewerSteps; i++) seq.push(rng() < 0.5 ? "up" : "down");
    return seq;
  }

  function emptyPot() {
    // state: empty | water | radish | crab | heat | ready | overflow
    return { state: "empty", water: 0, holding: false, chop: 0, heat: 0, temp: 0,
             drift: 0, driftIn: 0, boil: 0, overFor: 0, servings: 0 };
  }

  function create(cfg, rng) {
    var st = { cfg: cfg, rng: rng || Math.random, skewers: 0, seqPos: 0, seq: null,
               pot: emptyPot(), ladle: 0, ladling: false };
    st.seq = newSeq(st, st.rng);
    return st;
  }

  function stations() { return ["skewer", "bowl", "pot"]; }

  function update(g, st, dt, ev) {
    var p = st.pot, c = st.cfg;
    if (p.state !== "heat") return;
    p.driftIn -= dt;
    if (p.driftIn <= 0) {
      p.drift = (st.rng() * 2 - 1) * c.driftRange;
      p.driftIn = c.driftEvery;
    }
    var target = Math.max(0, Math.min(1.1, c.heatTargets[p.heat] + (p.heat > 0 ? p.drift : 0)));
    p.temp += (target - p.temp) * Math.min(1, c.tempRate * dt * 3);
    if (p.temp >= c.goodTemp[0] && p.temp <= c.goodTemp[1]) {
      p.boil += dt;
      if (p.boil >= c.boilNeeded) {
        p.state = "ready";
        p.servings = c.servingsPerPot;
        pop(ev, "pot", "국물 완성!");
      }
    }
    if (p.temp >= c.overTemp) {
      p.overFor += dt;
      if (p.overFor >= c.overTime) {
        p.state = "overflow";
        pop(ev, "pot", "실패!", "fail");
        pop(ev, "pot", "끓어 넘쳤어요", "small");
      }
    } else {
      p.overFor = Math.max(0, p.overFor - dt);
    }
  }

  function press(g, st, id, ev) {
    var c = st.cfg, p = st.pot;
    if (id === "skewer") {
      pop(ev, id, "화살표 순서대로 ↑↓", "small");
    } else if (id === "pot") {
      switch (p.state) {
        case "empty": p.state = "water"; p.water = 0; p.holding = true; break;
        case "water": p.holding = true; break;
        case "radish": case "crab":
          p.chop += 1 / c.chopTaps;
          if (p.chop >= 0.999) {
            p.chop = 0;
            if (p.state === "radish") { p.state = "crab"; pop(ev, id, "무 넣기!", "small"); }
            else {
              p.state = "heat"; p.heat = 0; p.temp = 0; p.boil = 0; p.overFor = 0; p.driftIn = 0;
              pop(ev, id, "꽃게 넣기! 이제 불을 켜요", "small");
            }
          }
          break;
        case "heat": pop(ev, id, "↑↓로 불 조절", "small"); break;
        case "ready": pop(ev, id, "그릇에 담아요", "small"); break;
        case "overflow": st.pot = emptyPot(); break;
      }
    } else if (id === "bowl") {
      if (st.skewers <= 0) { pop(ev, id, "꼬치가 없어요", "small"); return; }
      if (p.state !== "ready" || p.servings <= 0) { pop(ev, id, "국물이 없어요", "small"); return; }
      st.ladling = true;
    }
  }

  function hold(g, st, id, dt, ev) {
    var c = st.cfg, p = st.pot;
    if (id === "pot" && p.state === "water" && p.holding) {
      p.water += c.waterRate * dt;
      if (p.water >= c.waterOver) {
        p.state = "overflow";
        p.holding = false;
        pop(ev, id, "실패!", "fail");
        pop(ev, id, "물이 넘쳤어요", "small");
      }
    } else if (id === "bowl" && st.ladling) {
      st.ladle += c.ladleRate * dt;
      if (st.ladle >= c.ladleOver) {
        st.ladle = 0;
        st.ladling = false;
        useServing(st);
        pop(ev, id, "실패!", "fail");
        pop(ev, id, "국물이 넘쳤어요", "small");
      }
    }
  }

  function useServing(st) {
    st.pot.servings -= 1;
    if (st.pot.servings <= 0) st.pot = emptyPot();
  }

  function release(g, st, id, ev) {
    var c = st.cfg, p = st.pot;
    if (id === "pot" && p.state === "water" && p.holding) {
      p.holding = false;
      if (p.water >= c.waterGoodMin) { p.state = "radish"; p.chop = 0; pop(ev, id, "무 손질!", "small"); }
      else if (p.water > 0.05) pop(ev, id, "조금 더!", "small");
    } else if (id === "bowl" && st.ladling) {
      st.ladling = false;
      if (st.ladle >= c.ladleGoodMin) {
        st.ladle = 0;
        st.skewers -= 1;
        useServing(st);
        Core.addReady(g);
        pop(ev, id, "성공!");
      } else if (st.ladle > 0.05) pop(ev, id, "조금 더!", "small");
    }
  }

  function arrow(g, st, id, dir, ev) {
    var p = st.pot;
    if (id === "skewer") {
      if (st.skewers >= st.cfg.skewerCapacity) { pop(ev, id, "꼬치가 꽉 찼어요", "small"); return; }
      if (st.seq[st.seqPos] === dir) {
        st.seqPos++;
        if (st.seqPos >= st.seq.length) {
          st.skewers++;
          st.seqPos = 0;
          st.seq = newSeq(st, st.rng);
          pop(ev, id, "꼬치 완성!", "small");
        }
      } else {
        st.seqPos = 0;
        pop(ev, id, "처음부터!", "fail");
      }
    } else if (id === "pot" && p.state === "heat") {
      p.heat = Math.max(0, Math.min(st.cfg.heatTargets.length - 1, p.heat + (dir === "up" ? 1 : -1)));
    }
  }

  return {
    flavors: ["plain"],
    create: create,
    stations: stations,
    update: update,
    press: press,
    hold: hold,
    release: release,
    up: function (g, st, id, ev) { arrow(g, st, id, "up", ev); },
    down: function (g, st, id, ev) { arrow(g, st, id, "down", ev); },
    rubbable: function (st, id) { return id === "pot" && (st.pot.state === "radish" || st.pot.state === "crab"); }
  };
})();

if (typeof module !== "undefined") module.exports = SNACK_LOGIC.eomuk;
