// ===========================================
// Файл: src/app/api/upload/route.ts
// Описание: POST — загрузка файлов (картинки, аудио).
//   Vercel Blob для продакшена, локальная ФС для dev.
// ===========================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file selected");

    // Проверяем тип файла
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4",
    ];
    if (!allowedTypes.includes(file.type)) {
      return apiError("Only images and audio files are allowed");
    }

    // Проверяем размер (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return apiError("File too large (max 10MB)");
    }

    // Vercel Blob для продакшена, локальная ФС для dev
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // === Vercel Blob ===
      const { put } = await import("@vercel/blob");
      const ext = file.name.split(".").pop() || "bin";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type,
      });

      return apiSuccess({ url: blob.url, filename, type: file.type, size: file.size });
    } else {
      // === Локальная ФС (dev) ===
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const ext = file.name.split(".").pop() || "bin";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      const url = `/uploads/${filename}`;
      return apiSuccess({ url, filename, type: file.type, size: file.size });
    }
  });
}
