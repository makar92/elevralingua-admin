// ===========================================
// Файл: src/app/api/blocks/[id]/route.ts
// Описание: PATCH — обновить блок. DELETE — удалить блок.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling, extractBlobUrls, cleanupStorageUrls } from "@/lib/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();

    if (body.contentJson) {
      const oldBlock = await prisma.contentBlock.findUnique({ where: { id } });
      if (oldBlock) {
        const oldUrls = new Set(extractBlobUrls(oldBlock.contentJson));
        const newUrls = new Set(extractBlobUrls(body.contentJson));
        const removedUrls = [...oldUrls].filter(u => !newUrls.has(u));
        if (removedUrls.length > 0) await cleanupStorageUrls(removedUrls);
      }
    }

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;

    const block = await prisma.contentBlock.findUnique({ where: { id } });
    const allUrls = block ? extractBlobUrls(block.contentJson) : [];

    await prisma.contentBlock.delete({ where: { id } });
    await cleanupStorageUrls(allUrls);
    return apiSuccess({ success: true });
  });
}
