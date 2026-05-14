// ===========================================
// Файл: src/components/shared/audio-indicator.tsx
// Описание:
//   Переиспользуемая иконка-индикатор аудио в правом верхнем углу карточки/реплики.
//   Три состояния:
//   - не играет: показывает динамик (voice icon).
//   - загрузка: показывает крутящийся спиннер (аудиофайл качается).
//   - играет: показывает квадрат (stop icon) + активный фон.
//   При клике во время play — вызывает onStop (останавливает воспроизведение).
//   Во время загрузки клик игнорируется (ждём пока начнётся звук).
//   Клик по самому элементу-носителю (родительской карточке) должен
//   обрабатываться родителем — например, запуск/перезапуск.
// ===========================================

"use client";

import React from "react";

interface AudioIndicatorProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onStop: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function AudioIndicator({ isPlaying, isLoading = false, onStop, size = "md", className = "" }: AudioIndicatorProps) {
  const dims = size === "sm" ? { box: "w-5 h-5", icon: 10 } : { box: "w-6 h-6", icon: 12 };

  const handleClick = (e: React.MouseEvent) => {
    // Останавливаем всплытие, чтобы клик по иконке не тригернул onClick родителя
    // (родитель обычно делает "запуск/перезапуск" на всю карточку).
    e.stopPropagation();
    e.preventDefault();
    // Во время загрузки клик ничего не делает — ждём начала воспроизведения.
    if (isLoading) return;
    if (isPlaying) onStop();
  };

  // Активное состояние (заполненный фон) — и при загрузке, и при игре
  const active = isPlaying || isLoading;

  return (
    <span
      onClick={handleClick}
      role={isPlaying ? "button" : undefined}
      aria-label={isLoading ? "Loading audio" : isPlaying ? "Stop audio" : "Has audio"}
      title={isLoading ? "Loading…" : isPlaying ? "Stop" : "Click card to play"}
      className={`absolute top-2 right-2 ${dims.box} rounded-full flex items-center justify-center transition-colors ${
        active
          ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80"
          : "bg-white/70 text-primary border-2 border-primary"
      } ${className}`}
    >
      {isLoading ? (
        // Спиннер загрузки
        <svg
          width={dims.icon}
          height={dims.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : isPlaying ? (
        // Квадрат (stop)
        <svg
          width={dims.icon}
          height={dims.icon}
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        >
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
        </svg>
      ) : (
        // Динамик (speaker)
        <svg
          width={dims.icon}
          height={dims.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </span>
  );
}
