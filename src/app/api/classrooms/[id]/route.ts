import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          units: {
            include: {
              lessons: {
                include: { sections: { orderBy: { order: "asc" } } },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      teacher: { select: { id: true, name: true, image: true, email: true, lastSeenAt: true } },
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true, image: true, lastSeenAt: true } } },
        where: { status: "ACTIVE" },
      },
      schedule: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { enrollments: true, homework: true } },
    },
  });
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(classroom);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const classroom = await prisma.classroom.update({ where: { id }, data });
  return NextResponse.json(classroom);
}
