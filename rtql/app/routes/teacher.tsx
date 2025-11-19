import TeacherPage from "../pages/TeacherPage";

export function meta() {
  return [
    { title: "RTQL Teacher Dashboard" },
    { name: "description", content: "Dashboard for managing quizzes and student progress in Real Time Quiz Learning." },
  ];
}

export default function Teacher() {
  return <TeacherPage />;
}