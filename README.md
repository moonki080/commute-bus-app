# 출퇴근 버스 도착

인천 공공데이터 XML API를 서버에서만 호출해, 정류장으로 걸어가는 동안 가장 빨리 도착하는 버스를 ETA 기준으로 빠르게 확인하는 모바일 퍼스트 Next.js 웹앱입니다.

## 주요 특징

- 출근 / 퇴근 2개 프리셋을 크게 전환하는 모바일 UI
- 특정 버스번호 화이트리스트 없이 정류장으로 들어오는 전체 노선을 ETA 오름차순 정렬
- 같은 노선의 첫 번째 / 두 번째 도착 차량을 하나의 카드로 그룹핑
- `SHORT_BSTOPID` 기반 런타임 정류소 resolve 후 `BSTOPID` 캐시
- 공공데이터 XML 응답을 서버 Route Handler에서만 파싱 및 정규화
- API 키는 서버 환경변수로만 사용하며 클라이언트에 노출하지 않음
- Vercel 배포 전제 구조

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- fast-xml-parser
- Vercel

## 로컬 실행

1. 의존성 설치

```bash
npm install
```

2. 환경변수 파일 생성

```bash
cp .env.example .env.local
```

3. `.env.local`에 공공데이터 서비스키 설정

```env
DATA_GO_KR_SERVICE_KEY=발급받은_서비스키
```

4. 개발 서버 실행

```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 확인

## 환경변수 설정 방법

- 필수 환경변수: `DATA_GO_KR_SERVICE_KEY`
- 공공데이터포털에서 인천 버스 API 서비스키를 발급받아 그대로 넣습니다.
- 서비스키가 이미 URL 인코딩된 형태여도 서버에서 한 번 정규화한 뒤 다시 인코딩하므로 이중 인코딩을 줄이도록 구성했습니다.
- 주의: 서비스키는 클라이언트에 노출되면 안 됩니다.
- 주의: `NEXT_PUBLIC_` 접두사로 선언하면 안 됩니다.

## Vercel 배포 방법

1. 이 프로젝트를 Git 저장소에 올립니다.
2. Vercel에서 새 프로젝트를 생성하고 저장소를 연결합니다.
3. Vercel 프로젝트 설정의 Environment Variables에 `DATA_GO_KR_SERVICE_KEY`를 등록합니다.
4. Build Command는 기본값(`next build`), Output은 Next.js 기본값을 그대로 사용합니다.
5. 배포 후 즉시 `/api/arrivals?mode=commute`로 서버 API가 동작하는지 확인합니다.

## 프리셋 정류장

### 출근

- mode key: `commute`
- 정류장명: `신검단중앙역풍경채어바니티2차`
- short stop id: `89579`
- 방향: `신검단중학교 방면`
- 거리: `252m`

### 퇴근

- mode key: `return`
- 정류장명: `신검단중앙역2번출구`
- short stop id: `89588`
- 방향: `신검단중앙역풍경채어바니티 방면`
- 거리: `1.1km`

## API 구조

### `GET /api/stops/resolve`

- 용도: 정류장명 + `SHORT_BSTOPID`로 실제 `BSTOPID` resolve
- 쿼리:
  - `mode=commute|return`
  - 또는 `stopName`, `shortStopId`
- 내부적으로 `getBusStationNmList` 호출

### `GET /api/arrivals`

- 용도: 현재 모드 정류장의 전체 도착 예정 노선을 정규화된 JSON으로 반환
- 쿼리:
  - `mode=commute|return`
- 내부 흐름:
  1. 프리셋 조회
  2. `getBusStationNmList`로 정류소 resolve
  3. `SHORT_BSTOPID` 일치 항목에서 실제 `BSTOPID` 확보
  4. `getAllRouteBusArrivalList` 호출
  5. XML 파싱
  6. 내부 `ArrivalItem` 모델로 정규화
  7. ETA 오름차순 정렬
  8. 같은 노선은 첫 번째 / 두 번째 도착 정보로 그룹핑

### `GET /api/route-detail`

- 용도: 향후 노선 상세 / 디버깅용 차량 위치 확장
- 쿼리:
  - `routeId`
  - 선택: `routeNo`
- 내부적으로 `getBusRouteLocation` 호출

## 아키텍처 설명

- 클라이언트는 오직 JSON만 받습니다.
  - XML 원문과 서비스키 처리는 모두 `app/api/.../route.ts` 내부 서버 코드에서만 수행합니다.
- 정류소 resolve와 도착정보 조회를 분리했습니다.
  - 정류소명 검색은 비용이 더 크고 자주 바뀌지 않으므로 서버 메모리 캐시를 둬서 트래픽을 줄였습니다.
- 정규화 레이어를 별도 파일로 분리했습니다.
  - 공공데이터 XML 응답 구조는 `item`, `items.item`, `msgBody.itemList`처럼 달라질 수 있어 `lib/xml.ts`, `lib/normalize.ts`에서 흡수합니다.
- UI는 프리셋과 서버 응답을 느슨하게 결합했습니다.
  - 모드 전환 시 프리셋 정보는 즉시 보여주고, 실제 도착정보는 서버에서 받아 갱신합니다.

## 파일 구조

```text
app/
  api/
    arrivals/route.ts
    route-detail/route.ts
    stops/resolve/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  arrival-card.tsx
  empty-state.tsx
  error-state.tsx
  loading-state.tsx
  mode-switch.tsx
  stop-card.tsx
lib/
  bus-api.ts
  normalize.ts
  presets.ts
  utils.ts
  xml.ts
types/
  bus.ts
```

## 구현 세부 규칙

- 특정 버스번호 화이트리스트 필터링을 하지 않습니다.
- 정류장에 들어오는 전체 노선을 가져온 뒤 ETA 기준으로 정렬합니다.
- 노선 카드 정렬 기준은 해당 노선의 첫 번째 도착 ETA입니다.
- 첫 차량 ETA가 `60초 이하`면 `곧 도착`, `180초 이하`면 `임박`으로 강조합니다.
- `SHORT_BSTOPID`를 함께 매칭하지 않으면 유사 정류장명을 잘못 고를 수 있으므로 반드시 함께 확인해야 합니다.

## 주의사항

- 주의: 서비스키는 클라이언트에 노출되면 안 됩니다.
- 주의: 공공데이터 XML 응답 구조가 달라질 수 있으므로 normalize 로직 확인이 필요합니다.
- 주의: 정류소명만으로 찾지 말고 `SHORT_BSTOPID`까지 함께 매칭해야 합니다.
- 주의: 공공데이터 응답에 따라 노선번호 필드명이 달라질 수 있으므로 `lib/normalize.ts`의 후보 키 목록을 점검하면 유지보수에 도움이 됩니다.

## 검증 포인트

- 출근 모드 진입 시 `89579` 정류장이 resolve 되는지
- 퇴근 모드 전환 시 `89588` 정류장이 resolve 되는지
- ETA 오름차순으로 카드가 정렬되는지
- 같은 노선의 2대 도착이 한 카드에 묶이는지
- 빈 응답 / 인증 오류 / XML 파싱 오류에서도 UI가 깨지지 않는지
