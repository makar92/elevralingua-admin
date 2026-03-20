// ===========================================
// Файл: src/app/api/blocks/[id]/route.ts
// Путь:  linguamethod-admin/src/app/api/blocks/[id]/route.ts
//
// Описание:
//   PATCH — обновить содержимое блока (+ очистка старых файлов из Vercel Blob).
//   DELETE — удалить блок (+ очистка файлов из Vercel Blob).
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// PATCH — обновить содержимое блока (+ очистка старых файлов)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;
    const body = await request.json();

    // Если обновляется contentJson — проверяем, не заменился ли файл
    if (body.contentJson && process.env.BLOB_READ_WRITE_TOKEN) {
      // Получаем старый блок для сравнения
      const oldBlock = await prisma.contentBlock.findUnique({ where: { id } });
      if (oldBlock) {
        const oldJson = oldBlock.contentJson as Record<string, unknown>;
        const newJson = body.contentJson as Record<string, unknown>;
        const removedUrls: string[] = [];

        // Ищем URL файлов, которые были заменены
        for (const [key, oldVal] of Object.entries(oldJson)) {
          if (
            typeof oldVal === "string" &&
            oldVal.includes("blob.vercel-storage.com") &&
            oldVal !== newJson[key]
          ) {
            removedUrls.push(oldVal);
          }
        }

        // Удаляем старые файлы из Vercel Blob
        if (removedUrls.length > 0) {
          try {
            const { del } = await import("@vercel/blob");
            await del(removedUrls);
          } catch (e) {
            console.error("Blob cleanup error:", e);
          }
        }
      }
    }

    // Обновляем блок в базе данных
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

// DELETE — удалить блок (+ очистка файлов из Vercel Blob)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;

    // Получаем блок перед удалением, чтобы почистить файлы
    const block = await prisma.contentBlock.findUnique({ where: { id } });

    if (block) {
      const json = block.contentJson as Record<string, unknown>;
      const blobUrls: string[] = [];

      // Собираем все URL файлов из contentJson
      for (const value of Object.values(json)) {
        if (typeof value === "string" && value.includes("blob.vercel-storage.com")) {
          blobUrls.push(value);
        }
      }

      // Удаляем файлы из Vercel Blob
      if (blobUrls.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { del } = await import("@vercel/blob");
          await del(blobUrls);
        } catch (e) {
          console.error("Blob cleanup error:", e);
        }
      }
    }

    // Удаляем блок из базы данных
    await prisma.contentBlock.delete({ where: { id } });
    return apiSuccess({ success: true });
  });
}
