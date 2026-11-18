/*
 * 호떡 만들기 — 게임 설정
 * 밸런스 조정은 이 파일의 숫자만 바꾸면 됩니다.
 * 시간 단위는 모두 "초"입니다.
 */
var HOTTEOK_CONFIG = {
  // ── 점수 / 하트 ─────────────────────────────
  pricePerHotteok: 2000,     // 호떡 1개 = 2,000원
  startHearts: 3,            // 하트 3개, 0개면 게임 오버

  // ── 손님 ───────────────────────────────────
  maxCustomers: 3,           // 동시에 기다리는 손님 수
  firstCustomerDelay: 1.0,   // 게임 시작 후 첫 손님이 오는 시간
  spawnIntervalStart: 12,    // 처음 손님 등장 간격
  spawnIntervalMin: 5,       // 가장 빠를 때 손님 등장 간격
  spawnIntervalDecay: 0.1,   // 1초 지날 때마다 간격이 줄어드는 양 (12 → 5까지 약 70초)

  patienceBase: 10,          // 인내심 = patienceBase + 주문 개수 × patiencePerItem
  patiencePerItem: 7,        //   1개: 17초, 5개: 45초

  // 경과 시간(초)에 따른 주문 개수 확률 (가중치, 순서대로 1개~5개)
  orderWeights: [
    { until: 30,       weights: [6, 4, 0, 0, 0] }, // 처음 30초: 1~2개 위주
    { until: 90,       weights: [4, 4, 3, 0, 0] }, // 30~90초: 1~3개
    { until: Infinity, weights: [2, 3, 3, 2, 2] }  // 이후: 1~5개
  ],

  // 표정이 바뀌는 인내심 비율
  moodThresholds: { happy: 0.6, neutral: 0.3 }, // 60% 이상 😊, 30% 이상 😐, 그 아래 😠

  // ── 1단계: 반죽 젓기 ────────────────────────
  stirDistancePerDough: 800,  // 볼을 이만큼(px) 문지르면 반죽 1덩이 완성
  doughPlateCapacity: 3,      // 접시에 올릴 수 있는 반죽 수

  // ── 2단계: 반죽 만지기 ──────────────────────
  shapeDistance: 450,         // 반죽을 이만큼(px) 문지르면 동그랗게 완성

  // ── 3단계: 누르기 ───────────────────────────
  pressRate: 1.0,             // 꾹 누르고 있을 때 1초당 차오르는 양
  pressGoodMin: 0.55,         // 이 값 이상에서 손을 떼면 성공
  pressBurst: 1.0,            // 이 값에 닿으면 시럽이 터짐 (실패)

  // ── 3단계: 굽기 ─────────────────────────────
  cookRateA: 1 / 3.0,         // 앞면: 3초면 노릇 (1.0)
  cookRateB: 1 / 2.5,         // 뒷면: 2.5초면 노릇
  cookReady: 0.7,             // 이 값 이상이면 뒤집기 / 꺼내기 가능
  cookBurnt: 1.5,             // 이 값에 닿으면 탐 (실패)

  // ── 철판 칸 위치 (철판 이미지 기준 %, 디자인에 맞게 조정) ──
  panSlots: [
    { x: 27, y: 42 },
    { x: 50, y: 66 },
    { x: 73, y: 42 }
  ]
};

if (typeof module !== "undefined") module.exports = HOTTEOK_CONFIG;
