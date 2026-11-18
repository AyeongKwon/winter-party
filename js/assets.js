/*
 * 호떡 만들기 — 이미지 에셋 목록
 * assets/ 폴더에 아래 파일명으로 PNG(배경 투명)를 넣으면 자동으로 적용됩니다.
 * 파일이 없으면 기본 도형·이모지로 대신 그립니다.
 */
var HotteokAssets = (function () {
  "use strict";

  var FILES = {
    bowl: "bowl.png",                 // 반죽이 담긴 볼
    spatula: "spatula.png",           // 주걱
    plate: "plate.png",               // 빈 접시 (반죽 접시, 완성 접시 공용)
    dough_raw: "dough_raw.png",       // 울퉁불퉁한 반죽 덩이
    dough_round: "dough_round.png",   // 동그랗게 만든 반죽 덩이
    pan: "pan.png",                   // 철판 + 인덕션 (빈 칸)
    presser: "presser.png",           // 누르개
    hotteok_raw: "hotteok_raw.png",   // 눌러서 납작해진 생반죽
    hotteok_golden: "hotteok_golden.png", // 노릇하게 구워진 호떡
    hotteok_burnt: "hotteok_burnt.png",   // 탄 호떡
    hotteok_burst: "hotteok_burst.png",   // 시럽 터진 호떡
    customer_happy: "customer_happy.png",
    customer_neutral: "customer_neutral.png",
    customer_angry: "customer_angry.png",
    customer_furious: "customer_furious.png",
    heart_full: "heart_full.png",
    heart_empty: "heart_empty.png"
  };

  var loaded = {};

  function preload(base, done) {
    var keys = Object.keys(FILES), left = keys.length;
    keys.forEach(function (k) {
      var img = new Image();
      img.onload = function () { loaded[k] = img.src; if (--left === 0) done(); };
      img.onerror = function () { if (--left === 0) done(); };
      img.src = base + FILES[k];
    });
  }

  return {
    FILES: FILES,
    preload: preload,
    has: function (k) { return !!loaded[k]; },
    src: function (k) { return loaded[k]; }
  };
})();
