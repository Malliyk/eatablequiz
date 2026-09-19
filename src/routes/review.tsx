import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LETTERS, loadSession, optionOrderFor } from "@/lib/eatable-session";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
  head: () => ({
    meta: [
      { title: "Review Your Answers | EATABLE Quiz" },
      { name: "description", content: "See which quiz answers you got right and wrong after playing the EATABLE quiz." },
      { property: "og:title", content: "Review Your Answers | EATABLE Quiz" },
      { property: "og:description", content: "See which answers you got right and wrong." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ReviewPage() {
  const nav = useNavigate();
  const [session] = useState(() => loadSession());
  useEffect(() => { if (!session) nav({ to: "/" }); }, [session, nav]);
  if (!session) return null;

  const kn = session.lang === "kn";
  const text = (en: string | null, knText: string | null) => (kn ? (knText || en || "") : (en || ""));

  return (
    <div className="min-h-screen px-5 pt-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/result" })} className="text-2xl">←</button>
        <div className="text-lg font-bold">{kn ? "ಉತ್ತರಗಳ ಪರಿಶೀಲನೆ" : "Review Answers"}</div>
      </div>

      <div className="mt-5 space-y-4">
        {session.questions.map((q, i) => {
          const chosen = session.answers[i];
          // Correct answers come from the server's graded result only.
          const graded = session.result?.results.find((r) => r.id === q.id);
          const correctAnswer = graded?.correct_answer ?? null;
          const isRight = !!graded?.isCorrect;
          const skipped = !chosen;
          return (
            <div
              key={q.id}
              className={`rounded-3xl bg-card border-2 p-4 shadow-sm ${
                isRight ? "border-success" : "border-destructive"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {kn ? "ಪ್ರಶ್ನೆ" : "Question"} {i + 1}
                </div>
                <div
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isRight ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {isRight
                    ? kn ? "✓ ಸರಿ" : "✓ Correct"
                    : skipped
                    ? kn ? "✕ ಉತ್ತರಿಸಿಲ್ಲ" : "✕ Not answered"
                    : kn ? "✕ ತಪ್ಪು" : "✕ Wrong"}
                </div>
              </div>
              <div className="mt-1 font-semibold">{text(q.question_en, q.question_kn)}</div>
              <div className="mt-3 space-y-2">
                {LETTERS.map((letter, displayPos) => {
                  // Options were shown shuffled: this display position holds the
                  // original option at perm[displayPos]. The server's correct
                  // answer uses original letters, so compare against that.
                  const perm = optionOrderFor(session, i);
                  const origLetter = LETTERS[perm[displayPos]];
                  const en = (q as any)[`option_${origLetter.toLowerCase()}_en`];
                  const knOpt = (q as any)[`option_${origLetter.toLowerCase()}_kn`];
                  const isCorrect = correctAnswer === origLetter;
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
                      <div className="flex-1 text-sm">{text(en, knOpt)}</div>
                      {isCorrect && <span className="text-success font-black">✓</span>}
                      {wrongPick && <span className="text-destructive font-black">✕</span>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {kn ? "ನಿಮ್ಮ ಉತ್ತರ" : "Your answer"}: <span className="font-bold">{chosen ?? (kn ? "—" : "—")}</span>
                {"  ·  "}
                {kn ? "ಸರಿಯಾದ ಉತ್ತರ" : "Correct answer"}: <span className="font-bold">{correctAnswer ?? "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
