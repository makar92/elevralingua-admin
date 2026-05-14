// ===========================================
// Файл: src/lib/audio-store.ts
// Описание:
//   Глобальный audio-плеер приложения (Zustand store).
//   В приложении в каждый момент времени играет максимум один аудиотрек.
//   Любой компонент, который хочет воспроизвести звук, вызывает play(url, id).
//   Любой предыдущий трек автоматически останавливается.
//   Компонент узнаёт, играет ли именно его аудио, через селектор currentId + isPlaying.
//
//   Состояния:
//   - isLoading: true с момента клика до реального начала воспроизведения
//     (аудиофайл ещё качается). В это время UI показывает спиннер.
//   - isPlaying: true когда аудио реально звучит.
//
//   Вся работа с HTMLAudioElement инкапсулирована внутри store — компоненты
//   не знают про new Audio(), .play(), .pause() и т.д.
// ===========================================

import { create } from "zustand";

// Внутренний Audio-элемент. Создаётся лениво при первом play.
// Живёт вне React, не пересоздаётся при StrictMode двойном монтировании.
let audioEl: HTMLAudioElement | null = null;

interface AudioState {
  // id источника, который сейчас активен (играет ИЛИ грузится), или null
  currentId: string | null;
  // url, который сейчас активен, или null
  currentUrl: string | null;
  // true, пока аудио действительно воспроизводится
  isPlaying: boolean;
  // true, пока аудио грузится (клик был, но звук ещё не пошёл)
  isLoading: boolean;

  // Запуск/перезапуск аудио. Если уже играло другое — останавливаем.
  // Если тот же id с тем же url — тоже перезапускаем с начала.
  play: (url: string, id: string) => void;
  // Полная остановка всего воспроизведения.
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentId: null,
  currentUrl: null,
  isPlaying: false,
  isLoading: false,

  play: (url, id) => {
    if (!url) return;

    // Останавливаем предыдущий, если был
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      // Очищаем старые обработчики, чтобы не срабатывали на новом треке
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.onplaying = null;
      audioEl.onwaiting = null;
    }

    // Создаём новый Audio-элемент на каждый play
    // (проще, чем переиспользовать один — избегаем гонок состояний при быстром переключении)
    audioEl = new Audio(url);

    audioEl.onended = () => {
      // После завершения — сбрасываем store
      set({ currentId: null, currentUrl: null, isPlaying: false, isLoading: false });
      audioEl = null;
    };

    audioEl.onerror = () => {
      // Ошибка загрузки/воспроизведения — сбрасываем состояние
      set({ currentId: null, currentUrl: null, isPlaying: false, isLoading: false });
      audioEl = null;
    };

    // Реальное начало воспроизведения — звук пошёл.
    // Снимаем флаг загрузки, ставим isPlaying.
    audioEl.onplaying = () => {
      // Срабатывает только если этот трек всё ещё актуален
      if (get().currentId === id) {
        set({ isPlaying: true, isLoading: false });
      }
    };

    // Буферизация во время воспроизведения (звук прервался на догрузку) —
    // снова показываем загрузку.
    audioEl.onwaiting = () => {
      if (get().currentId === id) {
        set({ isLoading: true });
      }
    };

    // Стартовое состояние: загрузка началась, звука ещё нет.
    set({ currentId: id, currentUrl: url, isPlaying: false, isLoading: true });

    audioEl.play().catch(() => {
      // Браузер мог заблокировать play (autoplay policy) — сбрасываем state
      set({ currentId: null, currentUrl: null, isPlaying: false, isLoading: false });
      audioEl = null;
    });
  },

  stop: () => {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.onplaying = null;
      audioEl.onwaiting = null;
      audioEl = null;
    }
    set({ currentId: null, currentUrl: null, isPlaying: false, isLoading: false });
  },
}));
