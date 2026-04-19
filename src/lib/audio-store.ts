// ===========================================
// Файл: src/lib/audio-store.ts
// Описание:
//   Глобальный audio-плеер приложения (Zustand store).
//   В приложении в каждый момент времени играет максимум один аудиотрек.
//   Любой компонент, который хочет воспроизвести звук, вызывает play(url, id).
//   Любой предыдущий трек автоматически останавливается.
//   Компонент узнаёт, играет ли именно его аудио, через селектор currentId + isPlaying.
//
//   Вся работа с HTMLAudioElement инкапсулирована внутри store — компоненты
//   не знают про new Audio(), .play(), .pause() и т.д.
// ===========================================

import { create } from "zustand";

// Внутренний Audio-элемент. Создаётся лениво при первом play.
// Живёт вне React, не пересоздаётся при StrictMode двойном монтировании.
let audioEl: HTMLAudioElement | null = null;

interface AudioState {
  // id источника, который сейчас играет (или null)
  currentId: string | null;
  // url, который сейчас играет (или null) — пригодится, если нужно будет показать где-то "сейчас играет X"
  currentUrl: string | null;
  // true, пока аудио действительно воспроизводится
  isPlaying: boolean;

  // Запуск/перезапуск аудио. Если уже играло другое — останавливаем.
  // Если тот же id с тем же url — тоже перезапускаем с начала (поведение "кликнул ещё раз — сначала").
  play: (url: string, id: string) => void;
  // Полная остановка всего воспроизведения.
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentId: null,
  currentUrl: null,
  isPlaying: false,

  play: (url, id) => {
    if (!url) return;

    // Останавливаем предыдущий, если был
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      // Очищаем старые обработчики, чтобы не срабатывали на новом треке
      audioEl.onended = null;
      audioEl.onerror = null;
    }

    // Создаём новый Audio-элемент на каждый play
    // (проще, чем переиспользовать один — избегаем гонок состояний при быстром переключении)
    audioEl = new Audio(url);

    audioEl.onended = () => {
      // После завершения — сбрасываем store
      set({ currentId: null, currentUrl: null, isPlaying: false });
      audioEl = null;
    };

    audioEl.onerror = () => {
      // Ошибка загрузки/воспроизведения — сбрасываем состояние
      set({ currentId: null, currentUrl: null, isPlaying: false });
      audioEl = null;
    };

    set({ currentId: id, currentUrl: url, isPlaying: true });
    audioEl.play().catch(() => {
      // Браузер мог заблокировать play (autoplay policy) — сбрасываем state
      set({ currentId: null, currentUrl: null, isPlaying: false });
      audioEl = null;
    });
  },

  stop: () => {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl = null;
    }
    set({ currentId: null, currentUrl: null, isPlaying: false });
  },
}));
