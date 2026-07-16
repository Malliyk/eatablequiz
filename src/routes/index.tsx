import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicConfig } from "@/lib/eatable.functions";
import { saveTeam, loadTeam } from "@/lib/eatable-session";

export const Route = createFileRoute("/")({
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [team, setTeam] = useState(loadTeam());
  const [pressStart, setPressStart] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ["public-config"],
    queryFn: () => getPublicConfig(),
  });
  const business = data?.settings?.business_name ?? "EATABLE";
  const quizEnabled = data?.settings?.quiz_enabled ?? true;

  const onContinue = () => {
    const t = team.trim();
    if (!t) return;
    saveTeam(t);
    nav({ to: "/modes" });
  };

  // Long-press profile icon to open owner
  const onDown = () => setPressStart(Date.now());
  const onUp = () => {
    if (pressStart && Date.now() - pressStart > 800) nav({ to: "/owner" });
    setPressStart(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="text-2xl font-black tracking-tight text-primary">{business}</div>
        <button
          aria-label="Profile"
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={() => setPressStart(null)}
          className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg select-none"
        >
          👤
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-3xl font-black text-foreground">Welcome!</h1>
        <p className="mt-2 text-muted-foreground">
          Play a quick quiz. Win a treat.
        </p>

        {!quizEnabled ? (
          <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-6 shadow-sm border">
            <div className="text-lg font-semibold">Quiz is currently closed</div>
            <div className="text-sm text-muted-foreground mt-1">Please come back later.</div>
          </div>
        ) : (
          <div className="mt-8 w-full max-w-md space-y-4">
            <label className="block text-left text-sm font-semibold">Team Name</label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Enter your team name"
              className="w-full rounded-2xl border-2 border-input bg-card px-5 py-4 text-lg outline-none focus:border-primary"
              autoFocus
            />
            <button
              onClick={onContinue}
              disabled={!team.trim()}
              className="w-full rounded-2xl bg-primary text-primary-foreground font-bold text-lg py-4 shadow-md active:scale-[.98] transition disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-muted-foreground">
        {business} • Powered by EATABLE
      </footer>
    </div>
  );
}
