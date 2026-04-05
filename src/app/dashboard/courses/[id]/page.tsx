// ===========================================
// Файл: src/app/dashboard/courses/[id]/page.tsx
// Описание: Страница редактирования курса. Загружает курс
//   и передаёт в CourseEditor.
// ===========================================

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/course-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          lessons: {
            include: {
              textbookSections: { orderBy: { order: "asc" } },
              workbookSections: { orderBy: { order: "asc" } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) notFound();

  return <CourseEditor course={course} />;
}
