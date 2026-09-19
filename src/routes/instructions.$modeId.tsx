import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getPublicConfig, getQuizQuestions } from "@/lib/eatable.functions";
import { loadLang, loadTeam, saveSession, shuffleOptionOrders } from "@/lib/eatable-session";
import { useState } from "react";

export const Route = createFileRoute("/instructions/$modeId")({
  component: InstructionsPage,
  head: () => ({
    meta: [
      { title: "Quiz Rules & Rewards | EATABLE" },
      { name: "description", content: "Review the quiz rules, timing and reward before you start playing at the EATABLE cart." },
      { property: "og:title", content: "Quiz Rules & Rewards | EATABLE" },
      { property: "og:description", content: "Rules, timing and reward details for the EATABLE quiz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function InstructionsPage() {
  const { modeId } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ["public-config"], queryFn: () => getPublicConfig() });
  const mode = (data?.modes ?? []).find((m: any) => m.id === modeId);
  const [starting, setStarting] = useState(false);
  const lang = typeof window !== "undefined" ? loadLang() : "en";
  const kn = lang === "kn";

  const startMut = useMutation({
    mutationFn: () => getQuizQuestions({ data: { modeId } }),
    onSuccess: (res) => {
      const team = loadTeam();
      saveSession({
        teamName: team,
        lang,
        mode: res.mode,
        questions: res.questions,
        answers: new Array(res.questions.length).fill(null),
        optionOrders: shuffleOptionOrders(res.questions.length),
        startedAt: Date.now(),
      });
      nav({ to: "/quiz" });
    },
    onError: (e: any) => {
      setStarting(false);
      alert(e?.message || "Could not start quiz");
    },
  });

  if (!mode) {
    return <div className="p-6 text-center text-muted-foreground">Loading…</div>;
  }

  const t = kn
    ? {
        title: "ಕ್ವಿಜ್ ಮಾಹಿತಿ",
        players: "ಆಟಗಾರರು",
        questions: "ಒಟ್ಟು ಪ್ರಶ್ನೆಗಳು",
        time: "ಸಮಯ ಮಿತಿ",
        win: "ಗೆಲ್ಲಲು",
        reward: "ಬಹುಮಾನ",
        rules: "ನಿಯಮಗಳು",
        start: "ಕ್ವಿಜ್ ಪ್ರಾರಂಭಿಸಿ",
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
        correct: "ಸರಿ",
      }
    : {
        title: "Quiz Info",
        players: "Player Mode",
        questions: "Total Questions",
        time: "Time Limit",
        win: "To Win",
        reward: "Reward",
        rules: "Rules",
        start: "Start Quiz",
        loading: "Loading…",
        correct: "correct",
      };

  const rules = kn
    ? [
        "ಪ್ರತಿ ಪ್ರಶ್ನೆಯನ್ನು ಗಮನದಿಂದ ಓದಿ.",
        "ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಒಂದೇ ಸರಿಯಾದ ಉತ್ತರ ಇರುತ್ತದೆ.",
        "ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋದ ನಂತರ ಹಿಂದಿರುಗಲು ಸಾಧ್ಯವಿಲ್ಲ.",
        "ಒಮ್ಮೆ ಉತ್ತರ ಸಲ್ಲಿಸಿದ ನಂತರ ಬದಲಾಯಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
        "ಪ್ರಾರಂಭ ಒತ್ತಿದ ನಂತರ ಸಮಯ ಶುರುವಾಗುತ್ತದೆ.",
        "ಸಮಯ ಮುಗಿದರೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಲಾಗುತ್ತದೆ.",
        "ಫಲಿತಾಂಶ ತಕ್ಷಣ ತೋರಿಸಲಾಗುತ್ತದೆ.",
      ]
    : [
        "Read each question carefully.",
        "Each question has only one correct answer.",
        "Once you move on, you cannot return.",
        "You cannot change an answer after submitting.",
        "Timer starts when you press Start Quiz.",
        "Quiz auto-submits when time runs out.",
        "Results appear immediately.",
      ];

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/modes" })} className="text-2xl">←</button>
        <div className="text-lg font-bold">{t.title}</div>
      </div>

      <div className="mt-4 rounded-3xl bg-card border p-5 space-y-2 shadow-sm">
        <Row icon="👥" label={t.players} value={String(mode.players)} />
        <Row icon="❓" label={t.questions} value={String(mode.num_questions)} />
        <Row icon="⏱" label={t.time} value={`${mode.time_limit_seconds}s`} />
        <Row icon="🏆" label={t.win} value={`${mode.correct_to_win} ${t.correct}`} />
        <Row icon="🎁" label={t.reward} value={mode.reward_text} />
      </div>

      <div className="mt-5 rounded-3xl bg-secondary p-5">
        <div className="font-bold text-sm">{t.rules}</div>
        <ul className="mt-2 text-sm space-y-1 list-disc pl-5 text-secondary-foreground">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => { setStarting(true); startMut.mutate(); }}
          disabled={starting}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-bold text-xl py-5 shadow-lg active:scale-[.98] transition disabled:opacity-60"
        >
          {starting ? t.loading : t.start}
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-lg">{icon}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="font-bold text-sm text-right">{value}</div>
    </div>
  );
}
