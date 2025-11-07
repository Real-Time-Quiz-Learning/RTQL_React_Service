import LoginPage from "../pages/LoginPage";

export function meta() {
  return [
    { title: "Login" },
    { name: "description", content: "Login page" },
  ];
}

export default function Login() {
  return <LoginPage />;
}
