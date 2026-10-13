import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore Supabase Edge Runtime resolves JSR imports at deployment
import { createClient } from "jsr:@supabase/supabase-js@2";

// Ambient declarations for Deno runtime when inspected in environments without Deno LSP
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

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

interface DbQuestionRow {
  id: string;
  question_number?: number;
  question: string;
  category: "technical" | "system_design" | "behavioral";
  difficulty: "easy" | "medium" | "hard";
  time_limit_seconds: number;
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

    // Privileged database client for authoritative writes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse & Validate Payload
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Empty or non-JSON body
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

    // 3. Handle interviewId & Session Ownership
    const rawInterviewId = typeof body.interviewId === "string" ? body.interviewId.trim() : null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let interviewId: string | null = null;
    let existingInterviewRow: Record<string, unknown> | null = null;

    if (rawInterviewId) {
      if (!uuidRegex.test(rawInterviewId)) {
        return new Response(
          JSON.stringify({
            error: "BAD_REQUEST",
            message: "Invalid interview ID format. Must be a valid UUID.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      interviewId = rawInterviewId;

      const { data: existingInterview, error: fetchErr } = await supabaseAdmin
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .maybeSingle();

      if (fetchErr) {
        return new Response(
          JSON.stringify({
            error: "DATABASE_ERROR",
            message: `Failed to verify interview session: ${fetchErr.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!existingInterview) {
        return new Response(
          JSON.stringify({
            error: "NOT_FOUND",
            message: "Interview session not found",
          }),
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

      // Idempotency: If questions already exist for this session, return them immediately
      const { data: existingQuestions, error: qCheckErr } = await supabaseAdmin
        .from("interview_questions")
        .select("id, question_number, question, category, difficulty, time_limit_seconds")
        .eq("interview_id", interviewId)
        .order("question_number", { ascending: true });

      if (!qCheckErr && existingQuestions && existingQuestions.length > 0) {
        return new Response(
          JSON.stringify({
            session: {
              id: existingInterview.id,
              userId: existingInterview.user_id,
              roleTitle: existingInterview.role,
              experienceLevel: existingInterview.experience_level,
              difficulty: existingInterview.difficulty,
              currentState: "READY",
              startedAt: existingInterview.started_at,
              currentQuestionIndex: 0,
              questions: (existingQuestions as DbQuestionRow[]).map((q: DbQuestionRow) => ({
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

      existingInterviewRow = existingInterview;
    }

    // 4. Gemini AI Secret Validation
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("[EDGE_FUNCTION] GEMINI_API_KEY is not configured in Supabase Edge Secrets.");
      return new Response(
        JSON.stringify({
          error: "AI_CONFIGURATION_ERROR",
          message: "Gemini AI API key is not configured in Edge Function secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Invoke Gemini with Candidate Fallback, Bounded Per-Model Timeout & Total Deadline
    const primaryModel = (
      Deno.env.get("GEMINI_PRIMARY_MODEL") ||
      Deno.env.get("GEMINI_MODEL") ||
      "gemini-2.5-flash"
    ).trim();

    const standardFallbacks = [
      "gemini-2.5-flash-lite",
      "gemini-2.5-pro",
    ];

    const candidateModels = [
      primaryModel,
      ...standardFallbacks.filter((m) => m !== primaryModel),
    ];

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
- Spoken Voice & Pacing Guidelines:
  * Each question must be clear, concise, and conversational (1 to 3 spoken sentences maximum).
  * Ask one single, focused question at a time. Do not bundle multiple sub-questions together.
  * Avoid long rhetorical preambles or conversational filler before the question.
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

    const TOTAL_DEADLINE_MS = 25000;
    const PER_ATTEMPT_TIMEOUT_MS = 10000;
    const generationStartTime = Date.now();

    let generatedQuestions: GeneratedQuestion[] = [];
    let lastAiError = "";
    let lastStatusCode = 503;

    for (const model of candidateModels) {
      const elapsedMs = Date.now() - generationStartTime;
      const remainingDeadlineMs = TOTAL_DEADLINE_MS - elapsedMs;
      if (remainingDeadlineMs < 2000) {
        console.warn(`[EDGE_FUNCTION] Total generation deadline reached (${elapsedMs}ms). Aborting further model attempts.`);
        lastAiError = "Overall AI generation deadline exceeded (25s)";
        break;
      }

      const attemptTimeoutMs = Math.min(PER_ATTEMPT_TIMEOUT_MS, remainingDeadlineMs);

      try {
        console.log(`[EDGE_FUNCTION] Attempting question generation with model: ${model} (timeout: ${attemptTimeoutMs}ms)`);
        const attemptStart = Date.now();

        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey,
            },
            signal: AbortSignal.timeout(attemptTimeoutMs),
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        const attemptDurationMs = Date.now() - attemptStart;

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          lastStatusCode = status;
          const errorText = await aiResponse.text();
          console.warn(`[EDGE_FUNCTION] Model ${model} returned status ${status} in ${attemptDurationMs}ms:`, errorText.substring(0, 150));

          // Permanent Auth Failure: Fail fast without hammering remaining models
          if (status === 401 || status === 403) {
            lastAiError = "AI service authentication error. Please verify API configuration.";
            console.error(`[EDGE_FUNCTION] Permanent authentication failure with Gemini API (HTTP ${status}).`);
            break;
          }

          // Permanent Model Not Found: skip to next candidate
          if (status === 404) {
            lastAiError = `Model ${model} not supported by upstream API (HTTP 404)`;
            continue;
          }

          // Upstream Demand / Overload / Rate-limit (503 / 429 / 5xx): retryable on fallback model
          lastAiError = `Model ${model} unavailable (HTTP ${status})`;
          continue;
        }

        const aiData = await aiResponse.json();
        const contentText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!contentText) {
          lastAiError = `Empty content part from model ${model}`;
          continue;
        }

        // Sanitize markdown fences if present
        let cleanText = String(contentText).trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```\s*/, "").replace(/```$/, "").trim();
        }

        let parsed: { questions?: unknown[] };
        try {
          parsed = JSON.parse(cleanText);
        } catch {
          lastAiError = `Model ${model} returned invalid JSON syntax`;
          continue;
        }

        if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
          const validated: GeneratedQuestion[] = parsed.questions
            .map((item: unknown, idx: number) => {
              if (typeof item !== "object" || item === null) return null;
              const q = item as Record<string, unknown>;
              const questionText = typeof q?.question === "string" ? q.question.trim() : "";
              if (questionText.length < 10) return null;

              const defaultCategory =
                idx === 0 ? "technical" : idx === 1 ? "system_design" : "behavioral";
              const validCategories = ["technical", "system_design", "behavioral"];
              const category = validCategories.includes(String(q?.category))
                ? (q.category as "technical" | "system_design" | "behavioral")
                : defaultCategory;

              const validDiffs = ["easy", "medium", "hard"];
              const qDiff = validDiffs.includes(String(q?.difficulty))
                ? (q.difficulty as "easy" | "medium" | "hard")
                : difficulty;

              const timeLimit =
                typeof q?.time_limit_seconds === "number" && q.time_limit_seconds > 0
                  ? Math.floor(q.time_limit_seconds)
                  : 180;

              return {
                question: questionText,
                category,
                difficulty: qDiff,
                time_limit_seconds: timeLimit,
              };
            })
            .filter((q): q is GeneratedQuestion => q !== null);

          if (validated.length >= 1) {
            generatedQuestions = validated;
            const totalDurationMs = Date.now() - generationStartTime;
            console.log(`[EDGE_FUNCTION] Successfully generated ${generatedQuestions.length} questions using ${model} in ${totalDurationMs}ms (attempt: ${attemptDurationMs}ms)`);
            break;
          } else {
            lastAiError = `Model ${model} produced malformed or incomplete question entries`;
          }
        } else {
          lastAiError = `Model ${model} response missing valid questions array`;
        }
      } catch (attemptErr) {
        const errMsg = attemptErr instanceof Error ? attemptErr.message : String(attemptErr);
        console.warn(`[EDGE_FUNCTION] Model ${model} attempt failed:`, errMsg);
        lastAiError = errMsg;
      }
    }

    if (generatedQuestions.length === 0) {
      console.error("[EDGE_FUNCTION] All candidate models failed. Last error:", lastAiError);
      return new Response(
        JSON.stringify({
          error: "AI_GENERATION_FAILED",
          message: "AI interviewer service is currently experiencing high demand. Please click 'Retry Initialization' to reconnect.",
          details: lastAiError,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Database Persistence: Create or Attach to Interview Session
    let activeInterviewId = interviewId;
    let targetInterviewRow = existingInterviewRow;
    let newlyCreatedInterviewId: string | null = null;

    if (!targetInterviewRow) {
      if (!activeInterviewId) {
        // Fallback: check for recently created empty in-progress interview to prevent duplicates
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        const { data: recentEmptyInterviews } = await supabaseAdmin
          .from("interviews")
          .select("id, user_id, role, experience_level, difficulty, started_at, status")
          .eq("user_id", user.id)
          .eq("status", "in_progress")
          .gte("started_at", threeMinutesAgo)
          .order("started_at", { ascending: false })
          .limit(3);

        if (recentEmptyInterviews && recentEmptyInterviews.length > 0) {
          for (const candidate of recentEmptyInterviews) {
            const { count } = await supabaseAdmin
              .from("interview_questions")
              .select("id", { count: "exact", head: true })
              .eq("interview_id", candidate.id);

            if (count === 0) {
              targetInterviewRow = candidate;
              activeInterviewId = candidate.id as string;
              console.log(`[EDGE_FUNCTION] Reusing existing empty in-progress interview session ${activeInterviewId}`);
              break;
            }
          }
        }
      }

      if (!targetInterviewRow) {
        const title = `${role} Interview - ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;

        const insertPayload: Record<string, unknown> = {
          user_id: user.id,
          title,
          role,
          interview_type: interviewType,
          experience_level: experienceLevel,
          difficulty,
          status: "in_progress",
          started_at: new Date().toISOString(),
        };

        if (activeInterviewId) {
          insertPayload.id = activeInterviewId;
        }

        const { data: newInterview, error: insertErr } = await supabaseAdmin
          .from("interviews")
          .insert(insertPayload)
          .select()
          .single();

        if (insertErr || !newInterview) {
          console.error("[EDGE_FUNCTION] Failed to create interview record:", insertErr?.message);
          return new Response(
            JSON.stringify({
              error: "DATABASE_ERROR",
              message: `Failed to create interview session: ${insertErr?.message}`,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        targetInterviewRow = newInterview;
        activeInterviewId = newInterview.id as string;
        newlyCreatedInterviewId = newInterview.id as string;
      }
    }

    // 7. Persist Generated Questions
    const rowsToInsert = generatedQuestions.map((q, idx) => ({
      interview_id: activeInterviewId,
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
      console.error("[EDGE_FUNCTION] Failed to insert questions:", insertQuestionsErr?.message);
      // Clean up newly created interview session to prevent orphaned in-progress record
      if (newlyCreatedInterviewId) {
        await supabaseAdmin.from("interviews").delete().eq("id", newlyCreatedInterviewId);
      }
      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: `Failed to save generated interview questions: ${insertQuestionsErr?.message}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Return Persisted Session Data
    if (!targetInterviewRow) {
      console.error("[EDGE_FUNCTION] Interview session record could not be resolved");
      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Interview session record could not be resolved",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = {
      id: targetInterviewRow.id,
      userId: targetInterviewRow.user_id,
      roleTitle: targetInterviewRow.role,
      experienceLevel: targetInterviewRow.experience_level,
      difficulty: targetInterviewRow.difficulty,
      currentState: "READY",
      startedAt: targetInterviewRow.started_at,
      currentQuestionIndex: 0,
      questions: (insertedQuestions as DbQuestionRow[]).map((q: DbQuestionRow) => ({
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
