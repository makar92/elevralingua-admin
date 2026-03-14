// ===========================================
// Файл: src/app/api/sections/[id]/blocks/route.ts
// Описание: GET — список блоков раздела. POST — создать блок.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// GET — все блоки раздела, отсортированные по order
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    const blocks = await prisma.contentBlock.findMany({
      where: { sectionId: id },
      orderBy: { order: "asc" },
      include: { teacherNote: true },
    });
    return apiSuccess(blocks);
  });
}

// POST — создать новый блок
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id: sectionId } = await params;
    const { type, contentJson, insertAfterOrder } = await request.json();

    if (!type || !contentJson) return apiError("Укажите тип и содержимое блока");

    let newOrder: number;

    if (insertAfterOrder !== undefined && insertAfterOrder !== null) {
      // Вставка между блоками: сдвигаем все блоки после insertAfterOrder
      await prisma.contentBlock.updateMany({
        where: { sectionId, order: { gt: insertAfterOrder } },
        data: { order: { increment: 1 } },
      });
      newOrder = insertAfterOrder + 1;
    } else {
      // Вставка в конец
      const last = await prisma.contentBlock.findFirst({
        where: { sectionId },
        orderBy: { order: "desc" },
      });
      newOrder = (last?.order ?? -1) + 1;
    }

    const block = await prisma.contentBlock.create({
      data: { sectionId, type, order: newOrder, contentJson },
      include: { teacherNote: true },
    });

    return apiSuccess(block, 201);
  });
}
