# 이미지 에셋

이 폴더에 아래 파일명 그대로 **배경이 투명한 PNG**를 넣으면 게임에 자동으로 적용됩니다.
없는 파일은 코드로 그린 기본 그림이 나오니, 준비된 것부터 하나씩 넣어도 됩니다.

- 화면 기준: 393×852 (iPhone 16)
- 선명하게 보이도록 **표시 크기의 3배**로 만들어 주세요.
- 파일명 규칙: `간식이름_무엇.png` (공통은 `common_`, 메뉴 카드는 `menu_`, 주문 아이콘은 `item_`)

## 공통

| 파일명 | 내용 | 표시 크기 (px) |
|---|---|---|
| `common_customer_happy.png` | 손님 😊 (상반신, 아래가 카운터에 가려져도 되게) | 170 × 160 |
| `common_customer_neutral.png` | 손님 😐 | 170 × 160 |
| `common_customer_angry.png` | 손님 😠 | 170 × 160 |
| `common_customer_furious.png` | 손님 🤬 (화나서 떠날 때) | 170 × 160 |
| `common_heart_full.png` | 하트 (남은 것) | 26 × 26 |
| `common_heart_empty.png` | 하트 (잃은 것) | 26 × 26 |

## 메뉴 카드 / 주문 아이콘

| 파일명 | 내용 | 표시 크기 (px) |
|---|---|---|
| `menu_bungeo.png` | 메뉴 화면 붕어빵 그림 | 84 × 54 |
| `menu_hotteok.png` | 메뉴 화면 호떡 그림 | 84 × 54 |
| `menu_eomuk.png` | 메뉴 화면 어묵 그림 | 84 × 54 |
| `item_bungeo_red.png` | 주문·접시에 뜨는 팥 붕어빵 아이콘 | 32 × 26 |
| `item_bungeo_cream.png` | 슈크림 붕어빵 아이콘 | 32 × 26 |
| `item_hotteok.png` | 호떡 아이콘 | 32 × 26 |
| `item_eomuk.png` | 어묵 그릇 아이콘 | 32 × 26 |

## 붕어빵

모두 **같은 크기, 물고기가 오른쪽을 보는 방향**으로 맞춰 주세요. 틀 위에 겹쳐서 보여요.

| 파일명 | 내용 | 표시 크기 (px) |
|---|---|---|
| `bungeo_mold.png` | 빈 붕어빵 틀 (위에서 본 모양) | 168 × 82 |
| `bungeo_batter.png` | 틀에 부은 반죽 | 168 × 82 |
| `bungeo_filling_red.png` | 팥 앙금 (작은 덩어리) | 44 × 33 |
| `bungeo_filling_cream.png` | 슈크림 (작은 덩어리) | 44 × 33 |
| `bungeo_mold_lid.png` | 덮은 틀 (뚜껑) | 168 × 82 |
| `bungeo_burnt.png` | 탄 붕어빵 | 168 × 82 |
| `bungeo_spill.png` | 반죽이 넘친 모습 | 168 × 82 |

## 호떡

| 파일명 | 내용 | 표시 크기 (px) |
|---|---|---|
| `hotteok_bowl.png` | 반죽이 담긴 볼 (주걱 없이) | 148 × 100 |
| `hotteok_plate.png` | 빈 접시 | 148 × 100 |
| `hotteok_dough_raw.png` | 울퉁불퉁한 반죽 덩이 | 50 × 44 |
| `hotteok_dough_round.png` | 동그랗게 다듬은 반죽 덩이 | 50 × 44 |
| `hotteok_griddle.png` | 철판 한 칸 (가운데 둥근 홈) | 108 × 134 |
| `hotteok_raw.png` | 눌러서 납작해진 생반죽 | 84 × 84 |
| `hotteok_golden.png` | 노릇하게 구워진 호떡 | 84 × 84 |
| `hotteok_burnt.png` | 탄 호떡 | 84 × 84 |
| `hotteok_burst.png` | 시럽이 터진 호떡 | 84 × 84 |

호떡 4종(`hotteok_raw/golden/burnt/burst`)은 같은 크기, 같은 위치로 맞춰 주세요. 굽는 동안 겹쳐서 색이 자연스럽게 바뀝니다.

## 어묵

| 파일명 | 내용 | 표시 크기 (px) |
|---|---|---|
| `eomuk_board.png` | 꼬치 꽂는 도마 | 148 × 96 |
| `eomuk_pot.png` | 빈 냄비 (위에서 본 모양) | 156 × 146 |
| `eomuk_radish.png` | 손질한 무 (냄비 안에 들어갈 크기) | 56 × 48 |
| `eomuk_crab.png` | 꽃게 | 56 × 48 |
| `eomuk_bowl.png` | 빈 그릇 | 148 × 96 |

배경(밤하늘, 천막, 나무 작업대)은 코드로 그리고 있어서 이미지가 필요 없습니다.
