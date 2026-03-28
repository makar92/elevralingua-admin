// ===========================================
// Файл: src/app/api/sections/[id]/reorder/route.ts
// Описание: POST — переместить блок вверх/вниз.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// POST { blockId, direction: "up" | "down" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id: sectionId } = await params;
    const { blockId, direction } = await request.json();

    // Получаем все блоки sections отсортированные
    const blocks = await prisma.contentBlock.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });

    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return apiError("Block not found");

    // Проверяем можно ли двигать
    if (direction === "up" && idx === 0) return apiError("Already at the top");
    if (direction === "down" && idx === blocks.length - 1) return apiError("Already at the bottom");

    // Меняем местами с соседним
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const currentBlock = blocks[idx];
    const swapBlock = blocks[swapIdx];

    // Обновляем order у обоих блоков
    await prisma.$transaction([
      prisma.contentBlock.update({
        where: { id: currentBlock.id },
        data: { order: swapBlock.order },
      }),
      prisma.contentBlock.update({
        where: { id: swapBlock.id },
        data: { order: currentBlock.order },
      }),
    ]);

    return apiSuccess({ success: true });
  });
}
