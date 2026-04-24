// ============================================================
// app/student/_layout.js – Layout for ALL student screens
// ============================================================
// Wraps every /student/* route with a ProtectedRoute guard.
// Only users with role === "student" can see these screens.
// Everyone else gets redirected.
// ============================================================

import { Slot } from "expo-router";
import ProtectedRoute from "../../src/components/ProtectedRoute";

export default function StudentLayout() {
  return (
    <ProtectedRoute allowedRole="student">
      <Slot />
    </ProtectedRoute>
  );
}
