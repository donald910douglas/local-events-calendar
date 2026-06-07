import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured } from './lib/firebase';
import { subscribeEvents, addOrUpdateEvent, deleteEventFromFirestore } from './lib/firebaseService';
import DashboardLayout from './components/DashboardLayout';
import CalendarView from './components/CalendarView';
import CategoryFilters, { CATEGORIES } from './components/CategoryFilters';
import EventModal from './components/EventModal';
import { Heart, Calendar, MapPin, Grid, Settings, Map, Compass } from 'lucide-react';

const initialEvents = [
  {
    id: '1',
    title: '서울 장미 축제 2026',
    category: 'festival',
    start: '2026-05-24T10:00:00',
    end: '2026-05-24T20:00:00',
    location: '중랑장미공원',
    description: '수천만 송이의 활짝 핀 장미 터널 아래서 펼쳐지는 감미로운 버스킹 공연, 거리 장미 퍼레이드, 로맨틱 재즈 콘서트 등 따스한 봄날을 수놓을 봄 대표 야외 축제입니다.',
    organizer: '중랑문화재단',
    mapTop: '32%',
    mapLeft: '28%'
  },
  {
    id: '2',
    title: 'React 19 & Vite 8 실무 세미나',
    category: 'seminar',
    start: '2026-05-26T14:00:00',
    end: '2026-05-26T17:00:00',
    location: '마루180 세미나룸 A',
    description: 'React 19 최신 훅 기능과 컴포넌트 렌더링 성능 최적화, Server Actions의 전반적인 아키텍처 실무 기법을 학습합니다. 아울러 Vite 8로의 마이그레이션 전략 및 번들 구성 기법을 함께 논의하는 개발자 네트워킹 세미나입니다.',
    organizer: '데브캠퍼스',
    mapTop: '62%',
    mapLeft: '58%'
  },
  {
    id: '3',
    title: '현대 미술 청년 작가 초대전',
    category: 'exhibition',
    start: '2026-05-25T10:00:00',
    end: '2026-05-28T18:00:00',
    location: '예술의전당 한가람미술관',
    description: '기존의 한계를 뛰어넘어 독창적인 시각 언어로 현실과 디지털 문화를 표현하는 대한민국 대표 신진 청년 작가 10인의 유화, 조형, 미디어 아트 기획 전시회입니다.',
    organizer: '한국문화예술교류협회',
    mapTop: '78%',
    mapLeft: '32%'
  },
  {
    id: '4',
    title: '선정릉역 주말 소소 플리마켓',
    category: 'flea_market',
    start: '2026-05-27T11:00:00',
    end: '2026-05-27T19:00:00',
    location: '선정릉역 3번 출구 앞 광장',
    description: '아기자기한 수공예 주얼리, 가죽 소품, 친환경 제로웨이스트 생필품 및 직접 구운 수제 디저트와 향긋한 더치커피 등 다양한 볼거리와 먹거리가 가득한 골목 활성화 플리마켓입니다.',
    organizer: '소소마켓 기획단',
    mapTop: '50%',
    mapLeft: '50%'
  },
  {
    id: '5',
    title: '송파구민 자전거 챌린지 대회',
    category: 'sports',
    start: '2026-05-28T09:00:00',
    end: '2026-05-28T13:00:00',
    location: '올림픽공원 평화의 광장',
    description: '안전한 자전거 타기 문화를 장려하고 지역민 건강 향상을 위해 마련된 비경쟁 자전거 챌린지입니다. 안전 장비를 착용한 구민 누구나 참여 가능하며, 코스 완주 시 기념 메달과 풍성한 선물이 제공됩니다.',
    organizer: '송파구 체육회',
    mapTop: '45%',
    mapLeft: '78%'
  }
];

