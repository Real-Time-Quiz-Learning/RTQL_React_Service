import { type RouteConfig } from "@react-router/dev/routes";

export default [
	{ file: "routes/home.tsx", index: true },
	{ file: "routes/login.tsx", path: "login" },
] satisfies RouteConfig;
