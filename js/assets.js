/*
 * 겨울 간식 포장마차 — 이미지 에셋 목록
 * assets/ 폴더에 아래 파일명으로 PNG(배경 투명)를 넣으면 자동으로 바뀝니다.
 * 없는 파일은 코드로 그린 기본 그림이 나옵니다. 자세한 규격은 assets/README.md 참고.
 */
var Assets = (function () {
  "use strict";

  var FILES = [
    // 공통
    "common_customer_happy", "common_customer_neutral", "common_customer_angry", "common_customer_furious",
    "common_heart_full", "common_heart_empty",
    // 메뉴 카드 & 주문 아이콘
    "menu_bungeo", "menu_hotteok", "menu_eomuk",
    "item_bungeo_red", "item_bungeo_cream", "item_hotteok", "item_eomuk",
    // 붕어빵
    "bungeo_mold", "bungeo_mold_lid", "bungeo_batter", "bungeo_filling_red", "bungeo_filling_cream",
    "bungeo_burnt", "bungeo_spill",
    // 호떡
    "hotteok_bowl", "hotteok_plate", "hotteok_dough_raw", "hotteok_dough_round", "hotteok_griddle",
    "hotteok_raw", "hotteok_golden", "hotteok_burnt", "hotteok_burst",
    // 어묵
    "eomuk_board", "eomuk_pot", "eomuk_radish", "eomuk_crab", "eomuk_bowl"
  ];

  var loaded = {};

  function preload(base, done) {
    var left = FILES.length;
    FILES.forEach(function (k) {
      var img = new Image();
      img.onload = function () { loaded[k] = img.src; if (--left === 0) done(); };
      img.onerror = function () { if (--left === 0) done(); };
      img.src = base + k + ".png";
    });
  }

  function has(k) { return !!loaded[k]; }

  // 에셋이 있으면 <img>, 없으면 fallback HTML
  function img(k, cls, fallback) {
    if (has(k)) return '<img class="asset ' + (cls || "") + '" src="' + loaded[k] + '" alt="" draggable="false">';
    return fallback || "";
  }

  return { FILES: FILES, preload: preload, has: has, img: img };
})();
