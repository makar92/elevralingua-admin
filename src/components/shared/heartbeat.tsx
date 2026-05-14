// ===========================================
// Файл: src/components/shared/heartbeat.tsx
// Описание:
//   Невидимый компонент, который "стучится" на /api/users/heartbeat
//   каждые 30 сек пока вкладка открыта и видима.
//   Когда вкладка скрыта — не стучится (экономим запросы).
//   Когда вкладка снова видима — сразу стук + дальше по таймеру.
//
//   Подключается один раз в layout'ах учителя и ученика.
// ===========================================

"use client";

import { useEffect } from "react";

const PING_INTERVAL_MS = 30_000; // 30 секунд

export function Heartbeat() {
  useEffect(() => {
    let stopped = false;

    const ping = async () => {
      // Не стучимся если вкладка скрыта — пользователь не активен
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        await fetch("/api/users/heartbeat", { method: "POST", keepalive: true });
      } catch {
        // Сетевые ошибки игнорируем — следующий тик повторит
      }
    };

    // Первый стук сразу при монтировании
    ping();

    const interval = setInterval(() => {
      if (!stopped) ping();
    }, PING_INTERVAL_MS);

    // При возврате во вкладку — мгновенный стук, чтобы статус обновился сразу
    const onVisibilityChange = () => {
      if (!document.hidden) ping();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
