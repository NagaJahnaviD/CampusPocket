// ============================================================
// aiInsightService.js – Gemini AI student insights
// ============================================================
// Generates personalized strengths/weaknesses/recommendations
// using Google's Gemini API.
//
// If the API key is not configured, returns a rule-based
// fallback so the app never crashes.
//
// Environment variable:
//   EXPO_PUBLIC_GEMINI_API_KEY
// ============================================================

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Generate AI-powered student insights.
 *
 * @param {object} rawStudentData – attendance %, grades, fee status, etc.
 * @returns {{ strengths: string[], weaknesses: string[], recommendations: string[] }}
 */
export async function generateStudentInsight(rawStudentData) {
  // If no API key, return rule-based fallback
  if (!GEMINI_API_KEY) {
    return generateFallbackInsight(rawStudentData);
  }

  try {
    // Build the prompt
    const prompt = buildPrompt(rawStudentData);

    // Call Gemini API
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      // API failed — use fallback instead of crashing
      return generateFallbackInsight(rawStudentData);
    }

    const json = await response.json();

    // Extract the text response from Gemini
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from the response
    return parseInsightResponse(text, rawStudentData);
  } catch (err) {
    // Network error or other failure — use fallback
    return generateFallbackInsight(rawStudentData);
  }
}

// ----------------------------------------------------------
// Build prompt for Gemini
// ----------------------------------------------------------
function buildPrompt(data) {
  return `You are a school academic advisor. Analyze this student data and respond ONLY with valid JSON (no markdown).

Student Data:
- Overall Attendance: ${data.attendance_percentage || "N/A"}%
- Average Grade: ${data.average_grade || "N/A"}%
- Class-wise attendance: ${JSON.stringify(data.class_attendance || [])}
- Recent assignment scores: ${JSON.stringify(data.assignment_scores || [])}
- Fee status: ${data.fee_status || "N/A"}

Respond in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Keep each item under 15 words. Maximum 3 items per category.`;
}

// ----------------------------------------------------------
// Parse Gemini's response into structured data
// ----------------------------------------------------------
function parseInsightResponse(text, rawData) {
  try {
    // Try parsing the response as JSON directly
    const parsed = JSON.parse(text.trim());
    return {
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || [],
    };
  } catch {
    // If JSON parsing fails, use fallback
    return generateFallbackInsight(rawData);
  }
}

// ----------------------------------------------------------
// Rule-based fallback (no API key needed)
// ----------------------------------------------------------
function generateFallbackInsight(data) {
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  const attendance = data?.attendance_percentage || 0;
  const grade = data?.average_grade || 0;

  // Attendance analysis
  if (attendance >= 85) {
    strengths.push(`Good attendance at ${attendance}%`);
  } else if (attendance >= 70) {
    weaknesses.push(`Attendance could improve (${attendance}%)`);
    recommendations.push("Try to attend all classes regularly");
  } else {
    weaknesses.push(`Low attendance at ${attendance}%`);
    recommendations.push("Attendance is critical — aim for 85%+");
  }

  // Grade analysis
  if (grade >= 85) {
    strengths.push(`Excellent academic performance (${grade}%)`);
  } else if (grade >= 70) {
    strengths.push(`Solid grades at ${grade}%`);
    recommendations.push("Review weak subjects to push above 85%");
  } else {
    weaknesses.push(`Grades need attention (${grade}%)`);
    recommendations.push("Consider extra study sessions or tutoring");
  }

  // Always add a positive recommendation
  if (strengths.length > 0 && recommendations.length === 0) {
    recommendations.push("Keep up the great work!");
  }

  return { strengths, weaknesses, recommendations };
}