function App() {
  // Theme and Tab states
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [activeTab, setActiveTab] = useState('calendar');
  function App() {
    // 1. [상태 선언부] (useState들 - 최상단)
    const [events, setEvents] = useState(initialEvents);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [description, setDescription] = useState('');
    // ... (다른 상태들)

    // 2. [데이터 로딩부] (useEffect들)
    useEffect(() => {
      // ... 데이터 불러오기 로직
    }, []);

    // 3. [기능 함수부] (handleSaveEvent, handleDeleteEvent 등)
    const handleSaveEvent = async (savedData) => { /* ... */ };
    const handleDeleteEvent = async (eventId) => { /* ... */ };

    // 4. [화면 렌더링부] (return 문)
    return (
      <div className="app-container">
        <DashboardLayout>
          {/* 여기서 컴포넌트들을 호출 */}
        </DashboardLayout>
      </div>
    );

  } // <--- App 컴포넌트 닫는 괄호
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(CATEGORIES.map(c => c.id));

  // Event data states (will sync with Firestore or localStorage fallback)
  const [events, setEvents] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState(() => {
    const saved = localStorage.getItem('saved_event_ids');
    return saved ? JSON.parse(saved) : ['1', '3'];
  });
  // 90번 줄 아래에 추가
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
    const [description, setDescription] = useState('');
  });

  const toggleFavorite = (eventId) => {
    setFavorites(prev => {
      const isFav = prev.includes(eventId);
      const next = isFav ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  };
  // Modal interactions states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Active hover point on simulated map
  const [hoveredEventId, setHoveredEventId] = useState(null);

  // Mock notifications list
  const [notifications, setNotifications] = useState([
    {
      title: '새로운 행사 등록 알림',
      message: '근처 중랑장미공원에서 "서울 장미 축제" 일정이 새로 추가되었습니다.',
      time: '5분 전'
    },
    {
      title: '일정 확인 안내',
      message: '내일 참여 예정인 "React 19 & Vite 8 실무 세미나" 상세 정보 및 장소를 확인하세요.',
      time: '2시간 전'
    }
  ]);

  // Handle Dark mode DOM changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Persist bookmark / saved event IDs
  useEffect(() => {
    localStorage.setItem('saved_event_ids', JSON.stringify(savedEventIds));
  }, [savedEventIds]);

  // Subscribe to Firebase real-time database OR load local fallback
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = subscribeEvents((firebaseEvents) => {
        if (firebaseEvents.length === 0) {
          console.log("Firestore is empty. Seeding initial events...");
          initialEvents.forEach(e => {
            addOrUpdateEvent(e).catch(err => console.error("Error seeding initial event:", err));
          });
        } else {
          setEvents(firebaseEvents);
        }
      });
      return () => unsubscribe();
    } else {
      // Local Storage Fallback Mode
      const localData = localStorage.getItem('local_events');
      if (localData) {
        setEvents(JSON.parse(localData));
      } else {
        setEvents(initialEvents);
        localStorage.setItem('local_events', JSON.stringify(initialEvents));
      }
    }
  }, []);

  // Handle new event addition or update
  const handleSaveEvent = async (savedData) => {
    if (isFirebaseConfigured) {
      try {
        await addOrUpdateEvent(savedData);
        // The real-time snapshot automatically synchronizes and updates the React state
      } catch (error) {
        console.error("Firestore save error:", error);
        alert("Firebase 일정 저장에 실패했습니다.");
      }
    } else {
      // Local Storage fallback mode
      let updatedEvents;
      if (events.some(e => e.id === savedData.id)) {
        // Edit mode
        updatedEvents = events.map(e => e.id === savedData.id ? {
          ...e,
          ...savedData
        } : e);
      } else {
        // Create mode
        const newEvent = {
          ...savedData,
          id: savedData.id || String(Date.now()),
          mapTop: `${Math.floor(Math.random() * 50) + 25}%`,
          mapLeft: `${Math.floor(Math.random() * 60) + 20}%`
        };
        updatedEvents = [...events, newEvent];
      }
      setEvents(updatedEvents);
      localStorage.setItem('local_events', JSON.stringify(updatedEvents));

      // Push local notification
      const newNotif = {
        title: '일정 저장 완료 (로컬)',
        message: `"${savedData.title}" 일정이 로컬 스토리지에 저장되었습니다.`,
        time: '방금 전'
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
    setIsModalOpen(false);
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    const deletedEvent = events.find(e => e.id === eventId);

    if (isFirebaseConfigured) {
      try {
        await deleteEventFromFirestore(eventId);
        // Real-time snapshot updates React state
      } catch (error) {
        console.error("Firestore delete error:", error);
        alert("Firebase 일정 삭제에 실패했습니다.");
      }
    } else {
      // Local Storage fallback mode
      const updatedEvents = events.filter(e => e.id !== eventId);
      setEvents(updatedEvents);
      localStorage.setItem('local_events', JSON.stringify(updatedEvents));
      setSavedEventIds(prev => prev.filter(id => id !== eventId));

      if (deletedEvent) {
        const newNotif = {
          title: '일정 삭제 완료 (로컬)',
          message: `"${deletedEvent.title}" 일정이 제거되었습니다.`,
          time: '방금 전'
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }
    setIsModalOpen(false);
  };

  // Toggle saved events (interest toggle)
  const toggleSaveEvent = (eventId) => {
    setSavedEventIds(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  // Trigger modal for creation
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  // Trigger modal for details / edit
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  // Render correct tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 space-y-4">
              <CategoryFilters
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                events={events}
              />
              <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 dark:from-violet-950/20 dark:to-fuchsia-950/20 border border-violet-500/15 dark:border-violet-400/10 rounded-2xl p-4 text-xs text-violet-700 dark:text-violet-300">
                <h4 className="font-bold flex items-center gap-1.5 mb-1 text-[13px]">
                  💡 캘린더 이용 안내
                </h4>
                <p className="leading-relaxed text-left">
                  달력 빈 공간을 클릭하면 해당 날짜에 새 이벤트를 추가할 수 있습니다. 이미 등록된 이벤트를 누르면 정보 확인 및 수정이 가능합니다.
                </p>
              </div>
            </div>
            <div className="lg:col-span-3">
              <CalendarView
                events={events}
                selectedCategories={selectedCategories}
                searchQuery={searchQuery}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        );

      case 'saved':
        const savedEvents = events.filter(e => savedEventIds.includes(e.id));
        return (
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                관심 등록 이벤트 목록
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">내가 관심 아이콘(하트)을 클릭하여 저장해 둔 지역 행사 모음입니다.</p>
            </div>

            {savedEvents.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                관심 등록된 행사가 없습니다. 일정 달력이나 상세 팝업에서 관심 일정을 등록해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {savedEvents.map(e => {
                  const cat = CATEGORIES.find(c => c.id === e.category);
                  return (
                    <div
                      key={e.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between h-[300px] group relative"
                    >
                      {/* Banner cover card if exists */}
                      <div className="h-28 bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                        {e.imageUrl ? (
                          <img src={e.imageUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-350 dark:text-zinc-600 bg-gradient-to-tr from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-850">
                            <Calendar className="w-8 h-8" />
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat?.bgClass} border`}>
                          {cat?.label}
                        </span>
                        <button
                          onClick={() => toggleSaveEvent(e.id)}
                          className="absolute top-3 right-3 text-rose-500 hover:text-rose-600 bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-1.5 rounded-full transition-colors shadow-sm"
                          aria-label="Remove from saved"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        </button>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3
                            onClick={() => handleEventClick(e)}
                            className="font-bold text-zinc-800 dark:text-zinc-100 text-sm truncate hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors"
                          >
                            {e.title}
                          </h3>
                          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {e.start.replace('T', ' ')}
                          </p>
                          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="truncate">{e.location}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleEventClick(e)}
                          className="w-full text-center py-2 mt-4 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-200/50 dark:border-zinc-800 transition-colors"
                        >
                          상세 정보 열기
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'map':
        // Filter map events according to category & search
        const visibleEvents = events.filter(e => {
          const matchesCategory = selectedCategories.includes(e.category);
          const matchesSearch = searchQuery.trim() === '' ||
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        });

        return (
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Map className="w-5 h-5 text-indigo-500" />
                로컬 행사 위치 지도
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                지역 내 등록된 행사 위치 분포를 시뮬레이션 지도로 직관적으로 확인하세요. 핀을 클릭하면 행사 상세 카드가 표시됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left events list list */}
              <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 max-h-[500px] overflow-y-auto space-y-2.5 text-left shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  행사 목록 ({visibleEvents.length})
                </h3>
                {visibleEvents.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">필터 조건에 부합하는 일정이 없습니다.</p>
                ) : (
                  visibleEvents.map(e => {
                    const cat = CATEGORIES.find(c => c.id === e.category);
                    const isHovered = hoveredEventId === e.id;
                    return (
                      <div
                        key={e.id}
                        onMouseEnter={() => setHoveredEventId(e.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={() => handleEventClick(e)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isHovered
                          ? 'bg-violet-50/70 dark:bg-violet-950/20 border-violet-500/40'
                          : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-850 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'
                          }`}
                      >
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${cat?.bgClass} border`}>
                          {cat?.label}
                        </span>
                        <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs mt-1.5 truncate">{e.title}</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span className="truncate">{e.location}</span>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right interactive simulated map container */}
              <div className="lg:col-span-3 relative h-[500px] bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-inner group">

                {/* Visual Map Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.22),rgba(0,0,0,0))]" />
                <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-[0.05]"
                  style={{ backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                {/* Abstract River / Road Graphics */}
                <div className="absolute top-1/2 left-0 right-0 h-10 bg-indigo-500/10 dark:bg-indigo-400/5 -rotate-6 blur-md pointer-events-none" />
                <div className="absolute top-[30%] bottom-0 left-[40%] w-8 bg-zinc-300/20 dark:bg-zinc-900/40 rotate-12 blur-[2px] pointer-events-none" />
                <div className="absolute bottom-[20%] right-[30%] w-[120px] h-[120px] rounded-full bg-emerald-500/10 dark:bg-emerald-400/5 blur-xl pointer-events-none" />

                {/* Compass HUD decoration */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-zinc-400/60 dark:text-zinc-500/60 text-[10px] font-bold tracking-widest bg-white/50 dark:bg-zinc-900/50 backdrop-blur border border-zinc-200/50 dark:border-zinc-800/80 px-2.5 py-1.5 rounded-xl">
                  <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>VIR-MAP HUD v1.0</span>
                </div>

                {/* Interactive markers */}
                {visibleEvents.map(e => {
                  const cat = CATEGORIES.find(c => c.id === e.category);
                  const isHovered = hoveredEventId === e.id;

                  return (
                    <div
                      key={e.id}
                      style={{ top: e.mapTop || '50%', left: e.mapLeft || '50%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                      onMouseEnter={() => setHoveredEventId(e.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    >
                      {/* Interactive Pin Marker */}
                      <button
                        onClick={() => handleEventClick(e)}
                        className={`flex items-center justify-center p-2 rounded-full shadow-lg border transition-all duration-300 relative ${isHovered
                          ? 'scale-125 bg-violet-600 border-white text-white z-20'
                          : `bg-white dark:bg-zinc-900 border-${cat?.color}-500 text-zinc-700 dark:text-zinc-200`
                          }`}
                        style={{
                          borderColor: !isHovered ? `var(--color-${cat?.color}-text)` : undefined
                        }}
                      >
                        <MapPin className={`w-4 h-4 ${isHovered ? 'animate-bounce text-white' : ''}`} style={{ color: !isHovered ? `var(--color-${cat?.color}-text)` : undefined }} />

                        {/* Radar Pulse Effect */}
                        <span className={`absolute -inset-1 rounded-full animate-ping opacity-25 pointer-events-none ${isHovered ? 'bg-violet-500' : `bg-${cat?.color}-500`}`} />
                      </button>

                      {/* Tooltip Card Overlay on Hover */}
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-xl z-35 transition-all duration-300 pointer-events-none text-left ${isHovered ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-2 scale-95'
                        }`}>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-zinc-900" />
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold ${cat?.bgClass}`}>
                          {cat?.label}
                        </span>
                        <h5 className="font-bold text-zinc-800 dark:text-zinc-200 text-xs mt-1 truncate">{e.title}</h5>

                        {/* Banner preview in tooltips */}
                        {e.imageUrl && (
                          <div className="h-16 w-full rounded-lg overflow-hidden my-1.5">
                            <img src={e.imageUrl} alt={e.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate">{e.location}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Grid className="w-5 h-5 text-violet-500" />
                카테고리 탐색
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">등록된 지역 이벤트를 분야별로 정리하여 보여드립니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {CATEGORIES.map(cat => {
                const count = events.filter(e => e.category === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.bgClass} border`}>
                          {cat.label}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">행사 {count}개</span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                        {cat.id === 'festival' ? '지역 축제, 버스킹, 마술쇼, 푸드 트럭 벼룩행사 등 다채로운 지역 문화 예술 이벤트들을 소개합니다.' :
                          cat.id === 'seminar' ? '개발자 컨퍼런스, 마케터 워크숍, 창업 포럼 등 직무 관련 알찬 실무 교육 정보를 제공합니다.' :
                            cat.id === 'exhibition' ? '사진 기획전, 도서전, 일러스트 전시회 등 실내에서 즐길 수 있는 특별 기획 아트 갤러리 행사입니다.' :
                              cat.id === 'flea_market' ? '개인 창작자들의 수공예 소품 및 이색 빈티지 의류, 홈메이드 디저트를 직접 둘러보는 나눔 플리마켓입니다.' :
                                '건강한 러닝 크루, 주말 등산, 도심 속 자전거 챌린지 등 동네 주민들과 함께 활력을 얻는 스포츠 밋업 코너입니다.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategories([cat.id]);
                        setActiveTab('calendar');
                      }}
                      className="mt-6 w-full text-center py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-600/10 transition-colors"
                    >
                      이 카테고리만 달력에서 보기
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 max-w-2xl text-left">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Settings className="w-5 h-5 text-zinc-500" />
                설정
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">캘린더 및 테마 환경 설정을 관리합니다.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-sm">

              {/* Screen mode set */}
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">다크 모드 활성화</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">시스템을 다크 테마로 강제 적용합니다.</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${darkMode ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-850'
                    }`}
                  aria-label="Toggle dark mode"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
              </div>

              {/* Lang setup */}
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">기본 언어 설정</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">달력 날짜 포맷 및 주말 노출 언어 형식입니다.</p>
                </div>
                <select className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="ko">한국어 (Korean)</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Data Reset */}
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">로컬 데이터 전체 초기화</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">등록된 모든 일정과 관심 상태를 초기 샘플 구성으로 되돌립니다.</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('모든 사용자 등록 데이터 및 설정을 리셋하시겠습니까?')) {
                      if (isFirebaseConfigured) {
                        alert('Firebase 모드가 활성화되어 있어 자동 초기화가 불가능합니다. Firestore 콘솔에서 수동 삭제해 주세요.');
                      } else {
                        setEvents(initialEvents);
                        setSavedEventIds(['1', '3']);
                        setSelectedCategories(CATEGORIES.map(c => c.id));
                        setSearchQuery('');
                        localStorage.setItem('local_events', JSON.stringify(initialEvents));
                        alert('로컬 저장소가 초기 설정으로 복원되었습니다.');
                      }
                    }
                  }}
                  className="px-4 py-2 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all"
                >
                  기본값 복원
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  // 찜한 이벤트 필터링 로직
  const favoriteEvents = events.filter(event => favorites.includes(event.id));
  return (
    <>
      <DashboardLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddEventClick={() => {
          setSelectedEvent(null);
          setSelectedDate(null);
          setIsModalOpen(true);
        }}
        notifications={notifications}
      >
        {renderContent(favoriteEvents)}
      </DashboardLayout>

      {/* Shared Event Detail / Add / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        description={typeof description !== 'undefined' ? description : ''}
        setDescription={typeof setDescription !== 'undefined' ? setDescription : () => { }}
        isFavorite={favorites?.includes(selectedEvent?.id)}
        toggleFavorite={() => toggleFavorite(selectedEvent?.id)}
      />
    </>
  );
}

export default App;
