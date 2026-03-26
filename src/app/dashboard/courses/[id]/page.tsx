// ===========================================
// Файл: src/app/dashboard/courses/[id]/page.tsx
// Путь:  elevralingua-admin/src/app/dashboard/courses/[id]/page.tsx
//
// Описание:
//   Страница редактирования курса. Загружает курс с сервера
//   со всеми юнитами, уроками и разделами. Передаёт данные
//   в клиентский компонент CourseEditor.
// ===========================================

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/course-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;

  // Загружаем курс со всей вложенной структурой
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          lessons: {
            include: {
              sections: true, // Разделы урока (лексика, грамматика и т.д.)
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  // Если курс не найден — показываем 404
  if (!course) notFound();

  return <CourseEditor course={course} />;
}
