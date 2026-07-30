import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clearSession, loadSession } from "@/lib/eatable-session";

export const Route = createFileRoute("/result")({
  component: ResultPage,
});

function ResultPage() {
  const nav = useNavigate();
  const [session] = useState(() => loadSession());
  useEffect(() => {
    if (!session) nav({ to: "/" });
  }, [session, nav]);

  if (!session) return null;

  const result = session.result;
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-lg font-bold">We couldn't score this quiz.</div>
        <p className="text-sm text-muted-foreground">Please check your connection and play again.</p>
        <button
          onClick={() => { clearSession(); nav({ to: "/" }); }}
          className="rounded-2xl bg-primary text-primary-foreground font-bold px-6 py-3"
        >
          Start Over
        </button>
      </div>
    );
  }

  const correct = result.correct;
  const wrong = result.wrong;
  const pct = result.total ? Math.round((correct / result.total) * 100) : 0;
  const won = result.won;
  const timeTaken = Math.round(((session.submittedAt ?? Date.now()) - session.startedAt) / 1000);


  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-8">
      <div className={`rounded-3xl p-6 text-center ${won ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"}`}>
        <div className="text-5xl mb-2">{won ? "🎉" : "😊"}</div>
        <div className="text-2xl font-black">
          {won ? "Congratulations!" : "Better Luck Next Time"}
        </div>
        <div className="mt-1 text-sm opacity-90">Team: {session.teamName}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Correct" value={String(correct)} tone="success" />
        <Stat label="Wrong" value={String(wrong)} tone="destructive" />
        <Stat label="Score" value={`${correct}/${result.total}`} />
        <Stat label="Percentage" value={`${pct}%`} />
        <Stat label="Time Taken" value={`${timeTaken}s`} />
        <Stat label="Status" value={won ? "Winner" : "Try Again"} tone={won ? "success" : undefined} />
      </div>

      {won && (
        <div className="mt-5 rounded-3xl bg-primary text-primary-foreground p-6 text-center">
          <div className="text-sm uppercase tracking-wider opacity-90">Your Reward</div>
          <div className="text-2xl font-black mt-1">🎁 {session.mode.reward_text}</div>
          <div className="text-xs opacity-90 mt-2">Show this screen at the counter</div>
        </div>
      )}

      <div className="mt-auto pt-6 space-y-3">
        <button
          onClick={() => nav({ to: "/review" })}
          className="w-full rounded-2xl bg-card border-2 border-primary text-primary font-bold py-4"
        >
          Review Answers
        </button>
        <button
          onClick={() => { clearSession(); nav({ to: "/" }); }}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" }) {
  const cls =
    tone === "success"
      ? "bg-success text-success-foreground"
      : tone === "destructive"
      ? "bg-destructive text-destructive-foreground"
      : "bg-card border";
  return (
    <div className={`rounded-2xl p-4 ${cls}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}
