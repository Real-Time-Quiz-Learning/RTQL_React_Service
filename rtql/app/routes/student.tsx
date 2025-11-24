import StudentPage from "../pages/StudentPage";

export function meta() {
  return [
    { title: "Student Quiz" },
    { name: "description", content: "Student view for joining and answering quiz questions." },
  ];
}

export default function Student() {
  return <StudentPage />;
}
