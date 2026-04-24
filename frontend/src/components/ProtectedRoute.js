// ============================================================
// ProtectedRoute.js – RBAC route guard (themed)
// ============================================================
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ allowedRole, children }) {
  const { role, loading, session } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!session || !role) {
      router.replace("/");
      return;
    }

    if (role !== allowedRole) {
      if (role === "student") router.replace("/student");
      else if (role === "parent") router.replace("/parent");
      else router.replace("/");
      return;
    }

    setChecked(true);
  }, [loading, session, role, allowedRole]);

  if (loading) return <LoadingScreen message="Loading..." />;
  if (!checked) return <LoadingScreen message="Loading..." />;

  return children;
}
