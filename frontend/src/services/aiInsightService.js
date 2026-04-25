// ============================================================
// aiInsightService.js – Gemini AI Student Insights
// ============================================================
// Sends student data (attendance, grades, activities, etc.)
// to Google Gemini API and returns structured insights.
//
// If no API key, returns a rule-based fallback.
//
// Env: EXPO_PUBLIC_GEMINI_API_KEY
// ============================================================

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Generate AI-powered student insights.
 *
 * @param {object} studentData
 * @param {number} studentData.attendance_percentage
 * @param {number} studentData.average_grade
 * @param {Array}  studentData.classrooms – [{class_name, subject, attendance_percentage, average_grade}]
 * @param {Array}  studentData.assignments – [{title, percentage, subject}]
 * @param {Array}  studentData.activities – [{name, description}]
 * @returns {object} { summary, strengths[], weaknesses[], suggestions[], resources[] }
 */
export async function generateStudentInsight(studentData) {
  if (!GEMINI_API_KEY) {
    return generateFallbackInsight(studentData);
  }

  try {
    const prompt = buildPrompt(studentData);

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.log("nope!!")
      console.warn("Gemini API error:", response.status);
      return generateFallbackInsight(studentData);
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseInsightResponse(text, studentData);
  } catch (err) {
    console.warn("Gemini fetch error:", err.message);
    return generateFallbackInsight(studentData);
  }
}

// ----------------------------------------------------------
// Build rich prompt for Gemini
// ----------------------------------------------------------
function buildPrompt(data) {
  const classDetails = (data.classrooms || [])
    .map(
      (c) =>
        `  - ${c.class_name} (${c.subject || "N/A"}): Attendance ${c.attendance_percentage ?? "N/A"}%, Grade ${c.average_grade ?? "N/A"}%`
    )
    .join("\n");

  const assignmentDetails = (data.assignments || [])
    .slice(0, 10)
    .map((a) => `  - ${a.title}: ${a.percentage}%`)
    .join("\n");

  const activityList = (data.activities || [])
    .map((a) => `  - ${a.name}${a.description ? `: ${a.description}` : ""}`)
    .join("\n");

  return `You are a school academic counselor. Analyze this student's data and provide personalized insights.

=== STUDENT DATA ===
Overall Attendance: ${data.attendance_percentage ?? "N/A"}%
Overall Average Grade: ${data.average_grade ?? "N/A"}%

Class-wise Performance:
${classDetails || "  No class data available"}

Recent Assignment Scores:
${assignmentDetails || "  No assignment data available"}

Extracurricular / Co-curricular Activities:
${activityList || "  None enrolled"}

=== INSTRUCTIONS ===
Respond ONLY with valid JSON (no markdown, no code fences). Use this exact format:
{
  "summary": "A 2-3 sentence overall performance summary for the student.",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": [
    {"subject": "Subject Name", "tip": "Specific improvement suggestion"}
  ],
  "resources": [
    {"title": "Resource title", "url": "https://youtube.com/...", "subject": "Subject"}
  ]
}

Rules:
- Keep strengths/weaknesses under 20 words each. Max 4 items each.
- Provide 2-3 subject-specific improvement suggestions.
- Include 2-3 real YouTube learning resources (Khan Academy, Organic Chemistry Tutor, etc).
- Be encouraging but honest. Reference actual data values.
- If a subject grade is below 75%, flag it as needing improvement.
- Mention extracurricular activities as strengths if the student participates in any.`;
}

// ----------------------------------------------------------
// Parse Gemini response
// ----------------------------------------------------------
function parseInsightResponse(text, rawData) {
  try {
    // Strip any markdown code fences Gemini might add
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || "Performance analysis complete.",
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
      resources: parsed.resources || [],
    };
  } catch {
    return generateFallbackInsight(rawData);
  }
}

// ----------------------------------------------------------
// Rule-based fallback (no API key needed)
// ----------------------------------------------------------
function generateFallbackInsight(data) {
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];
  const resources = [];

  const attendance = data?.attendance_percentage || 0;
  const grade = data?.average_grade || 0;
  const classrooms = data?.classrooms || [];
  const activities = data?.activities || [];

  // --- Summary ---
  let summary = "";
  if (attendance >= 75 && grade >= 80) {
    summary = `Strong overall performance with ${attendance}% attendance and ${grade}% average grade. Keep up the excellent work!`;
  } else if (attendance >= 70 && grade >= 60) {
    summary = `Moderate performance with ${attendance}% attendance and ${grade}% grade. There's good potential for improvement.`;
  } else {
    summary = `Performance needs attention — ${attendance}% attendance and ${grade}% grade. Focus on regular attendance and consistent study habits.`;
  }

  // --- Attendance analysis ---
  if (attendance >= 80) {
    strengths.push(`Excellent attendance at ${attendance}%`);
  } else if (attendance >= 65) {
    weaknesses.push(`Attendance (${attendance}%) below ideal 80% threshold`);
    suggestions.push({ subject: "General", tip: "Aim for 80%+ attendance to avoid missing key concepts" });
  } else {
    weaknesses.push(`Low attendance at ${attendance}% — affects learning continuity`);
    suggestions.push({ subject: "General", tip: "Prioritize daily attendance; set alarms and plan ahead" });
  }

  // --- Grade analysis ---
  if (grade >= 85) {
    strengths.push(`Outstanding academic performance (${grade}%)`);
  } else if (grade >= 70) {
    strengths.push(`Good grades at ${grade}%`);
    suggestions.push({ subject: "General", tip: "Review weaker subjects to push above 85%" });
  } else {
    weaknesses.push(`Grades need improvement (${grade}%)`);
    suggestions.push({ subject: "General", tip: "Schedule daily study sessions and seek help from teachers" });
  }

  // --- Per-class analysis ---
  classrooms.forEach((cls) => {
    if (cls.average_grade != null && cls.average_grade < 70) {
      weaknesses.push(`${cls.subject || cls.class_name}: grade at ${cls.average_grade}%`);
      suggestions.push({
        subject: cls.subject || cls.class_name,
        tip: `Focus extra study time on ${cls.subject || cls.class_name}`,
      });
    } else if (cls.average_grade != null && cls.average_grade >= 90) {
      strengths.push(`Excelling in ${cls.subject || cls.class_name} (${cls.average_grade}%)`);
    }
  });

  // --- Activities ---
  if (activities.length > 0) {
    strengths.push(`Active in ${activities.length} extracurricular activit${activities.length > 1 ? "ies" : "y"}`);
  } else {
    suggestions.push({ subject: "Well-being", tip: "Join a club or sport to develop soft skills" });
  }

  // --- Resources ---
  resources.push(
    { title: "Khan Academy – Math", url: "https://youtube.com/@khanacademy", subject: "Mathematics" },
    { title: "The Organic Chemistry Tutor", url: "https://youtube.com/@TheOrganicChemistryTutor", subject: "Science" },
    { title: "CrashCourse – Study Skills", url: "https://youtube.com/@crashcourse", subject: "General" }
  );

  return {
    summary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    suggestions: suggestions.slice(0, 4),
    resources: resources.slice(0, 3),
  };
}
