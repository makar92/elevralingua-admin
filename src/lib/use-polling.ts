// ===========================================
// Файл: src/lib/use-polling.ts
// Описание: Универсальный хук для реалтайм-поллинга API.
//   Заменяет паттерн "useState + useEffect + fetch" на одну строку.
//   Под капотом React Query: автоматический refetch по интервалу,
//   на возврат фокуса вкладки, при восстановлении сети.
//
//   Использование:
//     const { data, isLoading, refetch } = usePolling<MyType[]>("/api/foo");
//     const { data } = usePolling("/api/bar", { interval: 2000 });
//     const { data } = usePolling(id ? `/api/baz/${id}` : null); // null = выкл
// ===========================================

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface UsePollingOptions {
  /** Интервал поллинга в мс. По умолчанию 4000. */
  interval?: number | false;
  /** Запасное значение, пока данные не загрузились. По умолчанию undefined. */
  fallback?: any;
  /** Доп. ключ для разделения кэша (если URL одинаковый, а контекст разный). */
  extraKey?: any;
  /** Передаваемые параметры fetch (headers, и т.п.). */
  fetchOptions?: RequestInit;
}

async function defaultFetcher(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Auth error: ${res.status}`);
    }
    throw new Error(`Fetch failed: ${res.status}`);
  }
  // Если API вернул не JSON — не падаем
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return res.json();
}

/**
 * Поллит API endpoint с заданным интервалом.
 * Если url = null/undefined/"" — запрос отключён.
 */
export function usePolling<T = any>(
  url: string | null | undefined,
  opts: UsePollingOptions = {}
) {
  const { interval = 4000, fallback, extraKey, fetchOptions } = opts;

  const enabled = !!url;

  const query = useQuery<T>({
    queryKey: extraKey !== undefined ? [url, extraKey] : [url],
    queryFn: () => defaultFetcher(url as string, fetchOptions),
    enabled,
    refetchInterval: enabled ? interval : false,
  });

  return {
    data: (query.data ?? fallback) as T,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Хук для инвалидации запросов после мутаций (создание/изменение).
 * Используется в обработчиках кнопок учителя, чтобы сразу же
 * обновить данные локально, не дожидаясь следующего тика поллинга.
 *
 *   const invalidate = useInvalidate();
 *   ...
 *   await fetch("/api/schedule", { method: "POST", body: ... });
 *   invalidate(); // обновит ВСЕ активные запросы
 *   // или invalidate("/api/schedule"); — только конкретный
 */
export function useInvalidate() {
  const qc = useQueryClient();
  return useCallback(
    (urlPrefix?: string) => {
      if (!urlPrefix) {
        qc.invalidateQueries();
        return;
      }
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0];
          return typeof key === "string" && key.startsWith(urlPrefix);
        },
      });
    },
    [qc]
  );
}
