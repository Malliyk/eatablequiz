import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadSession } from "@/lib/eatable-session";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
});

function ReviewPage() {
  const nav = useNavigate();
  const [session] = useState(() => loadSession());
  useEffect(() => { if (!session) nav({ to: "/" }); }, [session, nav]);
  if (!session) return null;

  return (
    <div className="min-h-screen px-5 pt-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/result" })} className="text-2xl">←</button>
        <div className="text-lg font-bold">Review Answers</div>
      </div>

      <div className="mt-5 space-y-4">
        {session.questions.map((q, i) => {
          const chosen = session.answers[i];
          return (
            <div key={q.id} className="rounded-3xl bg-card border-2 p-4 shadow-sm">
              <div className="text-xs text-muted-foreground">Question {i + 1}</div>
              <div className="mt-1 font-semibold">{q.question_en}</div>
              {q.question_kn && <div className="text-sm text-muted-foreground">{q.question_kn}</div>}
              <div className="mt-3 space-y-2">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const en = (q as any)[`option_${letter.toLowerCase()}_en`];
                  const isCorrect = q.correct_answer === letter;
                  const isChosen = chosen === letter;
                  const wrongPick = isChosen && !isCorrect;
                  const border = isCorrect
                    ? "border-success bg-success/10"
                    : wrongPick
                    ? "border-destructive bg-destructive/10"
                    : "border-border";
                  return (
                    <div key={letter} className={`rounded-xl border-2 px-3 py-2 flex items-center gap-2 ${border}`}>
                      <div className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">{letter}</div>
                      <div className="flex-1 text-sm">{en}</div>
                      {isCorrect && <span className="text-success font-black">✓</span>}
                      {wrongPick && <span className="text-destructive font-black">✕</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
