// ============================================================
// app/parent/_layout.js – Layout for ALL parent screens
// ============================================================
// Wraps every /parent/* route with a ProtectedRoute guard.
// Only users with role === "parent" can see these screens.
// Everyone else gets redirected.
// ============================================================

import { Slot } from "expo-router";
import ProtectedRoute from "../../src/components/ProtectedRoute";

export default function ParentLayout() {
  return (
    <ProtectedRoute allowedRole="parent">
      <Slot />
    </ProtectedRoute>
  );
}
