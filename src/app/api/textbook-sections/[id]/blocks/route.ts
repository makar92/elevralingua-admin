// ===========================================
// Файл: src/app/api/textbook-sections/[id]/blocks/route.ts
// Описание: GET — список блоков секции учебника. POST — создать блок.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const blocks = await prisma.contentBlock.findMany({
      where: { textbookSectionId: id },
      orderBy: { order: "asc" },
      include: { teacherNote: true },
    });
    return apiSuccess(blocks);
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id: textbookSectionId } = await params;
    const { type, contentJson, insertAfterOrder } = await request.json();

    if (!type || !contentJson) return apiError("Block type and content are required");

    let newOrder: number;

    if (insertAfterOrder === -1) {
      await prisma.contentBlock.updateMany({
        where: { textbookSectionId },
        data: { order: { increment: 1 } },
      });
      newOrder = 0;
    } else if (insertAfterOrder !== undefined && insertAfterOrder !== null) {
      await prisma.contentBlock.updateMany({
        where: { textbookSectionId, order: { gt: insertAfterOrder } },
        data: { order: { increment: 1 } },
      });
      newOrder = insertAfterOrder + 1;
    } else {
      const last = await prisma.contentBlock.findFirst({
        where: { textbookSectionId },
        orderBy: { order: "desc" },
      });
      newOrder = (last?.order ?? -1) + 1;
    }

    const block = await prisma.contentBlock.create({
      data: { textbookSectionId, type, order: newOrder, contentJson },
      include: { teacherNote: true },
    });

    return apiSuccess(block, 201);
  });
}
