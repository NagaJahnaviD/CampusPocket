// ============================================================
// parentService.js – Dashboard, child report, and linking
// ============================================================
// These functions are for parent users only.
// The parent must be logged in first (via auth.js login).
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// getParentDashboard()
// ----------------------------------------------------------
// Calls get_parent_dashboard() RPC.
// Returns an object with a "children" array. Each child has:
//   - child_id               (UUID)
//   - child_name             (string)
//   - attendance_percentage  (number)
//   - average_grade          (number)
//   - unpaid_fees_count      (number)
//
// Usage from a React Native screen:
//   const { data, error } = await getParentDashboard();
//   if (error) { Alert.alert("Error", error); return; }
//   setChildren(data.children);
// ----------------------------------------------------------
export async function getParentDashboard() {
  try {
    const { data, error } = await supabase.rpc("get_parent_dashboard");

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// getParentChildReport(childId)
// ----------------------------------------------------------
// Calls get_parent_child_report(child_id) RPC.
// Returns a detailed report for one linked child:
//   - attendance_percentage  (number)
//   - average_grade          (number)
//   - fees                   (array)
//   - classrooms             (array)
//
// Parameters:
//   childId (string/UUID) – the app user ID of the child
//
// The RPC will raise an error if the parent is NOT linked
// to this child, so we don't need to check manually.
// ----------------------------------------------------------
export async function getParentChildReport(childId) {
  try {
    const { data, error } = await supabase.rpc("get_parent_child_report", {
      p_child_id: childId,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// linkChildToParent(childUsername, childPassword)
// ----------------------------------------------------------
// Calls link_child_to_parent(child_username, child_password) RPC.
// Links a student to the currently logged-in parent.
//
// The parent needs the child's exact username and password.
// This is the verification step – if the credentials are wrong,
// the link won't be created.
//
// Returns { success: true, message: "..." } on success.
//
// Usage:
//   const { data, error } = await linkChildToParent("arjun_s", "pass123");
//   if (error) { Alert.alert("Error", error); return; }
//   Alert.alert("Success", data.message);
// ----------------------------------------------------------
export async function linkChildToParent(childUsername, childPassword) {
  try {
    const { data, error } = await supabase.rpc("link_child_to_parent", {
      p_child_username: childUsername,
      p_child_password: childPassword,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
