/*
 * 호떡 화면
 */
var SNACK_VIEW = (typeof SNACK_VIEW !== "undefined") ? SNACK_VIEW : {};
SNACK_VIEW.hotteok = (function () {
  "use strict";

  var layout = {
    bowl:  { x: 14,  y: 432, w: 176, h: 154, label: "젓기" },
    plate: { x: 203, y: 432, w: 176, h: 154, label: "만지기" },
    slot0: { x: 10,  y: 600, w: 120, h: 190, label: "철판 1" },
    slot1: { x: 137, y: 600, w: 120, h: 190, label: "철판 2" },
    slot2: { x: 264, y: 600, w: 120, h: 190, label: "철판 3" }
  };

  var BALL_POS = [[30, 44], [92, 44], [61, 74]];

  function bowl(st) {
    var art = Assets.img("hotteok_bowl", "fill",
      '<div class="bowl-cs"><div class="batter-cs"></div></div>');
    var ang = Math.round(st.stir * 360);
    return '<div class="art-box">' + art +
      '<div class="spatula-cs" style="transform:rotate(' + ang + 'deg)"><i></i></div></div>' +
      Kit.gauge(st.stir, null, false, "low");
  }

  function plate(st) {
    var html = '<div class="art-box">' + Assets.img("hotteok_plate", "fill", '<div class="plate-cs"></div>');
    st.doughs.forEach(function (d, i) {
      var p = BALL_POS[i], round = d.shape >= 1;
      var k = round ? "hotteok_dough_round" : "hotteok_dough_raw";
      var t = d.shape, l = function (a) { return (a + (50 - a) * t).toFixed(0) + "%"; };
      var radius = l(36) + " " + l(64) + " " + l(66) + " " + l(34) + " / " + l(44) + " " + l(36) + " " + l(64) + " " + l(56);
      html += '<div class="ball-cs' + (round ? " ready" : "") + '" style="left:' + p[0] + "px;top:" + p[1] + 'px">' +
        Assets.img(k, "fill", '<i style="border-radius:' + radius + '"></i>') +
        (round ? "" : '<b style="width:' + (d.shape * 100) + '%"></b>') + "</div>";
    });
    return html + "</div>";
  }

  function hotteok(sl, cfg, holding) {
    var html = "";
    if (sl.state === "empty") return "";
    if (sl.state === "dough") {
      var f = 1 + sl.press * 0.4;
      html = '<div class="hot-cs dome" style="transform:scale(' + f.toFixed(2) + "," + (1 / f).toFixed(2) + ')">' +
        Assets.img("hotteok_dough_round", "fill") + "</div>";
      if (holding) html += '<div class="presser-cs"><i></i></div>';
      return html;
    }
    var top, rim, shown;
    if (sl.state === "cookA") { top = 0.05; rim = sl.cookA; shown = sl.cookA; }
    else if (sl.state === "cookB") { top = sl.cookA; rim = sl.cookB; shown = Math.max(sl.cookA, sl.cookB); }
    else if (sl.state === "burnt") { top = rim = shown = cfg.cookBurnt; }
    else { top = 0.05; rim = 0.1; shown = 0; }

    if (Assets.has("hotteok_raw")) {
      var g = Math.min(1, shown), b = Math.max(0, (shown - 1) / (cfg.cookBurnt - 1));
      html = '<div class="hot-cs layers">' +
        (sl.state === "burst" ? Assets.img("hotteok_burst", "fill") :
          Assets.img("hotteok_raw", "fill") +
          '<span style="opacity:' + g.toFixed(2) + '">' + Assets.img("hotteok_golden", "fill") + "</span>" +
          '<span style="opacity:' + b.toFixed(2) + '">' + Assets.img("hotteok_burnt", "fill") + "</span>") +
        "</div>";
    } else {
      html = '<div class="hot-cs' + (sl.state === "burst" ? " burst" : "") + '" style="background:' +
        Kit.cookColor(top, cfg.cookBurnt) + ";border-color:" + Kit.cookColor(rim, cfg.cookBurnt) + '"></div>';
    }
    if (sl.state === "burnt") html += '<div class="smoke">💨</div>';
    return html;
  }

  function slot(st, i, ctx) {
    var sl = st.slots[i], c = st.cfg, g = "";
    if (sl.state === "dough") g = Kit.gauge(sl.press / c.pressBurst, [c.pressGoodMin / c.pressBurst, 0.97], sl.press > 0.85);
    if (sl.state === "cookA") g = Kit.gauge(sl.cookA / c.cookBurnt, [c.cookReady / c.cookBurnt, 1.2 / c.cookBurnt], sl.cookA > 1.25);
    if (sl.state === "cookB") g = Kit.gauge(sl.cookB / c.cookBurnt, [c.cookReady / c.cookBurnt, 1.2 / c.cookBurnt], sl.cookB > 1.25);
    return '<div class="griddle-cs">' + Assets.img("hotteok_griddle", "fill", '<div class="hole-cs"></div>') +
      '<div class="hole-content">' + hotteok(sl, c, ctx.holding) + "</div></div>" + g;
  }

  function render(g, st, id, ctx) {
    if (id === "bowl") return bowl(st);
    if (id === "plate") return plate(st);
    return slot(st, +id.slice(4), ctx);
  }

  function hint(g, st, id) {
    if (id === "bowl") return { act: "반죽 젓기", mode: "mash", alt: "↑↓ 번갈아도 돼요" };
    if (id === "plate") return { act: "반죽 동그랗게 만지기", mode: "mash", alt: "↑↓ 번갈아도 돼요" };
    var sl = st.slots[+id.slice(4)], c = st.cfg;
    switch (sl.state) {
      case "empty": return { act: "동그란 반죽 올리기", mode: "tap", go: st.doughs.some(function (d) { return d.shape >= 1; }) };
      case "dough": return { act: "눌러서 납작하게 (초록에서 떼기)", mode: "hold", go: true };
      case "cookA": return { act: sl.cookA >= c.cookReady ? "뒤집기" : "굽는 중…", mode: "tap", go: sl.cookA >= c.cookReady };
      case "cookB": return { act: sl.cookB >= c.cookReady ? "꺼내기" : "굽는 중…", mode: "tap", go: sl.cookB >= c.cookReady };
      default: return { act: "버리기", mode: "tap" };
    }
  }

  return { layout: layout, render: render, hint: hint, items: { plain: "hotteok" }, flavorNames: { plain: "호떡" } };
})();
