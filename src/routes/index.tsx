import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getPublicConfig, getSampleInfo } from "@/lib/eatable.functions";
import { saveTeam, loadTeam, saveLang, loadLang, lastPlayedAt, type QuizLang } from "@/lib/eatable-session";

export const Route = createFileRoute("/")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "EATABLE Quiz — Play & Win a Free Treat" },
      { name: "description", content: "Play a quick bilingual quiz on your phone at the EATABLE cart and win a free treat." },
      { property: "og:title", content: "EATABLE Quiz — Play & Win a Free Treat" },
      { property: "og:description", content: "Play a quick bilingual quiz on your phone and win a free treat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function RegisterPage() {
  const nav = useNavigate();
  const [team, setTeam] = useState(loadTeam());
  const [lang, setLang] = useState<QuizLang | null>(null);
  const [pressStart, setPressStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const { data } = useQuery({
    queryKey: ["public-config"],
    queryFn: () => getPublicConfig(),
  });
  const sample = useQuery({ queryKey: ["sample-info"], queryFn: () => getSampleInfo() });
  const sampleReady = !!(sample.data?.config as any)?.enabled && (sample.data?.availableQuestions ?? 0) > 0;
  const business = data?.settings?.business_name ?? "EATABLE";
  const quizEnabled = data?.settings?.quiz_enabled ?? true;
  const cooldownMin = (data?.settings as any)?.retake_cooldown_minutes ?? 0;

  useEffect(() => {
    setLang(loadLang());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const last = typeof window !== "undefined" ? lastPlayedAt() : null;
  const waitMs = last && cooldownMin > 0 ? last + cooldownMin * 60000 - now : 0;
  const locked = waitMs > 0;
  const waitLabel = (() => {
    const s = Math.ceil(waitMs / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m} min ${s % 60}s` : `${s}s`;
  })();

  const onContinue = () => {
    const t = team.trim();
    if (!t || !lang || locked) return;
    saveTeam(t);
    saveLang(lang);
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
            {locked && (
              <div className="rounded-2xl bg-secondary text-secondary-foreground p-4 text-sm">
                <div className="font-bold">You have already played</div>
                <div className="mt-1">Please wait {waitLabel} before playing again.</div>
              </div>
            )}
            <label className="block text-left text-sm font-semibold">Team Name</label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Enter your team name"
              className="w-full rounded-2xl border-2 border-input bg-card px-5 py-4 text-lg outline-none focus:border-primary"
            />

            <div className="text-left">
              <div className="text-sm font-semibold mb-2">Choose Quiz Language / ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ</div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "en" as const, title: "English", sub: "Play in English" },
                  { id: "kn" as const, title: "ಕನ್ನಡ", sub: "ಕನ್ನಡದಲ್ಲಿ ಆಡಿ" },
                ]).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setLang(o.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      lang === o.id ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    <div className="font-bold">{o.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onContinue}
              disabled={!team.trim() || !lang || locked}
              className="w-full rounded-2xl bg-primary text-primary-foreground font-bold text-lg py-4 shadow-md active:scale-[.98] transition disabled:opacity-50"
            >
              {lang === "kn" ? "ಮುಂದುವರಿಸಿ" : "Continue"}
            </button>

            {sampleReady && (
              <button
                onClick={() => {
                  if (!lang) return;
                  saveLang(lang);
                  if (team.trim()) saveTeam(team.trim());
                  nav({ to: "/sample" });
                }}
                disabled={!lang}
                className="w-full rounded-2xl border-2 border-primary text-primary bg-card font-bold py-4 disabled:opacity-50"
              >
                {lang === "kn" ? "🧪 ಮೊದಲು ಅಭ್ಯಾಸ ಸುತ್ತು ಆಡಿ" : "🧪 Try a Sample Quiz First"}
              </button>
            )}
            {sampleReady && (
              <p className="text-xs text-muted-foreground text-center">
                {lang === "kn"
                  ? "ಅಭ್ಯಾಸ ಸುತ್ತಿಗೆ ಬಹುಮಾನ ಇಲ್ಲ ಮತ್ತು ಕಾಯುವ ಸಮಯ ಅನ್ವಯಿಸುವುದಿಲ್ಲ."
                  : "The practice round has no reward and does not use up your turn."}
              </p>
            )}
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-muted-foreground">
        {business} • Powered by EATABLE
      </footer>
    </div>
  );
}
