// ===========================================
// Файл: src/lib/dialogue-assets.ts
// Путь:  elevralingua-admin/src/lib/dialogue-assets.ts
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
  { id: "restaurant", emoji: "🍜", label: "Restaurant", gradient: "from-[#fce8e0] to-[#f0d5cd]" },
  { id: "school", emoji: "🏫", label: "School", gradient: "from-[#e0e4fc] to-[#cdd4f0]" },
  { id: "shop", emoji: "🛒", label: "Shop", gradient: "from-[#e0f5e4] to-[#cde8d4]" },
  { id: "home", emoji: "🏠", label: "Home", gradient: "from-[#f5f0e0] to-[#e8e0cd]" },
  { id: "park", emoji: "🌳", label: "Park", gradient: "from-[#ddf7e2] to-[#c8ebd0]" },
  { id: "office", emoji: "🏢", label: "Office", gradient: "from-[#e4e6f5] to-[#d4d6e8]" },
  { id: "airport", emoji: "✈️", label: "Airport", gradient: "from-[#e0eef5] to-[#cddfe8]" },
  { id: "hospital", emoji: "🏥", label: "Hospital", gradient: "from-[#e0f2f0] to-[#cde5e3]" },
  { id: "market", emoji: "🏪", label: "Market", gradient: "from-[#fcf0e0] to-[#f0dfc8]" },
  { id: "transport", emoji: "🚌", label: "Transport", gradient: "from-[#e2e0fc] to-[#d0cef0]" },
  { id: "hotel", emoji: "🏨", label: "Hotel", gradient: "from-[#f0e4f5] to-[#e3d5e8]" },
  { id: "cafe", emoji: "☕", label: "Cafe", gradient: "from-[#fceee0] to-[#f0dbc8]" },
  { id: "bank", emoji: "🏦", label: "Bank", gradient: "from-[#e4e4f5] to-[#d4d4e8]" },
  { id: "gym", emoji: "🏋️", label: "Gym", gradient: "from-[#fce6e0] to-[#f0d2c8]" },
  { id: "cinema", emoji: "🎬", label: "Cinema", gradient: "from-[#ede0f0] to-[#e0d0e3]" },
];

// Словарь для быстрого доступа по id
export const SCENE_MAP: Record<string, SceneOption> = {};
SCENE_OPTIONS.forEach((s) => { SCENE_MAP[s.id] = s; });
