// ===========================================
// Файл: src/lib/dialogue-assets.ts
// Путь:  linguamethod-admin/src/lib/dialogue-assets.ts
//
// Описание:
//   Аватарки участников и фоны ситуаций для диалогов.
//   Аватарки: emoji-символы, сгруппированные по категориям.
//   Фоны: градиенты + emoji-иконка для визуального контекста.
//   Используется в block-form.tsx (конструктор) и
//   preview-textbook.tsx (просмотр диалога).
// ===========================================

// ===== АВАТАРКИ УЧАСТНИКОВ =====

export interface AvatarOption {
  id: string;       // Уникальный ключ (напр. "man_adult")
  emoji: string;    // Emoji-символ
  label: string;    // Описание
  category: string; // Категория для группировки
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // Люди — основные
  { id: "man", emoji: "👨", label: "Man", category: "People" },
  { id: "woman", emoji: "👩", label: "Woman", category: "People" },
  { id: "boy", emoji: "👦", label: "Boy", category: "People" },
  { id: "girl", emoji: "👧", label: "Girl", category: "People" },
  { id: "elder_man", emoji: "👴", label: "Elderly man", category: "People" },
  { id: "elder_woman", emoji: "👵", label: "Elderly woman", category: "People" },
  { id: "baby", emoji: "👶", label: "Baby", category: "People" },

  // Профессии
  { id: "teacher_m", emoji: "👨‍🏫", label: "Male teacher", category: "Professions" },
  { id: "teacher_f", emoji: "👩‍🏫", label: "Female teacher", category: "Professions" },
  { id: "student_m", emoji: "👨‍🎓", label: "Male student", category: "Professions" },
  { id: "student_f", emoji: "👩‍🎓", label: "Female student", category: "Professions" },
  { id: "cook_m", emoji: "👨‍🍳", label: "Male chef", category: "Professions" },
  { id: "cook_f", emoji: "👩‍🍳", label: "Female chef", category: "Professions" },
  { id: "doctor_m", emoji: "👨‍⚕️", label: "Male doctor", category: "Professions" },
  { id: "doctor_f", emoji: "👩‍⚕️", label: "Female doctor", category: "Professions" },
  { id: "office_m", emoji: "👨‍💼", label: "Businessman", category: "Professions" },
  { id: "office_f", emoji: "👩‍💼", label: "Businesswoman", category: "Professions" },
  { id: "worker_m", emoji: "👷", label: "Worker", category: "Professions" },
  { id: "artist_f", emoji: "👩‍🎨", label: "Artist", category: "Professions" },
  { id: "pilot_m", emoji: "👨‍✈️", label: "Pilot", category: "Professions" },
  { id: "farmer_m", emoji: "👨‍🌾", label: "Farmer", category: "Professions" },
  { id: "scientist_f", emoji: "👩‍🔬", label: "Scientist", category: "Professions" },
  { id: "tech_m", emoji: "👨‍💻", label: "Programmer", category: "Professions" },

  // Китайские/азиатские персонажи
  { id: "cn_man", emoji: "🧑‍🦱", label: "Young person", category: "Styles" },
  { id: "cn_guard", emoji: "💂", label: "Guard", category: "Styles" },
  { id: "cn_person", emoji: "🧑", label: "Person", category: "Styles" },
  { id: "ninja", emoji: "🥷", label: "Ninja", category: "Styles" },
  { id: "prince", emoji: "🤴", label: "Prince", category: "Styles" },
  { id: "princess", emoji: "👸", label: "Princess", category: "Styles" },
  { id: "superhero_m", emoji: "🦸", label: "Superhero", category: "Styles" },
];

// Словарь для быстрого доступа по id
export const AVATAR_MAP: Record<string, AvatarOption> = {};
AVATAR_OPTIONS.forEach((a) => { AVATAR_MAP[a.id] = a; });

// Группировка по категориям
export const AVATAR_CATEGORIES = ["People", "Professions", "Styles"];

// ===== ФОНЫ СИТУАЦИЙ =====

export interface SceneOption {
  id: string;       // Уникальный ключ
  emoji: string;    // Иконка сцены
  label: string;    // Название
  gradient: string; // CSS gradient для фона в превью
}

export const SCENE_OPTIONS: SceneOption[] = [
  { id: "none", emoji: "💬", label: "No background", gradient: "" },
  { id: "restaurant", emoji: "🍜", label: "Restaurant", gradient: "from-[oklch(0.96_0.03_30)] to-[oklch(0.93_0.02_20)]" },
  { id: "school", emoji: "🏫", label: "School", gradient: "from-[oklch(0.96_0.03_250)] to-[oklch(0.93_0.02_240)]" },
  { id: "shop", emoji: "🛒", label: "Shop", gradient: "from-[oklch(0.96_0.025_140)] to-[oklch(0.93_0.02_150)]" },
  { id: "home", emoji: "🏠", label: "Home", gradient: "from-[oklch(0.96_0.02_60)] to-[oklch(0.93_0.015_50)]" },
  { id: "park", emoji: "🌳", label: "Park", gradient: "from-[oklch(0.96_0.035_145)] to-[oklch(0.93_0.025_135)]" },
  { id: "office", emoji: "🏢", label: "Office", gradient: "from-[oklch(0.96_0.015_250)] to-[oklch(0.93_0.01_260)]" },
  { id: "airport", emoji: "✈️", label: "Airport", gradient: "from-[oklch(0.96_0.02_220)] to-[oklch(0.93_0.015_230)]" },
  { id: "hospital", emoji: "🏥", label: "Hospital", gradient: "from-[oklch(0.96_0.02_190)] to-[oklch(0.93_0.015_200)]" },
  { id: "market", emoji: "🏪", label: "Market", gradient: "from-[oklch(0.96_0.03_50)] to-[oklch(0.93_0.025_40)]" },
  { id: "transport", emoji: "🚌", label: "Transport", gradient: "from-[oklch(0.96_0.025_270)] to-[oklch(0.93_0.02_280)]" },
  { id: "hotel", emoji: "🏨", label: "Hotel", gradient: "from-[oklch(0.96_0.02_300)] to-[oklch(0.93_0.015_310)]" },
  { id: "cafe", emoji: "☕", label: "Cafe", gradient: "from-[oklch(0.96_0.03_45)] to-[oklch(0.93_0.02_35)]" },
  { id: "bank", emoji: "🏦", label: "Bank", gradient: "from-[oklch(0.96_0.015_260)] to-[oklch(0.93_0.01_270)]" },
  { id: "gym", emoji: "🏋️", label: "Gym", gradient: "from-[oklch(0.96_0.025_25)] to-[oklch(0.93_0.02_15)]" },
  { id: "cinema", emoji: "🎬", label: "Cinema", gradient: "from-[oklch(0.95_0.02_320)] to-[oklch(0.92_0.015_330)]" },
];

// Словарь для быстрого доступа по id
export const SCENE_MAP: Record<string, SceneOption> = {};
SCENE_OPTIONS.forEach((s) => { SCENE_MAP[s.id] = s; });
