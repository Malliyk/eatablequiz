// Simple sessionStorage helpers for the in-flight quiz.
export type QuizQuestion = {
  id: string;
  question_en: string;
  question_kn: string | null;
  option_a_en: string; option_a_kn: string | null;
  option_b_en: string; option_b_kn: string | null;
  option_c_en: string; option_c_kn: string | null;
  option_d_en: string; option_d_kn: string | null;
  difficulty: string;
  subject: string | null;
};
export type PlayerMode = {
  id: string; players: number; num_questions: number;
  easy_count: number; moderate_count: number; difficult_count: number;
  time_limit_seconds: number; correct_to_win: number; reward_text: string;
};
// Grading result returned by the server after submission.
export type QuizResult = {
  correct: number;
  total: number;
  wrong: number;
  won: boolean;
  reward_text: string;
  results: { id: string; chosen: string | null; correct_answer: string | null; isCorrect: boolean }[];
};
export type QuizLang = "en" | "kn";
export type QuizSession = {
  teamName: string;
  lang: QuizLang;
  mode: PlayerMode;
  questions: QuizQuestion[];
  answers: (string | null)[]; // 'A'|'B'|'C'|'D'|null
  startedAt: number;
  submittedAt?: number;
  result?: QuizResult;
};


const KEY = "eatable-session";
export function saveSession(s: QuizSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(s));
}
export function loadSession(): QuizSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

const TEAM_KEY = "eatable-team";
export function saveTeam(name: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TEAM_KEY, name);
}
export function loadTeam(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TEAM_KEY) || "";
}
