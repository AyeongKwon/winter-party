/*
 * 튜토리얼 대본
 * progress(g, st)가 "지금 몇 번째 단계인지"를 계산합니다. 실수해서 되돌아가면 단계도 자동으로 되돌아가요.
 * 각 단계: focus = 강조할 작업대, key = 키보드 안내, tap = 마우스·터치 안내
 * 마지막 단계(serve: true)가 되면 연습 손님이 한 명 옵니다.
 */
var TUTORIALS = (function () {
  "use strict";

  function anySlot(st, states) {
    return st.slots.some(function (sl) { return states.indexOf(sl.state) >= 0; });
  }
  function totalReady(g) {
    var n = 0;
    for (var f in g.ready) n += g.ready[f];
    return n;
  }

  var bungeo = {
    steps: [
      { focus: "slot0", key: "틀에서 <kbd>스페이스</kbd>를 꾹 누르고 있다가, 게이지가 <b>초록</b>일 때 떼요. 반죽이 부어져요.",
        tap: "틀을 <b>길게 누르고</b> 있다가, 게이지가 <b>초록</b>일 때 떼요. 반죽이 부어져요." },
      { focus: "slot0", key: "속을 골라요. <kbd>↑</kbd> 팥, <kbd>↓</kbd> 슈크림",
        tap: "속을 골라요. 오른쪽 <b>▲ 팥</b> 또는 <b>▼ 슈크림</b> 버튼" },
      { focus: "slot0", key: "다시 <kbd>스페이스</kbd> 꾹! 초록에서 떼서 반죽으로 덮어요.",
        tap: "다시 <b>길게 누르기</b>! 초록에서 떼서 반죽으로 덮어요." },
      { focus: "slot0", key: "<kbd>스페이스</kbd>를 한 번 눌러 틀을 덮어요.", tap: "틀을 한 번 <b>탭</b>해서 덮어요." },
      { focus: "slot0", key: "굽는 중이에요. 게이지가 <b>초록</b>이 되면 <kbd>스페이스</kbd>로 뒤집어요. 빨강까지 가면 타요!",
        tap: "굽는 중이에요. 게이지가 <b>초록</b>이 되면 <b>탭</b>해서 뒤집어요. 빨강까지 가면 타요!" },
      { focus: "slot0", key: "뒷면도 <b>초록</b>이 되면 <kbd>스페이스</kbd>로 꺼내요.", tap: "뒷면도 <b>초록</b>이 되면 <b>탭</b>해서 꺼내요." },
      { focus: "counter", serve: true,
        key: "손님이 왔어요! <b>주기</b> 칸에서 말풍선의 맛대로 <kbd>↑</kbd> 팥 / <kbd>↓</kbd> 슈크림을 눌러 줘요.",
        tap: "손님이 왔어요! 말풍선의 맛과 같은 <b>접시</b>를 탭해서 줘요." }
    ],
    progress: function (g, st) {
      if (g.sold > 0) return 7;
      if (totalReady(g) > 0) return 6;
      var rank = { empty: 0, pour1: 0, fill: 1, pour2: 2, close: 3, cookA: 4, cookB: 5, burnt: 0, spill: 0 };
      return Math.max.apply(null, st.slots.map(function (sl) { return rank[sl.state]; }));
    },
    warn: function (g, st) {
      return anySlot(st, ["burnt", "spill"]) ? "실패한 틀은 한 번 눌러서 비우고 다시 해봐요." : "";
    },
    serveFlavor: function (g) { return g.ready.cream > 0 ? "cream" : "red"; }
  };

  var hotteok = {
    steps: [
      { focus: "bowl", key: "<b>젓기</b>에서 <kbd>스페이스</kbd>를 연타해요. (<kbd>↑</kbd><kbd>↓</kbd> 번갈아 눌러도 돼요)",
        tap: "<b>볼</b>을 연타하거나 문질러서 반죽을 저어요." },
      { focus: "plate", key: "<kbd>→</kbd>로 <b>만지기</b>에 가서 <kbd>스페이스</kbd> 연타로 반죽을 동그랗게 만들어요.",
        tap: "<b>접시</b>의 반죽을 연타하거나 문질러서 동그랗게 만들어요." },
      { focus: "slot0", key: "<kbd>→</kbd>로 <b>철판</b>에 가서 <kbd>스페이스</kbd>로 반죽을 올려요.", tap: "<b>철판</b>을 탭해서 반죽을 올려요." },
      { focus: "slot0", key: "<kbd>스페이스</kbd>를 꾹! 게이지가 <b>초록</b>일 때 떼면 납작해져요. 너무 오래 누르면 시럽이 터져요.",
        tap: "철판을 <b>길게 누르고</b>, 게이지가 <b>초록</b>일 때 떼요. 너무 오래 누르면 시럽이 터져요." },
      { focus: "slot0", key: "<b>초록</b>이 되면 <kbd>스페이스</kbd>로 뒤집어요.", tap: "<b>초록</b>이 되면 탭해서 뒤집어요." },
      { focus: "slot0", key: "다시 <b>초록</b>이 되면 <kbd>스페이스</kbd>로 꺼내요.", tap: "다시 <b>초록</b>이 되면 탭해서 꺼내요." },
      { focus: "counter", serve: true, key: "손님이 왔어요! <kbd>엔터</kbd>를 누르면 맨 앞 손님에게 줘요.",
        tap: "손님이 왔어요! <b>손님</b>이나 <b>접시</b>를 탭해서 줘요." }
    ],
    progress: function (g, st) {
      if (g.sold > 0) return 7;
      if (totalReady(g) > 0) return 6;
      if (anySlot(st, ["cookB"])) return 5;
      if (anySlot(st, ["cookA"])) return 4;
      if (anySlot(st, ["dough"])) return 3;
      if (st.doughs.some(function (d) { return d.shape >= 1; })) return 2;
      if (st.doughs.length > 0) return 1;
      return 0;
    },
    warn: function (g, st) {
      return anySlot(st, ["burnt", "burst"]) ? "실패한 철판은 한 번 눌러서 비우고 다시 해봐요." : "";
    },
    serveFlavor: function () { return "plain"; }
  };

  var eomuk = {
    steps: [
      { focus: "pot", key: "<b>냄비</b>에서 <kbd>스페이스</kbd>를 꾹, 게이지가 <b>초록</b>일 때 떼면 물이 딱 맞아요.",
        tap: "<b>냄비</b>를 길게 누르고, 게이지가 <b>초록</b>일 때 떼요." },
      { focus: "pot", key: "무를 손질해요. <kbd>스페이스</kbd> 연타!", tap: "무를 손질해요. 냄비를 연타하거나 문질러요!" },
      { focus: "pot", key: "꽃게도 손질해요. <kbd>스페이스</kbd> 연타!", tap: "꽃게도 손질해요. 연타하거나 문질러요!" },
      { focus: "pot", key: "<kbd>↑</kbd>로 불을 켜요. 온도가 <b>초록</b>에 머물도록 <kbd>↑</kbd><kbd>↓</kbd>로 조절하면 국물이 끓어요.",
        tap: "<b>▲ 불 세게</b>로 불을 켜요. 온도가 <b>초록</b>에 머물도록 ▲▼로 조절하면 국물이 끓어요." },
      { focus: "skewer", key: "<b>꼬치</b>로 가서 화면의 화살표 순서대로 <kbd>↑</kbd><kbd>↓</kbd>를 눌러 어묵을 꽂아요. 틀리면 처음부터!",
        tap: "<b>꼬치</b>에서 화면의 화살표 순서대로 ▲▼ 버튼을 눌러요. 틀리면 처음부터!" },
      { focus: "bowl", key: "<b>그릇</b>에서 <kbd>스페이스</kbd> 꾹, 초록에서 떼서 국물을 담아요.",
        tap: "<b>그릇</b>을 길게 누르고, 초록에서 떼서 국물을 담아요." },
      { focus: "counter", serve: true, key: "손님이 왔어요! <kbd>엔터</kbd>를 누르면 맨 앞 손님에게 줘요.",
        tap: "손님이 왔어요! <b>손님</b>이나 <b>접시</b>를 탭해서 줘요." }
    ],
    progress: function (g, st) {
      var p = st.pot.state;
      if (g.sold > 0) return 7;
      if (totalReady(g) > 0) return 6;
      if (p === "ready" && st.skewers > 0) return 5;
      if (p === "ready") return 4;
      if (p === "heat") return 3;
      if (p === "crab") return 2;
      if (p === "radish") return 1;
      return 0;
    },
    warn: function (g, st) {
      return st.pot.state === "overflow" ? "넘친 냄비는 한 번 눌러서 치우고 다시 해봐요." : "";
    },
    serveFlavor: function () { return "plain"; }
  };

  return { bungeo: bungeo, hotteok: hotteok, eomuk: eomuk };
})();
