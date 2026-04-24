// ============================================================
// frontendUsageExamples.js
// ============================================================
// This file shows you HOW to call every backend function
// from a React Native screen.
//
// You do NOT import this file in your app.
// It's a REFERENCE – copy the parts you need into your screens.
//
// Every example follows the same pattern:
//   1. Import the function
//   2. Call it with await
//   3. Check for errors
//   4. Use the data
// ============================================================


// ----------------------------------------------------------
// EXAMPLE 1: Login
// ----------------------------------------------------------
// Where to use: Your Login screen
// What it does: Signs the user in with their username & password

import { login, logout, getCurrentProfile } from "../src/auth.js";

async function handleLogin() {
  // Call login with the username and password from your text inputs
  const { data, error } = await login("arjun_s", "password123");

  if (error) {
    // Show an error message to the user
    // In React Native: Alert.alert("Login Failed", error);
    console.error("Login failed:", error);
    return;
  }

  // Success! The user is now logged in.
  // data.session contains the auth token (Supabase handles this for you)
  // data.user contains the auth user info (email, id, etc.)
  console.log("Logged in as:", data.user.email);
}


// ----------------------------------------------------------
// EXAMPLE 2: Get Current Profile
// ----------------------------------------------------------
// Where to use: After login, or on any screen that needs the user's info
// What it does: Returns the app user row (full_name, role, school_id, etc.)

async function handleGetProfile() {
  const { data: profile, error } = await getCurrentProfile();

  if (error) {
    console.error("Could not get profile:", error);
    return;
  }

  // Now you have the user's profile
  console.log("Name:", profile.full_name);    // "Arjun Sharma"
  console.log("Role:", profile.role);          // "student"
  console.log("School:", profile.school_id);
  console.log("Username:", profile.username);  // "arjun_s"

  // In React Native, you'd save this in state:
  // setProfile(profile);
}


// ----------------------------------------------------------
// EXAMPLE 3: Student Dashboard
// ----------------------------------------------------------
// Where to use: Student home screen
// What it does: Gets attendance %, average grade, unpaid fees, upcoming events

import { getStudentDashboard, getStudentClassReport } from "../src/studentService.js";

async function handleStudentDashboard() {
  const { data, error } = await getStudentDashboard();

  if (error) {
    console.error("Dashboard error:", error);
    return;
  }

  // data is an object with these fields:
  console.log("Attendance:", data.attendance_percentage, "%");   // e.g. 83.33
  console.log("Average Grade:", data.average_grade, "%");        // e.g. 82.50
  console.log("Unpaid Fees:", data.unpaid_fees_count);           // e.g. 1
  console.log("Upcoming Events:", data.upcoming_events);         // array of events

  // In React Native:
  // setAttendance(data.attendance_percentage);
  // setGrade(data.average_grade);
  // setFees(data.unpaid_fees_count);
  // setEvents(data.upcoming_events);
}


// ----------------------------------------------------------
// EXAMPLE 4: Student Class Report
// ----------------------------------------------------------
// Where to use: When a student taps on a specific classroom
// What it does: Shows attendance & grades for ONE classroom

async function handleClassReport() {
  // Replace with a real classroom ID from your data
  const classroomId = "cccccccc-0001-0000-0000-000000000001"; // Math class

  const { data, error } = await getStudentClassReport(classroomId);

  if (error) {
    console.error("Class report error:", error);
    return;
  }

  console.log("Class Attendance:", data.attendance_percentage, "%");
  console.log("Class Average:", data.average_grade, "%");
  console.log("Assignments:");

  // data.assignments is an array of grade objects
  data.assignments.forEach((a) => {
    console.log(`  ${a.title}: ${a.marks_obtained}/${a.max_marks} (${a.percentage}%)`);
  });
}


// ----------------------------------------------------------
// EXAMPLE 5: Parent Dashboard
// ----------------------------------------------------------
// Where to use: Parent home screen
// What it does: Shows a summary for each linked child

import { getParentDashboard, getParentChildReport, linkChildToParent } from "../src/parentService.js";

async function handleParentDashboard() {
  const { data, error } = await getParentDashboard();

  if (error) {
    console.error("Parent dashboard error:", error);
    return;
  }

  // data.children is an array – one entry per linked child
  data.children.forEach((child) => {
    console.log(`Child: ${child.child_name}`);
    console.log(`  Attendance: ${child.attendance_percentage}%`);
    console.log(`  Grade: ${child.average_grade}%`);
    console.log(`  Unpaid Fees: ${child.unpaid_fees_count}`);
  });

  // In React Native:
  // setChildren(data.children);
}


// ----------------------------------------------------------
// EXAMPLE 6: Parent Child Report
// ----------------------------------------------------------
// Where to use: When a parent taps on a specific child
// What it does: Detailed report – attendance, grades, fees, classrooms

async function handleChildReport() {
  const childId = "aaaaaaaa-0001-0000-0000-000000000001"; // Arjun

  const { data, error } = await getParentChildReport(childId);

  if (error) {
    console.error("Child report error:", error);
    return;
  }

  console.log("Attendance:", data.attendance_percentage, "%");
  console.log("Average Grade:", data.average_grade, "%");
  console.log("Fees:", data.fees);           // array of fee objects
  console.log("Classrooms:", data.classrooms); // array of classroom objects
}


