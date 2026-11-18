/*
 * 화면 그리기 공용 도구 (게이지, 색, 기본 그림)
 */
var Kit = (function () {
  "use strict";

  function hex(a) { var n = parseInt(a.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var x = hex(a), y = hex(b);
    return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t); }).join(",") + ")";
  }

  // 0 = 생반죽, 1 = 노릇, burnt = 탐
  function cookColor(v, burnt) {
    if (v <= 1) return mix("#f3dcae", "#d98a2b", v);
    return mix("#d98a2b", "#3a2414", (v - 1) / (burnt - 1));
  }

  // 가로 게이지. zone = [시작, 끝] (0~1), danger면 빨강
  function gauge(v, zone, danger, cls) {
    v = Math.max(0, Math.min(1, v));
    var inZone = zone && v >= zone[0];
    var color = danger ? "var(--bad)" : inZone ? "var(--good)" : "#fff";
    return '<div class="gauge ' + (cls || "") + '">' +
      (zone ? '<span class="zone" style="left:' + (zone[0] * 100) + "%;width:" + ((zone[1] - zone[0]) * 100) + '%"></span>' : "") +
      '<i style="width:' + (v * 100).toFixed(1) + "%;background:" + color + '"></i></div>';
  }

  // 붕어빵 모양 SVG
  function fish(fill, stroke, extra) {
    return '<svg class="fish" viewBox="0 0 120 72" aria-hidden="true">' +
      '<path d="M10 36 L0 14 L26 26 Q46 4 78 8 Q114 14 118 36 Q114 58 78 64 Q46 68 26 46 L0 58 Z" fill="' + fill +
      '" stroke="' + (stroke || "rgba(0,0,0,.25)") + '" stroke-width="3" stroke-linejoin="round"/>' +
      (extra || "") + "</svg>";
  }
  function fishDetails(color) {
    return '<circle cx="96" cy="28" r="4" fill="' + color + '"/>' +
      '<path d="M50 24 q6 12 0 24 M62 22 q6 14 0 28 M74 22 q6 14 0 28" fill="none" stroke="' + color +
      '" stroke-width="3" stroke-linecap="round" opacity=".55"/>';
  }

  function itemIcon(kind) {
    var key = "item_" + kind;
    if (Assets.has(key)) return Assets.img(key, "item-img");
    if (kind === "hotteok") return '<span class="item-disc"></span>';
    if (kind === "eomuk") return '<span class="item-emoji">🍢</span>';
    var dot = kind === "bungeo_red" ? "#6d2323" : "#f6dc8c";
    return '<span class="item-fish">' + fish("#e2a14a", "#8a4a10", '<circle cx="62" cy="36" r="13" fill="' + dot + '" stroke="#fff" stroke-width="3"/>') + "</span>";
  }

  return { mix: mix, cookColor: cookColor, gauge: gauge, fish: fish, fishDetails: fishDetails, itemIcon: itemIcon };
})();
