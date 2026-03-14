// ===========================================
// Файл: src/components/audio-player.tsx
// Путь:  linguamethod-admin/src/components/audio-player.tsx
//
// Описание:
//   Кастомный аудио-плеер. Только play/pause + прогресс.
//   Нет кнопки скачивания, нет изменения скорости.
// ===========================================

"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  src: string;
  title?: string;
}

export function AudioPlayer({ src, title }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Обновляем прогресс при воспроизведении
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { setPlaying(false); setProgress(0); };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  // Play / Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
    setPlaying(!playing);
  };

  // Клик по прогресс-бару — перемотка
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * duration;
  };

  // Форматирование времени mm:ss
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-3">
      {/* Скрытый audio элемент */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Кнопка play/pause */}
      <button onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0">
        {playing ? (
          <span className="text-lg font-bold">II</span>
        ) : (
          <span className="text-lg ml-0.5">&#9654;</span>
        )}
      </button>

      {/* Название */}
      {title && <span className="text-sm text-foreground font-medium min-w-0 truncate">{title}</span>}

      {/* Прогресс-бар */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-muted-foreground min-w-[36px]">{fmt(currentTime)}</span>
        <div className="flex-1 h-2 bg-border rounded-full cursor-pointer" onClick={seek}>
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-muted-foreground min-w-[36px]">{fmt(duration)}</span>
      </div>
    </div>
  );
}
