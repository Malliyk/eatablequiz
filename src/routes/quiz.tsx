import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { loadSession, saveSession } from "@/lib/eatable-session";
import { submitQuiz } from "@/lib/eatable.functions";


export const Route = createFileRoute("/quiz")({
  component: QuizPage,
});

function QuizPage() {
  const nav = useNavigate();
  const [session, setSession] = useState(() => loadSession());
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(session?.mode.time_limit_seconds ?? 60);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session) {
      nav({ to: "/" });
      return;
    }
  }, [session, nav]);

  useEffect(() => {
    if (!session) return;
    const end = session.startedAt + session.mode.time_limit_seconds * 1000;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimeLeft(remain);
      if (remain <= 0) {
        submit();
      }
    };
    tick();
    tickRef.current = window.setInterval(tick, 250);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;
  const q = session.questions[index];

  const answer = (letter: string) => {
    const answers = session.answers.slice();
    answers[index] = letter;
    const updated = { ...session, answers };
    setSession(updated);
    saveSession(updated);
    setTimeout(() => {
      if (index + 1 >= session.questions.length) {
        submitWith(updated);
      } else {
        setIndex(index + 1);
      }
    }, 180);
  };

  const submit = () => submitWith(session);
  const submitWith = (s: typeof session) => {
    if (!s) return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    const finished = { ...s, submittedAt: Date.now() };
    saveSession(finished);
    nav({ to: "/result" });
  };

  const percent = Math.round(((index) / session.questions.length) * 100);
  const lowTime = timeLeft <= 10;

  return (
    <div className="min-h-screen flex flex-col px-5 pt-5 pb-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          Question {index + 1} / {session.questions.length}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${lowTime ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          ⏱ {timeLeft}s
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-6 rounded-3xl bg-card border p-5 shadow-sm">
        <div className="text-lg font-semibold leading-snug">{q.question_en}</div>
        {q.question_kn && <div className="mt-2 text-base text-muted-foreground leading-snug">{q.question_kn}</div>}
      </div>

      <div className="mt-4 space-y-3">
        {(["A", "B", "C", "D"] as const).map((letter) => {
          const en = (q as any)[`option_${letter.toLowerCase()}_en`];
          const kn = (q as any)[`option_${letter.toLowerCase()}_kn`];
          return (
            <button
              key={letter}
              onClick={() => answer(letter)}
              className="w-full text-left rounded-2xl border-2 border-border bg-card p-4 active:scale-[.99] active:border-primary transition"
            >
              <div className="flex gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-secondary text-secondary-foreground font-bold flex items-center justify-center">{letter}</div>
                <div>
                  <div className="font-semibold">{en}</div>
                  {kn && <div className="text-sm text-muted-foreground mt-0.5">{kn}</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
