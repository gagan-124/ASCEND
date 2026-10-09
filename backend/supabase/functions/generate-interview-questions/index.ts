import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GeneratedQuestion {
  question: string;
  category: "technical" | "system_design" | "behavioral";
  difficulty: "easy" | "medium" | "hard";
  time_limit_seconds: number;
}

function getBaselineQuestions(
  role: string,
  _level: string,
  difficulty: "easy" | "medium" | "hard",
  count: number
): GeneratedQuestion[] {
  const pool: GeneratedQuestion[] = [
    {
      question: `Welcome! Let's start with your background and experience as a ${role}. What is the most challenging technical project you've led or built recently?`,
      category: "technical",
      difficulty,
      time_limit_seconds: 180,
    },
    {
      question: `How do you approach system architecture design decisions when faced with trade-offs between performance, maintainability, and delivery speed?`,
      category: "system_design",
      difficulty,
      time_limit_seconds: 240,
    },
    {
      question: `Describe a situation where you had a major disagreement with a team member or stakeholder regarding a technical direction. How did you resolve it?`,
      category: "behavioral",
      difficulty,
      time_limit_seconds: 180,
    },
    {
      question: `When diagnosing a critical production failure or performance bottleneck under tight deadlines, what is your systematic debugging process?`,
      category: "technical",
      difficulty,
      time_limit_seconds: 180,
    },
    {
      question: `How do you ensure security, input validation, and authorization boundaries are rigorously maintained across your services?`,
      category: "system_design",
      difficulty,
      time_limit_seconds: 210,
    },
  ];

  return pool.slice(0, Math.min(count, pool.length));
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Verify User Authentication Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "CONFIGURATION_ERROR",
          message: "Supabase server environment variables not configured",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify token with Supabase Auth
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: userError?.message || "Invalid or expired session token",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Privileged database access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse & Validate Payload
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // empty body
    }

    const rawRole = typeof body.role === "string" ? body.role.trim() : "Software Engineer";
    const role = rawRole.length > 100 ? rawRole.substring(0, 100) : rawRole || "Software Engineer";

    // Normalize experience level to match PostgreSQL check constraint:
    // CHECK (experience_level IN ('student', 'entry', 'junior', 'mid', 'senior') OR experience_level IS NULL)
    let rawExp =
      typeof body.experienceLevel === "string" ? body.experienceLevel.toLowerCase().trim() : "mid";
    if (rawExp === "lead" || rawExp === "staff" || rawExp === "principal") {
      rawExp = "senior";
    }
    const validExpLevels = ["student", "entry", "junior", "mid", "senior"];
    const experienceLevel = validExpLevels.includes(rawExp) ? rawExp : "mid";

    // Normalize difficulty:
    // CHECK (difficulty IN ('easy', 'medium', 'hard') OR difficulty IS NULL)
    const rawDiff =
      typeof body.difficulty === "string" ? body.difficulty.toLowerCase().trim() : "medium";
    const validDifficulties = ["easy", "medium", "hard"];
    const difficulty = (validDifficulties.includes(rawDiff) ? rawDiff : "medium") as
      | "easy"
      | "medium"
      | "hard";

    // Normalize interview type:
    // CHECK (interview_type IN ('role', 'resume'))
    const rawType =
      typeof body.interviewType === "string" ? body.interviewType.toLowerCase().trim() : "role";
    const interviewType = rawType === "resume" ? "resume" : "role";

    const rawCount = typeof body.questionCount === "number" ? Math.floor(body.questionCount) : 3;
    const questionCount = Math.max(1, Math.min(10, rawCount || 3));

    // 3. Interview Record Ownership and Creation
    let interviewId = typeof body.interviewId === "string" ? body.interviewId.trim() : null;
    let interviewRow: Record<string, unknown> | null = null;

    if (interviewId) {
      const { data: existingInterview, error: fetchErr } = await supabaseAdmin
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .single();

      if (fetchErr || !existingInterview) {
        return new Response(
          JSON.stringify({ error: "NOT_FOUND", message: "Interview session not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingInterview.user_id !== user.id) {
        return new Response(
          JSON.stringify({
            error: "FORBIDDEN",
            message: "Access denied. You do not own this interview session.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingInterview.status !== "in_progress") {
        return new Response(
          JSON.stringify({
            error: "INVALID_STATE",
            message: "Cannot generate questions for an inactive or completed interview session.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      interviewRow = existingInterview;
    } else {
      const title = `${role} Interview - ${new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;

      const { data: newInterview, error: insertErr } = await supabaseAdmin
        .from("interviews")
        .insert({
          user_id: user.id,
          title,
          role,
          interview_type: interviewType,
          experience_level: experienceLevel,
          difficulty,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr || !newInterview) {
        return new Response(
          JSON.stringify({
            error: "DATABASE_ERROR",
            message: `Failed to create interview session: ${insertErr?.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      interviewRow = newInterview;
      interviewId = newInterview.id as string;
    }

    // 4. Idempotency Check: Retrieve existing questions if already generated
    const { data: existingQuestions, error: qCheckErr } = await supabaseAdmin
      .from("interview_questions")
      .select("id, question_number, question, category, difficulty, time_limit_seconds")
      .eq("interview_id", interviewId)
      .order("question_number", { ascending: true });

    if (!qCheckErr && existingQuestions && existingQuestions.length > 0) {
      return new Response(
        JSON.stringify({
          session: {
            id: interviewRow.id,
            userId: interviewRow.user_id,
            roleTitle: interviewRow.role,
            experienceLevel: interviewRow.experience_level,
            difficulty: interviewRow.difficulty,
            currentState: "READY",
            startedAt: interviewRow.started_at,
            currentQuestionIndex: 0,
            questions: existingQuestions.map((q) => ({
              id: q.id,
              text: q.question,
              category: q.category,
              difficulty: q.difficulty,
              timeLimitSeconds: q.time_limit_seconds,
            })),
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate Questions: AI Provider (Gemini) with Fallback Baseline
    let generatedQuestions: GeneratedQuestion[] = [];
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (geminiApiKey) {
      try {
        const prompt = `You are Ira, an expert technical interviewer at ASCEND.
Generate ${questionCount} realistic, professional interview questions for a candidate interviewing for the role of: "${role}".
Target experience level: "${experienceLevel}".
Target difficulty: "${difficulty}".
Interview format: "${interviewType === "resume" ? "Resume Project & Technical Screening" : "Domain & Competency Screening"}".

Requirements:
- Provide exactly ${questionCount} questions.
- Question 1 must be an introductory or background technical question (category: "technical").
- Question 2 must be an architectural, system design, or problem-solving question (category: "system_design").
- Question 3 must be a behavioral, leadership, or collaboration challenge (category: "behavioral").
- Output ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "question text",
      "category": "technical",
      "difficulty": "${difficulty}",
      "time_limit_seconds": 180
    }
  ]
}`;

        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const contentText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (contentText) {
            const parsed = JSON.parse(contentText);
            if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
              generatedQuestions = parsed.questions.map((q: Record<string, unknown>) => ({
                question: String(q.question || ""),
                category: ([
                  "technical",
                  "system_design",
                  "behavioral",
                ].includes(String(q.category))
                  ? q.category
                  : "technical") as "technical" | "system_design" | "behavioral",
                difficulty: ([
                  "easy",
                  "medium",
                  "hard",
                ].includes(String(q.difficulty))
                  ? q.difficulty
                  : difficulty) as "easy" | "medium" | "hard",
                time_limit_seconds:
                  typeof q.time_limit_seconds === "number" && q.time_limit_seconds > 0
                    ? q.time_limit_seconds
                    : 180,
              }));
            }
          }
        }
      } catch (aiErr) {
        console.error(
          "[EDGE_FUNCTION] Gemini question generation failed, using verified baseline:",
          aiErr
        );
      }
    }

    if (generatedQuestions.length === 0) {
      generatedQuestions = getBaselineQuestions(role, experienceLevel, difficulty, questionCount);
    }

    // 6. Server-Authorized Database Write for Questions
    const rowsToInsert = generatedQuestions.map((q, idx) => ({
      interview_id: interviewId,
      question_number: idx + 1,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      time_limit_seconds: q.time_limit_seconds,
    }));

    const { data: insertedQuestions, error: insertQuestionsErr } = await supabaseAdmin
      .from("interview_questions")
      .insert(rowsToInsert)
      .select();

    if (insertQuestionsErr || !insertedQuestions) {
      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: `Failed to save generated interview questions: ${insertQuestionsErr?.message}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Return Persisted Session Data
    const session = {
      id: interviewRow.id,
      userId: interviewRow.user_id,
      roleTitle: interviewRow.role,
      experienceLevel: interviewRow.experience_level,
      difficulty: interviewRow.difficulty,
      currentState: "READY",
      startedAt: interviewRow.started_at,
      currentQuestionIndex: 0,
      questions: insertedQuestions.map((q) => ({
        id: q.id,
        text: q.question,
        category: q.category,
        difficulty: q.difficulty,
        timeLimitSeconds: q.time_limit_seconds,
      })),
    };

    return new Response(JSON.stringify({ session }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[EDGE_FUNCTION] Unexpected unhandled error:", err);
    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Unexpected internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
