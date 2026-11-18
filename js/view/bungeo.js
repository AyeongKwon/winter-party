/*
 * 붕어빵 화면
 */
var SNACK_VIEW = (typeof SNACK_VIEW !== "undefined") ? SNACK_VIEW : {};
SNACK_VIEW.bungeo = (function () {
  "use strict";

  var layout = {
    slot0: { x: 14, y: 432, w: 365, h: 114, label: "틀 1" },
    slot1: { x: 14, y: 554, w: 365, h: 114, label: "틀 2" },
    slot2: { x: 14, y: 676, w: 365, h: 114, label: "틀 3" }
  };

  var BATTER = "#f1d9a6";
  var FILL = { red: "#6d2323", cream: "#f6dc8c" };
  var NAME = { red: "팥", cream: "슈크림" };

  var STEP = {
    empty: "빈 틀", pour1: "반죽 붓기", fill: "속 넣기", pour2: "반죽 덮기",
    close: "틀 덮기", cookA: "앞면 굽는 중", cookB: "뒷면 굽는 중", burnt: "탔어요", spill: "넘쳤어요"
  };

  function filling(flavor) {
    if (!flavor) return "";
    return '<div class="filling-cs">' + Assets.img("bungeo_filling_" + flavor, "fill",
      '<i style="background:' + FILL[flavor] + '"></i>') + "</div>";
  }

  function mold(sl, c) {
    var mold = Assets.img("bungeo_mold", "fill", Kit.fish("#2f2f35", "#55555d"));
    var inside = "";
    var batter = function (op) {
      return '<div class="layer" style="opacity:' + op.toFixed(2) + '">' +
        Assets.img("bungeo_batter", "fill", Kit.fish(BATTER, "none")) + "</div>";
    };
    switch (sl.state) {
      case "pour1": inside = batter(Math.min(1, sl.pour / c.pourGoodMin) * 0.8); break;
      case "fill": inside = batter(0.8); break;
      case "pour2": inside = batter(0.8) + filling(sl.flavor) + batter(Math.min(1, sl.pour / c.pourGoodMin)); break;
      case "close": inside = batter(1); break;
      case "cookA": case "cookB":
        var v = sl.state === "cookA" ? sl.cookA : sl.cookB;
        var glow = Kit.cookColor(v, c.cookBurnt);
        inside = '<div class="layer lid">' + Assets.img("bungeo_mold_lid", "fill", Kit.fish("#3b3b42", glow)) + "</div>" +
          '<div class="steam">' + (v > 0.4 ? "♨" : "") + "</div>";
        break;
      case "burnt": inside = '<div class="layer">' + Assets.img("bungeo_burnt", "fill", Kit.fish("#3a2414", "#1c120a", Kit.fishDetails("#120a05"))) + '</div><div class="smoke">💨</div>'; break;
      case "spill": inside = '<div class="layer spill">' + Assets.img("bungeo_spill", "fill", Kit.fish(BATTER, "none") + '<i class="splash"></i>') + "</div>"; break;
    }
    return '<div class="mold-cs"><div class="layer">' + mold + "</div>" + inside + "</div>";
  }

  function render(g, st, id) {
    var sl = st.slots[+id.slice(4)], c = st.cfg, gaugeHtml = "";
    if (sl.state === "pour1" || sl.state === "pour2") gaugeHtml = Kit.gauge(sl.pour / c.pourOver, [c.pourGoodMin / c.pourOver, 0.97], sl.pour > 0.85 * c.pourOver);
    if (sl.state === "cookA") gaugeHtml = Kit.gauge(sl.cookA / c.cookBurnt, [c.cookReady / c.cookBurnt, 1.2 / c.cookBurnt], sl.cookA > 1.25);
    if (sl.state === "cookB") gaugeHtml = Kit.gauge(sl.cookB / c.cookBurnt, [c.cookReady / c.cookBurnt, 1.2 / c.cookBurnt], sl.cookB > 1.25);
    var tag = sl.flavor ? '<span class="flavor-tag ' + sl.flavor + '">' + NAME[sl.flavor] + "</span>" : "";
    return mold(sl, c) +
      '<div class="side-cs"><div class="step-name">' + STEP[sl.state] + tag + "</div>" + gaugeHtml + "</div>";
  }

  function hint(g, st, id) {
    var sl = st.slots[+id.slice(4)], c = st.cfg;
    switch (sl.state) {
      case "empty": return { act: "반죽 붓기 (초록에서 떼기)", mode: "hold", go: true };
      case "pour1": return { act: "반죽 붓기 (초록에서 떼기)", mode: "hold", go: true };
      case "fill": return { act: "속 고르기", mode: null, up: "팥", down: "슈크림", go: true };
      case "pour2": return { act: "반죽으로 덮기 (초록에서 떼기)", mode: "hold", go: true };
      case "close": return { act: "틀 덮기", mode: "tap", go: true };
      case "cookA": return { act: sl.cookA >= c.cookReady ? "뒤집기" : "굽는 중…", mode: "tap", go: sl.cookA >= c.cookReady };
      case "cookB": return { act: sl.cookB >= c.cookReady ? "꺼내기" : "굽는 중…", mode: "tap", go: sl.cookB >= c.cookReady };
      default: return { act: "버리기", mode: "tap" };
    }
  }

  return {
    layout: layout, render: render, hint: hint,
    items: { red: "bungeo_red", cream: "bungeo_cream" },
    flavorNames: NAME
  };
})();
