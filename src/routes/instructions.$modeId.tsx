import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getPublicConfig, getQuizQuestions } from "@/lib/eatable.functions";
import { loadTeam, saveSession } from "@/lib/eatable-session";
import { useState } from "react";

export const Route = createFileRoute("/instructions/$modeId")({
  component: InstructionsPage,
});

function InstructionsPage() {
  const { modeId } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ["public-config"], queryFn: () => getPublicConfig() });
  const mode = (data?.modes ?? []).find((m: any) => m.id === modeId);
  const [starting, setStarting] = useState(false);

  const startMut = useMutation({
    mutationFn: () => getQuizQuestions({ data: { modeId } }),
    onSuccess: (res) => {
      const team = loadTeam();
      saveSession({
        teamName: team,
        mode: res.mode,
        questions: res.questions,
        answers: new Array(res.questions.length).fill(null),
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

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/modes" })} className="text-2xl">←</button>
        <div className="text-lg font-bold">Quiz Info</div>
      </div>

      <div className="mt-4 rounded-3xl bg-card border p-5 space-y-2 shadow-sm">
        <Row icon="👥" label="Player Mode" value={`${mode.players} Player${mode.players > 1 ? "s" : ""}`} />
        <Row icon="❓" label="Total Questions" value={String(mode.num_questions)} />
        <Row icon="⏱" label="Time Limit" value={`${mode.time_limit_seconds}s`} />
        <Row icon="🏆" label="To Win" value={`${mode.correct_to_win} correct`} />
        <Row icon="🎁" label="Reward" value={mode.reward_text} />
      </div>

      <div className="mt-5 rounded-3xl bg-secondary p-5">
        <div className="font-bold text-sm">Rules</div>
        <ul className="mt-2 text-sm space-y-1 list-disc pl-5 text-secondary-foreground">
          <li>Read each question carefully.</li>
          <li>Each question has only one correct answer.</li>
          <li>Once you move on, you cannot return.</li>
          <li>You cannot change an answer after submitting.</li>
          <li>Timer starts when you press Start Quiz.</li>
          <li>Quiz auto-submits when time runs out.</li>
          <li>Results appear immediately.</li>
        </ul>
      </div>

      <div className="mt-5 rounded-3xl bg-accent p-5">
        <div className="font-bold text-sm">ನಿಯಮಗಳು</div>
        <ul className="mt-2 text-sm space-y-1 list-disc pl-5 text-accent-foreground">
          <li>ಪ್ರತಿ ಪ್ರಶ್ನೆಯನ್ನು ಗಮನದಿಂದ ಓದಿ.</li>
          <li>ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಒಂದೇ ಸರಿಯಾದ ಉತ್ತರ ಇರುತ್ತದೆ.</li>
          <li>ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋದ ನಂತರ ಹಿಂದಿರುಗಲು ಸಾಧ್ಯವಿಲ್ಲ.</li>
          <li>ಒಮ್ಮೆ ಉತ್ತರ ಸಲ್ಲಿಸಿದ ನಂತರ ಬದಲಾಯಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.</li>
          <li>Start Quiz ಒತ್ತಿದ ನಂತರ ಸಮಯ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.</li>
          <li>ಸಮಯ ಮುಗಿದರೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಲಾಗುತ್ತದೆ.</li>
          <li>ಫಲಿತಾಂಶ ತಕ್ಷಣ ತೋರಿಸಲಾಗುತ್ತದೆ.</li>
        </ul>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => { setStarting(true); startMut.mutate(); }}
          disabled={starting}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-bold text-xl py-5 shadow-lg active:scale-[.98] transition disabled:opacity-60"
        >
          {starting ? "Loading…" : "Start Quiz"}
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
