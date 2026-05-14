"use client";

import { createContext, useContext } from "react";

interface ClassroomContextType {
  classroom: any;
  reloadClassroom: () => any;
}

export const ClassroomContext = createContext<ClassroomContextType>({
  classroom: null,
  reloadClassroom: async () => {},
});

export function useClassroom() {
  return useContext(ClassroomContext);
}
