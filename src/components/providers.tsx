// ===========================================
// Файл: src/components/providers.tsx
// Описание: Клиентские провайдеры (SessionProvider + React Query).
//   React Query используется для реалтайм-поллинга данных между
//   учителем и учеником без необходимости обновлять страницу.
// ===========================================

"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Каждые 4 секунды проверяем обновления в фоне.
            // Этого достаточно для UX "почти реалтайма" и не убивает Neon.
            refetchInterval: 4000,
            // Когда юзер возвращается во вкладку — сразу актуализируем
            refetchOnWindowFocus: true,
            // При восстановлении сети — рефетч
            refetchOnReconnect: true,
            // Не рефетчим при каждом маунте — у нас есть интервал
            refetchOnMount: false,
            // Данные считаются "устаревшими" сразу — мы хотим свежее
            staleTime: 0,
            // Кэш живёт 5 минут после размонтирования
            gcTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
