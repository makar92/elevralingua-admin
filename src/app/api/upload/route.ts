// ===========================================
// Файл: src/app/api/upload/route.ts
// Описание: POST — загрузка файлов (картинки, аудио).
//   Сохраняет в public/uploads, возвращает URL.
// ===========================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("Файл не выбран");

    // Проверяем тип файла
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4",
    ];
    if (!allowedTypes.includes(file.type)) {
      return apiError("Разрешены только изображения и аудио");
    }

    // Проверяем размер (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return apiError("Файл слишком большой (макс 10MB)");
    }

    // Создаём папку uploads если нет
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Генерируем уникальное имя файла
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Сохраняем файл
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Возвращаем URL для доступа
    const url = `/uploads/${filename}`;

    return apiSuccess({ url, filename, type: file.type, size: file.size });
  });
}
