"use client";

import { createContext, useContext } from "react";

interface StudentClassroomContextType {
  classroom: any;
  reloadClassroom: () => any;
}

export const StudentClassroomContext = createContext<StudentClassroomContextType>({
  classroom: null,
  reloadClassroom: async () => {},
});

export function useStudentClassroom() {
  return useContext(StudentClassroomContext);
}
