import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function hashPw(pw: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(pw, "utf8").digest("hex");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function verifyPassword(password: string): Promise<boolean> {
  const supa = await admin();
  const { data } = await supa.from("settings").select("owner_password_hash").eq("id", 1).maybeSingle();
  if (!data) return false;
  return data.owner_password_hash === (await hashPw(password));
}

// ---------- Public reads ----------

export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const supa = await admin();
  const [{ data: settings }, { data: modes }] = await Promise.all([
    supa.from("settings").select("business_name,item_name,item_price,reward_text,quiz_enabled,retake_cooldown_minutes").eq("id", 1).maybeSingle(),
    supa.from("player_modes").select("*").eq("enabled", true).order("sort_order"),
  ]);
  return { settings, modes: modes ?? [] };
});

// Public question columns — correct_answer is deliberately excluded so the
// answer key never reaches the player's device. Grading happens server-side.
const PUBLIC_QUESTION_COLUMNS =
  "id,question_en,question_kn,option_a_en,option_a_kn,option_b_en,option_b_kn,option_c_en,option_c_kn,option_d_en,option_d_kn,difficulty,subject";


export const getQuizQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: { modeId: string }) => z.object({ modeId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supa = await admin();
    const { data: mode } = await supa.from("player_modes").select("*").eq("id", data.modeId).maybeSingle();
    if (!mode) throw new Error("Mode not found");

    const pickRandom = async (difficulty: string, n: number) => {
      if (n <= 0) return [];
      const { data } = await supa
        .from("questions")
        .select(PUBLIC_QUESTION_COLUMNS)
        .eq("active", true)
        .eq("difficulty", difficulty);
      const arr = (data ?? []).slice();
      // shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, n);
    };

    const [easy, moderate, difficult] = await Promise.all([
      pickRandom("Easy", mode.easy_count),
      pickRandom("Moderate", mode.moderate_count),
      pickRandom("Difficult", mode.difficult_count),
    ]);
    let questions = [...easy, ...moderate, ...difficult];
    // If insufficient, backfill from any active
    if (questions.length < mode.num_questions) {
      const { data } = await supa
        .from("questions")
        .select(PUBLIC_QUESTION_COLUMNS)
        .eq("active", true)
        .limit(mode.num_questions * 3);
      const seen = new Set(questions.map((q) => q.id));
      for (const q of data ?? []) {
        if (questions.length >= mode.num_questions) break;
        if (!seen.has(q.id)) questions.push(q);
      }
    }
    // Shuffle overall
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    questions = questions.slice(0, mode.num_questions);
    return { mode, questions };
  });

// Grades the quiz server-side. The browser only ever learns the outcome,
// and only after it has submitted its answers.
export const submitQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: { modeId: string; answers: { id: string; answer: string | null }[] }) =>
    z
      .object({
        modeId: z.string().uuid(),
        answers: z
          .array(
            z.object({
              id: z.string().uuid(),
              answer: z.enum(["A", "B", "C", "D"]).nullable(),
            }),
          )
          .max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const supa = await admin();
    const { data: mode } = await supa
      .from("player_modes")
      .select("correct_to_win,reward_text,num_questions")
      .eq("id", data.modeId)
      .maybeSingle();
    if (!mode) throw new Error("Mode not found");

    const ids = data.answers.map((a) => a.id);
    const { data: rows } = await supa
      .from("questions")
      .select("id,correct_answer")
      .in("id", ids);
    const keyById = new Map((rows ?? []).map((r) => [r.id, r.correct_answer]));

    let correct = 0;
    const results = data.answers.map((a) => {
      const correctAnswer = keyById.get(a.id) ?? null;
      const isCorrect = !!correctAnswer && a.answer === correctAnswer;
      if (isCorrect) correct++;
      return { id: a.id, chosen: a.answer, correct_answer: correctAnswer, isCorrect };
    });

    const total = data.answers.length;
    return {
      correct,
      total,
      wrong: total - correct,
      won: correct >= mode.correct_to_win,
      reward_text: mode.reward_text,
      results,
    };
  });



// ---------- Owner writes ----------

