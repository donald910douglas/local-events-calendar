/**
 * fetch-busan-events.js
 * 
 * 부산광역시 축제 및 행사 정보 API를 호출하여 데이터를 가져온 뒤,
 * [제목, 일자, 장소, 카테고리] 형식의 캘린더 데이터 스키마로 변환하고
 * Firebase Firestore의 'events' 컬렉션에 중복 없이 업로드(동기화)하는 Node.js 스크립트입니다.
 */

import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// 1. .env 파일 파싱 및 환경 변수 로드 함수 (외부 라이브러리 의존성 없음)
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('⚠️ .env 파일을 찾을 수 없습니다. 프로젝트 루트에서 실행해 주세요.');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const equalIdx = trimmed.indexOf('=');
    if (equalIdx === -1) return;
    
    const key = trimmed.slice(0, equalIdx).trim();
    let val = trimmed.slice(equalIdx + 1).trim();
    
    // 양 끝에 큰따옴표나 작은따옴표가 있는 경우 제거
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}

// 환경 변수 로드
loadEnv();

// API 인증키와 Firebase 설정 변수 존재 확인
const busanApiKey = process.env.VITE_BUSAN_API_KEY;
const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;

if (!busanApiKey) {
  console.warn('⚠️ [주의] VITE_BUSAN_API_KEY가 .env 파일에 비어 있습니다.');
  console.warn('공공데이터포털(data.go.kr)에서 발급받은 인코딩된 Service Key를 .env 파일의 VITE_BUSAN_API_KEY에 입력해 주세요.\n');
}

if (!firebaseApiKey) {
  console.error('❌ [오류] Firebase 설정 변수들이 .env 파일에 채워져 있지 않습니다. 1단계를 먼저 완료해 주세요.');
  process.exit(1);
}

// 2. Firebase 초기화
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. 지능형 텍스트 기반 카테고리 매핑 함수
function determineCategory(title, description) {
  const text = `${title} ${description || ''}`;
  
  if (/세미나|교육|강연|콘퍼런스|포럼|학습|워크숍|특강/i.test(text)) {
    return 'seminar'; // 세미나/교육
  }
  if (/전시|미술|사진전|갤러리|아트|기획전|초대전/i.test(text)) {
    return 'exhibition'; // 전시회
  }
  if (/플리마켓|프리마켓|마켓|벼룩시장|나눔장터/i.test(text)) {
    return 'flea_market'; // 플리마켓
  }
  if (/스포츠|마라톤|러닝|자전거|하이킹|등산|클라이밍|대회/i.test(text)) {
    return 'sports'; // 스포츠
  }
  
  return 'festival'; // 기본값: 축제/문화
}

// 4. 지능형 일자(시작/종료 시간) 추출 파서
function extractStartAndEndDates(item) {
  const text = [
    item.USAGE_DAY_WEEK_AND_TIME,
    item.USAGE_DAY,
    item.ITEMCNTNTS,
    item.MAIN_TITLE
  ].filter(Boolean).join(' ');

  // 날짜 형식 2026-05-24 또는 2026.05.24 또는 2026/05/24 매칭 regex
  const standardRegex = /\b(20[2-3]\d)[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])\b/g;
  let matches = [];
  let match;
  
  while ((match = standardRegex.exec(text)) !== null) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    matches.push(`${year}-${month}-${day}`);
  }

  // YYYY년 MM월 DD일 형식 매칭 regex
  if (matches.length === 0) {
    const koreanRegex = /(20[2-3]\d)\s*년\s*(0?[1-9]|1[0-2])\s*월\s*(0?[1-9]|[12]\d|3[01])\s*일/g;
    while ((match = koreanRegex.exec(text)) !== null) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      matches.push(`${year}-${month}-${day}`);
    }
  }

  // 중복 제거 및 시간순 정렬
  matches = Array.from(new Set(matches)).sort();

  if (matches.length > 0) {
    const start = `${matches[0]}T10:00:00`;
    const end = matches.length > 1 
      ? `${matches[matches.length - 1]}T18:00:00` 
      : `${matches[0]}T18:00:00`;
    return { start, end };
  }

  // 매칭되는 날짜가 없을 경우: 현재 일자 기준 7일 뒤를 시작일로, 8일 뒤를 종료일로 안전하게 폴백 설정
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() + 7);
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 8);
  
  const formatDateStr = (d) => d.toISOString().split('T')[0];
  return {
    start: `${formatDateStr(defaultStart)}T10:00:00`,
    end: `${formatDateStr(defaultEnd)}T18:00:00`
  };
}

