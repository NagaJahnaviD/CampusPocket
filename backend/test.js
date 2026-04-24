import { login, getCurrentProfile } from "./src/auth.js";
import { getStudentDashboard } from "./src/studentService.js";
import { getParentDashboard } from "./src/parentService.js";

async function test() {
    try {
        console.log("Testing student login...");

        await login("arjun_s", "password123");

        const profile = await getCurrentProfile();
        console.log("Profile:", profile);

        const studentDashboard = await getStudentDashboard();
        console.log("Student Dashboard:", studentDashboard);

        console.log("Student test passed!");
    } catch (error) {
        console.error("Student test failed:", error.message);
    }

    try {
        console.log("\nTesting parent login...");

        await login("arjun_s", "password123");

        const profile = await getCurrentProfile();
        console.log("Profile:", profile);

        const parentDashboard = await getParentDashboard();
        console.log("Parent Dashboard:", parentDashboard);

        console.log("Parent test passed!");
    } catch (error) {
        console.error("Parent test failed:", error.message);
    }
}

test();