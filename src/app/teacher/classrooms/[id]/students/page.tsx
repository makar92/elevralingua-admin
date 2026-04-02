"use client";
import { useParams } from "next/navigation";
import { useClassroom } from "../layout";
import { StudentsTab } from "./students-tab";
export default function P(){
  const{id}=useParams();
  const{ classroom }=useClassroom();
  return(<div className="p-6 max-w-6xl mx-auto"><StudentsTab classroomId={id as string} enrollments={classroom?.enrollments||[]}/></div>);
}