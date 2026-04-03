// ===========================================
// Файл: src/app/api/upload/route.ts
// Описание: POST — загрузка файлов (картинки, аудио).
//   DELETE — удаление старого файла из storage.
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
    const oldUrl = formData.get("oldUrl") as string | null;

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
      const { put, del } = await import("@vercel/blob");

      // Удаляем старый файл если передан oldUrl
      if (oldUrl && oldUrl.includes("public.blob.vercel-storage.com")) {
        try { await del(oldUrl); } catch (e) { console.warn("Failed to delete old blob:", e); }
      }

      const ext = file.name.split(".").pop() || "bin";
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_\-\u0400-\u04FF\u4e00-\u9fff]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 80);
      const prefix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const filename = `${prefix}_${baseName || "file"}.${ext}`;

      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type,
      });

      return apiSuccess({ url: blob.url, filename, type: file.type, size: file.size });
    } else {
      // === Локальная ФС (dev) ===
      const { writeFile, mkdir, unlink } = await import("fs/promises");
      const path = await import("path");

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      // Удаляем старый файл если передан oldUrl
      if (oldUrl && oldUrl.startsWith("/uploads/")) {
        try {
          const oldPath = path.join(process.cwd(), "public", oldUrl);
          await unlink(oldPath);
        } catch (e) { console.warn("Failed to delete old file:", e); }
      }

      const ext = file.name.split(".").pop() || "bin";
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_\-\u0400-\u04FF\u4e00-\u9fff]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 80);
      const prefix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const filename = `${prefix}_${baseName || "file"}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      const url = `/uploads/${filename}`;
      return apiSuccess({ url, filename, type: file.type, size: file.size });
    }
  });
}

// DELETE — удаление файла по URL
export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const { url } = await request.json();
    if (!url) return apiError("No URL provided");

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      if (url.includes("public.blob.vercel-storage.com")) {
        const { del } = await import("@vercel/blob");
        try { await del(url); } catch (e) { console.warn("Failed to delete blob:", e); }
      }
    } else {
      if (url.startsWith("/uploads/")) {
        const { unlink } = await import("fs/promises");
        const path = await import("path");
        try {
          const filepath = path.join(process.cwd(), "public", url);
          await unlink(filepath);
        } catch (e) { console.warn("Failed to delete file:", e); }
      }
    }

    return apiSuccess({ deleted: true });
  });
}
