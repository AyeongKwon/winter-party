/*
 * 어묵 화면
 */
var SNACK_VIEW = (typeof SNACK_VIEW !== "undefined") ? SNACK_VIEW : {};
SNACK_VIEW.eomuk = (function () {
  "use strict";

  var layout = {
    skewer: { x: 14,  y: 432, w: 176, h: 170, label: "꼬치" },
    bowl:   { x: 203, y: 432, w: 176, h: 170, label: "그릇" },
    pot:    { x: 14,  y: 612, w: 365, h: 178, label: "냄비" }
  };

  var STEP = {
    empty: "빈 냄비", water: "물 붓기", radish: "무 손질", crab: "꽃게 손질",
    heat: "끓이는 중", ready: "국물 완성", overflow: "넘쳤어요"
  };

  function skewer(st) {
    var arrows = st.seq.map(function (d, i) {
      var cls = i < st.seqPos ? "done" : i === st.seqPos ? "now" : "";
      return '<span class="arrow ' + cls + '">' + (d === "up" ? "↑" : "↓") + "</span>";
    }).join("");
    // 지그재그로 꽂힌 어묵
    var pts = ["88,24"], y = 24;
    for (var i = 0; i < st.seqPos; i++) { y += 18; pts.push((st.seq[i] === "up" ? 64 : 112) + "," + y); }
    var zig = st.seqPos ? '<polyline points="' + pts.join(" ") + '" fill="none" stroke="#e9b35f" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>' : "";
    var art = Assets.img("eomuk_board", "fill", '<div class="board-cs"></div>') +
      '<svg class="stick-svg" viewBox="0 0 176 120" aria-hidden="true"><line x1="88" y1="6" x2="88" y2="114" stroke="#d9b98a" stroke-width="5" stroke-linecap="round"/>' + zig + "</svg>";
    return '<div class="arrows">' + arrows + '</div><div class="art-box short">' + art + "</div>" +
      '<div class="stock">꼬치 ' + st.skewers + "/" + st.cfg.skewerCapacity + "</div>";
  }

  function pot(st) {
    var p = st.pot, c = st.cfg;
    var water = p.state === "water" ? Math.min(1, p.water / c.waterGoodMin) :
      (p.state === "empty" || p.state === "overflow") ? 0 : 1;
    var inside = '<div class="water-cs" style="opacity:' + (water * 0.85).toFixed(2) + '"></div>';
    var past = ["crab", "heat", "ready"].indexOf(p.state) >= 0;
    var crabIn = p.state === "heat" || p.state === "ready";
    if (past) inside += Assets.img("eomuk_radish", "pot-radish", '<i class="radish-cs a"></i><i class="radish-cs b"></i><i class="radish-cs c"></i>');
    if (crabIn) inside += Assets.img("eomuk_crab", "pot-crab", '<span class="crab-cs">🦀</span>');
    if (p.state === "ready") inside += '<span class="skewers-in">🍢🍢</span>';
    if ((p.state === "heat" && p.temp > 0.5) || p.state === "ready") inside += '<span class="bubbles">○ ° ○</span>';
    if (p.state === "overflow") inside += '<i class="spill-cs"></i>';

    var right = '<div class="step-name">' + STEP[p.state] + "</div>";
    if (p.state === "water") right += Kit.gauge(p.water / c.waterOver, [c.waterGoodMin / c.waterOver, 0.97], p.water > 0.85 * c.waterOver);
    if (p.state === "radish" || p.state === "crab") right += '<div class="chop">' + (p.state === "radish" ? "무" : "🦀") + " 🔪</div>" + Kit.gauge(p.chop, null, false);
    if (p.state === "heat") {
      var zone = c.goodTemp;
      right += '<div class="temp-row"><span>온도</span>' + Kit.gauge(p.temp, zone, p.temp >= c.overTemp) + "</div>" +
        '<div class="temp-row"><span>완성</span>' + Kit.gauge(p.boil / c.boilNeeded, null, false) + "</div>";
    }
    if (p.state === "ready") right += '<div class="servings">국물 ' + p.servings + "그릇 남음</div>";

    var flames = p.state === "heat" ? '<div class="flames">' + "🔥".repeat(p.heat) + (p.heat ? "" : "불 꺼짐") + "</div>" : "";
    return '<div class="pot-cs">' + Assets.img("eomuk_pot", "fill", '<div class="pot-body"></div>') +
      '<div class="pot-inside">' + inside + "</div>" + flames + "</div>" +
      '<div class="side-cs pot-side">' + right + "</div>";
  }

  function bowl(st) {
    var fill = Math.min(1, st.ladle / st.cfg.ladleGoodMin);
    var art = Assets.img("eomuk_bowl", "fill", '<div class="bowl2-cs"><i style="height:' + (fill * 70).toFixed(0) + '%"></i></div>');
    var g = st.ladling || st.ladle > 0 ? Kit.gauge(st.ladle / st.cfg.ladleOver, [st.cfg.ladleGoodMin / st.cfg.ladleOver, 0.97], st.ladle > 0.85) : "";
    var stick = st.ladling || st.ladle > 0 ? '<span class="skewer-in-bowl">🍢</span>' : "";
    return '<div class="art-box short">' + art + stick + "</div>" + g +
      '<div class="stock">꼬치 + 국물</div>';
  }

  function render(g, st, id) {
    if (id === "skewer") return skewer(st);
    if (id === "pot") return pot(st);
    return bowl(st);
  }

  function hint(g, st, id) {
    var p = st.pot;
    if (id === "skewer") return { act: "화살표 순서대로 꽂기", mode: null, up: "위", down: "아래", go: st.skewers < st.cfg.skewerCapacity };
    if (id === "bowl") return { act: "국물 담기 (초록에서 떼기)", mode: "hold", go: st.skewers > 0 && p.state === "ready" };
    switch (p.state) {
      case "empty": case "water": return { act: "물 붓기 (초록에서 떼기)", mode: "hold", go: true };
      case "radish": return { act: "무 손질", mode: "mash", go: true };
      case "crab": return { act: "꽃게 손질", mode: "mash", go: true };
      case "heat": return { act: "불 조절해서 온도를 초록에 맞추기", mode: null, up: "불 세게", down: "불 약하게", go: true };
      case "ready": return { act: "그릇에서 담아요", mode: null };
      default: return { act: "치우기", mode: "tap" };
    }
  }

  return { layout: layout, render: render, hint: hint, items: { plain: "eomuk" }, flavorNames: { plain: "어묵" } };
})();