// ----------------------------------------------------------
// EXAMPLE 7: Link Child to Parent
// ----------------------------------------------------------
// Where to use: Parent screen – "Add Child" button
// What it does: Links a student to the logged-in parent
// Requires: The child's exact username AND password

async function handleLinkChild() {
  // The parent enters their child's username and password
  const childUsername = "arjun_s";
  const childPassword = "password123";

  const { data, error } = await linkChildToParent(childUsername, childPassword);

  if (error) {
    console.error("Link failed:", error);
    // Common error: "Only parents can link children"
    // Common error: "No student found with that username"
    return;
  }

  console.log(data.message); // "Child linked successfully"

  // In React Native:
  // Alert.alert("Success", data.message);
  // Then refresh the parent dashboard
}


// ----------------------------------------------------------
// EXAMPLE 8: Anonymized Leaderboard
// ----------------------------------------------------------
// Where to use: Classroom detail screen
// What it does: Shows rank + avg grade, NO names – just "is_me" flag

import { getAnonymizedLeaderboard } from "../src/leaderboardService.js";

async function handleLeaderboard() {
  const classroomId = "cccccccc-0001-0000-0000-000000000001"; // Math class

  const { data, error } = await getAnonymizedLeaderboard(classroomId);

  if (error) {
    console.error("Leaderboard error:", error);
    return;
  }

  // data.leaderboard is an array sorted by rank
  data.leaderboard.forEach((entry) => {
    const label = entry.is_me ? " ← YOU" : "";
    console.log(`#${entry.rank}  Grade: ${entry.average_grade}%${label}`);
  });

  // Output might look like:
  //   #1  Grade: 87.00%  ← YOU
  //   #2  Grade: 73.00%
}


// ----------------------------------------------------------
// EXAMPLE 9: Grade Goal Setter
// ----------------------------------------------------------
// Where to use: Student screen – "What do I need to score?" feature
// What it does: Calculates what average the student needs on
//               remaining assignments to reach a target grade

import { calculateGradeGoal } from "../src/gradeGoalService.js";

async function handleGradeGoal() {
  const classroomId = "cccccccc-0001-0000-0000-000000000001"; // Math class
  const targetPercentage = 90; // "I want 90% overall"

  const { data, error } = await calculateGradeGoal(classroomId, targetPercentage);

  if (error) {
    console.error("Grade goal error:", error);
    return;
  }

  if (data.possible) {
    console.log(`Current average: ${data.current_average}%`);
    console.log(`Remaining assignments: ${data.remaining_assignments}`);
    console.log(`You need ${data.needed_average_percentage}% avg on remaining`);
  } else {
    console.log("Target not reachable:", data.message || "Score needed exceeds 100%");
  }
}


// ----------------------------------------------------------
// EXAMPLE 10: Campus Events (Calendar)
// ----------------------------------------------------------
// Where to use: Events / Calendar screen
// What it does: Fetches all school events sorted by date

import { getCampusEvents } from "../src/calendarService.js";

async function handleEvents() {
  const { data: events, error } = await getCampusEvents();

  if (error) {
    console.error("Events error:", error);
    return;
  }

  events.forEach((event) => {
    console.log(`${event.event_date} – ${event.title} (${event.event_type})`);
  });

  // Output:
  //   2025-05-01 – Annual Sports Day (sports)
  //   2025-05-05 – Science Fair (event)
  //   2025-05-10 – Mid-Term Examinations (exam)
}


// ----------------------------------------------------------
// EXAMPLE 11: Digital Circulars (Notices)
// ----------------------------------------------------------
// Where to use: Notices / Circular screen
// What it does: Fetches school circulars, newest first

import { getCirculars } from "../src/circularService.js";

async function handleCirculars() {
  const { data: circulars, error } = await getCirculars();

  if (error) {
    console.error("Circulars error:", error);
    return;
  }

  circulars.forEach((c) => {
    console.log(`[${c.published_at}] ${c.title}`);
    console.log(`  ${c.body}`);
  });
}


// ----------------------------------------------------------
// EXAMPLE 12: Extracurricular Activities
// ----------------------------------------------------------
// Where to use: Profile or Activities screen
// What it does: Shows which clubs/activities a student has joined

import { getStudentActivities } from "../src/extracurricularService.js";

async function handleActivities() {
  // Pass the student's app user ID
  const studentId = "aaaaaaaa-0001-0000-0000-000000000001"; // Arjun

  const { data: activities, error } = await getStudentActivities(studentId);

  if (error) {
    console.error("Activities error:", error);
    return;
  }

  activities.forEach((a) => {
    console.log(`${a.name} – ${a.day_of_week} ${a.time_slot}`);
  });

  // Output:
  //   Chess Club – Monday 3:00 PM – 4:00 PM
  //   Football Team – Wednesday 4:00 PM – 5:30 PM
}


// ----------------------------------------------------------
// EXAMPLE 13: Logout
// ----------------------------------------------------------
// Where to use: Settings or Profile screen – "Sign Out" button

async function handleLogout() {
  const { data, error } = await logout();

  if (error) {
    console.error("Logout failed:", error);
    return;
  }

  console.log(data.message); // "Logged out successfully"

  // In React Native:
  // navigation.reset({ index: 0, routes: [{ name: "Login" }] });
}