// 5. 부산광역시 축제 및 행사 정보 API 호출 함수
async function fetchBusanFestivals() {
  if (!busanApiKey) {
    console.error('❌ API를 요청할 수 없습니다. .env 파일에 VITE_BUSAN_API_KEY를 설정한 후 실행해 주세요.');
    return [];
  }

  // 공공데이터포털 부산축제정보 호출 URL (JSON 형식 요청)
  const baseUrl = 'http://apis.data.go.kr/6260000/FestivalService/getFestivalKr';
  const url = `${baseUrl}?serviceKey=${encodeURIComponent(busanApiKey)}&pageNo=1&numOfRows=30&resultType=json`;

  console.log('📡 부산광역시 축제 API 데이터를 요청 중입니다...');
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // API 응답 객체에서 축제 데이터 추출 (유연한 구조 대응)
    const items = data?.getFestivalKr?.item || 
                  data?.getFestivalKr?.body?.items?.item || 
                  data?.getFestivalKr?.body?.items || 
                  [];
                  
    if (!Array.isArray(items) && typeof items === 'object') {
      return [items]; // 데이터가 단 한 개만 있어 객체 형태로 제공되는 경우 배열로 전환
    }
    
    return items;
  } catch (error) {
    console.error('❌ 부산 API 호출 중 오류가 발생했습니다:', error);
    return [];
  }
}

// 6. 데이터 매핑 및 Firestore 저장 컨트롤러
async function syncEvents() {
  const rawItems = await fetchBusanFestivals();
  
  if (rawItems.length === 0) {
    console.log('ℹ️ 불러온 데이터가 없거나 에러로 인해 처리를 중단합니다.');
    return;
  }

  console.log(`✨ 총 ${rawItems.length}개의 축제 데이터를 성공적으로 가져왔습니다.`);
  console.log('🔄 데이터를 캘린더 앱 규격으로 파싱 및 Firestore에 동기화 작업을 시작합니다...\n');

  let successCount = 0;

  for (const item of rawItems) {
    // 필수 필드 체크
    if (!item.MAIN_TITLE) continue;

    // A. [제목, 일자, 장소, 카테고리] 및 필수 변수 파싱/변환 로직
    const title = item.MAIN_TITLE; // 1. 제목
    const { start, end } = extractStartAndEndDates(item); // 2. 일자 (FullCalendar 대응)
    const location = item.PLACE || item.ADDR1 || '부산광역시'; // 3. 장소
    const category = determineCategory(item.MAIN_TITLE, item.ITEMCNTNTS); // 4. 카테고리

    // 추가 메타데이터
    const description = item.ITEMCNTNTS || item.SUBTITLE || '';
    const organizer = item.GUGUN_NM ? `${item.GUGUN_NM}청` : '부산광역시';
    const imageUrl = item.MAIN_IMG_NORMAL || '';
    
    // 맵 핀 시뮬레이션용 좌표 (부산 전역 배치용 랜덤 퍼센트)
    const mapTop = `${Math.floor(Math.random() * 45) + 30}%`;
    const mapLeft = `${Math.floor(Math.random() * 50) + 25}%`;

    // 캘린더 앱 Firebase Firestore 컬렉션 스키마 규격으로 매핑
    const mappedEvent = {
      title,
      start,
      end,
      location,
      category,
      description,
      organizer,
      imageUrl,
      mapTop,
      mapLeft,
      updatedAt: new Date().toISOString(),
      source: 'Busan_OpenAPI'
    };

    // B. Firestore 업로드 (UC_SEQ 고유 식별자를 문서 ID로 설정해 중복 방지 및 멱등성 유지)
    const documentId = `busan_${item.UC_SEQ || Math.random().toString(36).substr(2, 9)}`;
    const eventDocRef = doc(db, 'events', documentId);

    try {
      await setDoc(eventDocRef, mappedEvent, { merge: true });
      console.log(`✅ 저장 완료: [${category}] ${title} (${start.split('T')[0]} @ ${location})`);
      successCount++;
    } catch (dbError) {
      console.error(`❌ Firestore 저장 실패 [${title}]:`, dbError.message);
    }
  }

  console.log(`\n🎉 동기화 완료! 총 ${successCount}개의 행사가 Firestore에 업로드 되었습니다.`);
  process.exit(0);
}

// 동기화 컨트롤러 실행
syncEvents();