export const verifyOwner = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => ({ ok: await verifyPassword(data.password) }));

export const getOwnerData = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (!(await verifyPassword(data.password))) throw new Error("Unauthorized");
    const supa = await admin();
    const [{ data: settings }, { data: modes }, { count }] = await Promise.all([
      supa.from("settings").select("*").eq("id", 1).maybeSingle(),
      supa.from("player_modes").select("*").order("sort_order"),
      supa.from("questions").select("*", { count: "exact", head: true }),
    ]);
    return { settings, modes: modes ?? [], questionCount: count ?? 0 };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((d: any) =>
    z.object({
      password: z.string(),
      business_name: z.string(),
      item_name: z.string(),
      item_price: z.string(),
      reward_text: z.string(),
      quiz_enabled: z.boolean(),
      retake_cooldown_minutes: z.number().int().min(0).max(1440).default(30),
      new_password: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!(await verifyPassword(data.password))) throw new Error("Unauthorized");
    const supa = await admin();
    const patch: any = {
      business_name: data.business_name,
      item_name: data.item_name,
      item_price: data.item_price,
      reward_text: data.reward_text,
      quiz_enabled: data.quiz_enabled,
      retake_cooldown_minutes: data.retake_cooldown_minutes,
    };
    if (data.new_password && data.new_password.length >= 4) {
      patch.owner_password_hash = await hashPw(data.new_password);
    }
    const { error } = await supa.from("settings").update(patch).eq("id", 1);
    if (error) throw error;
    return { ok: true, passwordChanged: !!patch.owner_password_hash };
  });

export const upsertMode = createServerFn({ method: "POST" })
  .inputValidator((d: any) =>
    z.object({
      password: z.string(),
      id: z.string().uuid().optional(),
      players: z.number().int().positive(),
      enabled: z.boolean(),
      num_questions: z.number().int().positive(),
      easy_count: z.number().int().min(0),
      moderate_count: z.number().int().min(0),
      difficult_count: z.number().int().min(0),
      time_limit_seconds: z.number().int().positive(),
      correct_to_win: z.number().int().min(0),
      reward_text: z.string(),
      sort_order: z.number().int().default(0),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!(await verifyPassword(data.password))) throw new Error("Unauthorized");
    const supa = await admin();
    const { password, id, ...row } = data;
    if (id) {
      const { error } = await supa.from("player_modes").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supa.from("player_modes").insert(row);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteMode = createServerFn({ method: "POST" })
  .inputValidator((d: any) => z.object({ password: z.string(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (!(await verifyPassword(data.password))) throw new Error("Unauthorized");
    const supa = await admin();
    const { error } = await supa.from("player_modes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const QuestionRow = z.object({
  question_code: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  difficulty: z.string(),
  question_en: z.string(),
  question_kn: z.string().optional().nullable(),
  option_a_en: z.string(),
  option_a_kn: z.string().optional().nullable(),
  option_b_en: z.string(),
  option_b_kn: z.string().optional().nullable(),
  option_c_en: z.string(),
  option_c_kn: z.string().optional().nullable(),
  option_d_en: z.string(),
  option_d_kn: z.string().optional().nullable(),
  correct_answer: z.string().length(1),
  active: z.boolean().default(true),
});

export const uploadQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: any) =>
    z.object({
      password: z.string(),
      mode: z.enum(["replace", "append"]),
      rows: z.array(QuestionRow),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!(await verifyPassword(data.password))) throw new Error("Unauthorized");
    const supa = await admin();
    if (data.mode === "replace") {
      const { error } = await supa.from("questions").delete().not("id", "is", null);
      if (error) throw error;
    }
    // Insert in chunks of 500
    const chunks: any[][] = [];
    for (let i = 0; i < data.rows.length; i += 500) chunks.push(data.rows.slice(i, i + 500));
    let inserted = 0;
    for (const chunk of chunks) {
      const { error, count } = await supa.from("questions").insert(chunk, { count: "exact" });
      if (error) throw error;
      inserted += count ?? chunk.length;
    }
    return { ok: true, inserted };
  });
