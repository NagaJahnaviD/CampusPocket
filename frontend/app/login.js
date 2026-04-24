// ============================================================
// app/login.js – Redirect to index (login lives at /)
// ============================================================
import { Redirect } from "expo-router";

export default function LoginRedirect() {
  return <Redirect href="/" />;
}
