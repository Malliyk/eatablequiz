import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getSampleInfo, startSampleQuiz } from "@/lib/eatable.functions";
import { loadLang, loadTeam, saveSession, shuffleOptionOrders } from "@/lib/eatable-session";

export const Route = createFileRoute("/sample")({
  component: SamplePage,
  head: () => ({
    meta: [
      { title: "Practice Round | EATABLE Quiz" },
      { name: "description", content: "Try a short practice round to see exactly how the EATABLE quiz works before you play for a reward." },
      { property: "og:title", content: "Practice Round | EATABLE Quiz" },
      { property: "og:description", content: "A short practice round that shows how the EATABLE quiz works." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SamplePage() {
  const nav = useNavigate();
  const lang = typeof window !== "undefined" ? loadLang() : "en";
  const kn = lang === "kn";
  const { data, isLoading } = useQuery({ queryKey: ["sample-info"], queryFn: () => getSampleInfo() });
  const config: any = data?.config;

  const start = useMutation({
    mutationFn: () => startSampleQuiz(),
    onSuccess: (res: any) => {
      saveSession({
        teamName: loadTeam() || (kn ? "ಅಭ್ಯಾಸ" : "Practice"),
        lang,
        mode: res.mode,
        questions: res.questions,
        answers: new Array(res.questions.length).fill(null),
        optionOrders: shuffleOptionOrders(res.questions.length),
        startedAt: Date.now(),
        isSample: true,
      });
      nav({ to: "/quiz" });
    },
    onError: (e: any) => alert(e?.message || "Could not start the practice round"),
  });

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">{kn ? "ಲೋಡ್ ಆಗುತ್ತಿದೆ…" : "Loading…"}</div>;

  const available = data?.availableQuestions ?? 0;
  const unavailable = !config?.enabled || available === 0;

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} className="text-2xl">←</button>
        <div className="text-lg font-bold">{kn ? "ಅಭ್ಯಾಸ ಸುತ್ತು" : "Practice Round"}</div>
      </div>

      <div className="mt-6 rounded-3xl bg-card border p-5">
        <div className="text-4xl">🧪</div>
        <p className="mt-3 text-sm text-muted-foreground">
          {kn ? (config?.intro_text_kn || "") : (config?.intro_text_en || "")}
        </p>
      </div>

      {unavailable ? (
        <div className="mt-6 rounded-2xl bg-secondary text-secondary-foreground p-4 text-sm">
          {kn ? "ಅಭ್ಯಾಸ ಸುತ್ತು ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ." : "The practice round is not available right now."}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Info label={kn ? "ಪ್ರಶ್ನೆಗಳು" : "Questions"} value={String(Math.min(config.num_questions, available))} />
            <Info label={kn ? "ಸಮಯ ಮಿತಿ" : "Time Limit"} value={`${config.time_limit_seconds}s`} />
            <Info label={kn ? "ಗೆಲ್ಲಲು" : "To Pass"} value={`${config.correct_to_win} ${kn ? "ಸರಿ" : "correct"}`} />
            <Info label={kn ? "ಬಹುಮಾನ" : "Reward"} value={config.reward_text} />
          </div>

          <div className="mt-auto pt-8">
            <button
              onClick={() => start.mutate()}
              disabled={start.isPending}
              className="w-full rounded-2xl bg-primary text-primary-foreground font-bold text-lg py-4 shadow-md active:scale-[.98] transition disabled:opacity-60"
            >
              {start.isPending ? (kn ? "ಲೋಡ್ ಆಗುತ್ತಿದೆ…" : "Loading…") : kn ? "ಅಭ್ಯಾಸ ಪ್ರಾರಂಭಿಸಿ" : "Start Practice Round"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}
