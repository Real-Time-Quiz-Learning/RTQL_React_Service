import { type RouteConfig } from "@react-router/dev/routes";

export default [
	{ file: "routes/home.tsx", index: true },
	{ file: "routes/login.tsx", path: "login" },
	{ file: "routes/teacher.tsx", path: "teacher" },
	{ file: "routes/student.tsx", path: "student" },
] satisfies RouteConfig;
