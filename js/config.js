/*
 * 겨울 간식 포장마차 — 게임 설정
 * 밸런스 조정은 이 파일의 숫자만 바꾸면 됩니다. 시간 단위는 "초"입니다.
 */
var GAME_CONFIG = {
  // ── 모든 간식 공통 ───────────────────────────
  common: {
    startHearts: 3,           // 하트 3개, 0개면 게임 오버
    maxCustomers: 2,          // 동시에 기다리는 손님 (항상 맨 앞 손님에게 줌)
    patienceMultiplier: 1.0,  // ★ 손님 성격 한 번에 조절: 1.5면 모든 손님이 1.5배 오래 기다림
    firstCustomerDelay: 3,    // 첫 손님이 오는 시간
    spawnIntervalStart: 18,   // 처음 손님 등장 간격
    spawnIntervalMin: 8,      // 가장 빠를 때 손님 등장 간격
    spawnIntervalDecay: 0.06, // 1초마다 줄어드는 양 (18 → 8까지 약 170초)
    wrongItemPenalty: 3,      // 다른 맛을 주면 깎이는 인내심(초)
    // 경과 시간(초)에 따른 주문 개수 확률 (가중치, 1개~5개)
    orderWeights: [
      { until: 30, weights: [6, 4, 0, 0, 0] },
      { until: 90, weights: [4, 4, 3, 0, 0] },
      { until: Infinity, weights: [2, 3, 3, 2, 2] }
    ],
    moodThresholds: { happy: 0.6, neutral: 0.3 }
  },

  // ── 간식별 설정 ──────────────────────────────
  snacks: {
    bungeo: {
      name: "붕어빵",
      price: 1000,
      patienceBase: 25,       // 인내심 = patienceBase + 개수 × patiencePerItem
      patiencePerItem: 10,    //   1개 35초, 5개 75초
      slots: 3,               // 붕어빵 틀 칸 수
      pourRate: 0.9,          // 꾹 누르고 있을 때 1초당 반죽이 차는 양
      pourGoodMin: 0.55,      // 이 이상에서 손을 떼면 성공
      pourOver: 1.0,          // 여기 닿으면 넘침 (실패)
      cookRateA: 1 / 3.0,     // 앞면이 노릇해지는 데 3초
      cookRateB: 1 / 2.5,     // 뒷면 2.5초
      cookReady: 0.7,         // 이 이상이면 뒤집기/꺼내기 가능
      cookBurnt: 1.5          // 여기 닿으면 탐
    },
    hotteok: {
      name: "호떡",
      price: 2000,
      patienceBase: 25,
      patiencePerItem: 10,
      slots: 3,
      stirTaps: 6,            // 스페이스 몇 번에 반죽 1덩이
      shapeTaps: 4,           // 스페이스 몇 번에 동그랗게
      doughCapacity: 3,       // 접시에 올릴 수 있는 반죽 수
      pressRate: 1.0,
      pressGoodMin: 0.55,
      pressBurst: 1.0,        // 시럽 터짐
      cookRateA: 1 / 3.0,
      cookRateB: 1 / 2.5,
      cookReady: 0.7,
      cookBurnt: 1.5
    },
    eomuk: {
      name: "어묵",
      price: 500,
      patienceBase: 30,       // 처음엔 국물 끓이는 시간이 필요해서 조금 더 김
      patiencePerItem: 6,
      skewerSteps: 4,         // 꼬치 하나에 필요한 지그재그 횟수
      skewerCapacity: 6,      // 미리 만들어 둘 수 있는 꼬치 수
      waterRate: 0.8,         // 물 붓기
      waterGoodMin: 0.6,
      waterOver: 1.0,
      chopTaps: 5,            // 무, 꽃게 손질에 필요한 스페이스 횟수 (각각)
      heatTargets: [0, 0.42, 0.68, 0.95], // 불 세기 0~3단계가 향하는 온도
      tempRate: 0.35,         // 온도가 목표로 따라가는 속도
      driftRange: 0.18,       // 바람 때문에 온도가 흔들리는 정도
      driftEvery: 1.6,        // 흔들림이 바뀌는 간격
      goodTemp: [0.55, 0.82], // 이 온도 구간을 유지하면 국물이 끓음
      boilNeeded: 4,          // 좋은 온도로 이만큼 유지하면 국물 완성
      overTemp: 0.9,          // 이 온도 이상이 계속되면
      overTime: 2.0,          //   이 시간 뒤 끓어 넘침 (실패)
      servingsPerPot: 6,      // 국물 한 솥으로 담을 수 있는 그릇 수
      ladleRate: 1.1,         // 국물 담기
      ladleGoodMin: 0.6,
      ladleOver: 1.0
    }
  },

  snackOrder: ["bungeo", "hotteok", "eomuk"]
};

if (typeof module !== "undefined") module.exports = GAME_CONFIG;
