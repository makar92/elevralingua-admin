// ===========================================
// Файл: src/app/api/blocks/[id]/route.ts
// Описание: PATCH — обновить блок. DELETE — удалить блок.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// PATCH — обновить содержимое блока
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    const body = await request.json();

    const block = await prisma.contentBlock.update({
      where: { id },
      data: {
        ...(body.contentJson !== undefined && { contentJson: body.contentJson }),
        ...(body.type !== undefined && { type: body.type }),
      },
      include: { teacherNote: true },
    });

    return apiSuccess(block);
  });
}

// DELETE — удалить блок
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    await prisma.contentBlock.delete({ where: { id } });
    return apiSuccess({ success: true });
  });
}
