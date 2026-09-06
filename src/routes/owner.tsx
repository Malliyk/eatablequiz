import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  deleteMode, getOwnerData, saveSettings, upsertMode, uploadQuestions, verifyOwner,
  getSampleOwnerData, saveSampleConfig, upsertSampleQuestion, deleteSampleQuestion, uploadSampleQuestions,
} from "@/lib/eatable.functions";
import { parseCSV } from "@/lib/csv";

const PW_KEY = "eatable-owner-pw";

export const Route = createFileRoute("/owner")({ component: OwnerPage });

function OwnerPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState<string>(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(PW_KEY) || "",
  );
  const [tab, setTab] = useState<"settings" | "modes" | "questions" | "sample">("settings");
  const qc = useQueryClient();

  const verify = useMutation({
    mutationFn: (pw: string) => verifyOwner({ data: { password: pw } }),
    onSuccess: (res, pw) => {
      if (res.ok) {
        sessionStorage.setItem(PW_KEY, pw);
        setPassword(pw);
      } else {
        alert("Wrong password");
      }
    },
  });

  const owner = useQuery({
    queryKey: ["owner-data"],
    queryFn: () => getOwnerData({ data: { password } }),
    enabled: !!password,
  });

  useEffect(() => {
    if (owner.error) {
      sessionStorage.removeItem(PW_KEY);
      setPassword("");
    }
  }, [owner.error]);

  if (!password) return <PasswordGate onSubmit={(pw) => verify.mutate(pw)} pending={verify.isPending} onBack={() => nav({ to: "/" })} />;

  if (owner.isLoading) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;
  if (!owner.data) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-5 pt-4 pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Owner Console</div>
            <div className="text-lg font-black">EATABLE</div>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(PW_KEY); setPassword(""); nav({ to: "/" }); }}
            className="text-sm text-muted-foreground underline"
          >Log out</button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(["settings", "modes", "questions", "sample"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full py-2 text-xs font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 pt-5">
        {tab === "settings" && <SettingsTab password={password} settings={owner.data.settings} onSaved={() => qc.invalidateQueries()} />}
        {tab === "modes" && <ModesTab password={password} modes={owner.data.modes} onChanged={() => qc.invalidateQueries()} />}
        {tab === "sample" && <SampleTab password={password} />}
        {tab === "questions" && <QuestionsTab password={password} count={owner.data.questionCount} onDone={() => qc.invalidateQueries()} />}
      </div>
    </div>
  );
}

function PasswordGate({ onSubmit, pending, onBack }: { onSubmit: (pw: string) => void; pending: boolean; onBack: () => void }) {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="text-sm text-muted-foreground">← Back</button>
        <h1 className="mt-2 text-2xl font-black">Owner Access</h1>
        <p className="text-sm text-muted-foreground">Enter password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="mt-4 w-full rounded-2xl border-2 border-input bg-card px-5 py-4 text-lg outline-none focus:border-primary"
          autoFocus
        />
        <button
          onClick={() => onSubmit(pw)}
          disabled={!pw || pending}
          className="mt-3 w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 disabled:opacity-60"
        >
          {pending ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

function SettingsTab({ password, settings, onSaved }: { password: string; settings: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    business_name: settings.business_name ?? "",
    item_name: settings.item_name ?? "",
    item_price: settings.item_price ?? "",
    reward_text: settings.reward_text ?? "",
    quiz_enabled: !!settings.quiz_enabled,
    retake_cooldown_minutes: Number(settings.retake_cooldown_minutes ?? 30),
  });
  const save = useMutation({
    mutationFn: () => saveSettings({ data: { password, ...form } }),
    onSuccess: () => {
      alert("Saved.");
      onSaved();
    },
    onError: (e: any) => alert(e?.message || "Save failed"),
  });

  return (
    <div className="space-y-4">
      <Field label="Business Name" value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} />
      <Field label="Item Name" value={form.item_name} onChange={(v) => setForm({ ...form, item_name: v })} />
      <Field label="Item Price" value={form.item_price} onChange={(v) => setForm({ ...form, item_price: v })} />
      <Field label="Default Reward Text" value={form.reward_text} onChange={(v) => setForm({ ...form, reward_text: v })} />
      <div className="rounded-2xl bg-card border p-4 space-y-2">
        <div className="font-bold">⏳ Retake Wait Time</div>
        <div className="text-xs text-muted-foreground">
          How many minutes the same player must wait before taking the quiz again. Set 0 to allow unlimited retakes.
        </div>
        <Field
          label="Minutes"
          type="number"
          value={String(form.retake_cooldown_minutes)}
          onChange={(v) => setForm({ ...form, retake_cooldown_minutes: Math.max(0, Math.min(1440, Number(v) || 0)) })}
        />
      </div>
      <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border">
        <input type="checkbox" checked={form.quiz_enabled} onChange={(e) => setForm({ ...form, quiz_enabled: e.target.checked })} className="h-5 w-5" />
        <span className="font-semibold">Quiz Enabled</span>
      </label>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4">
        {save.isPending ? "Saving…" : "Save Settings"}
      </button>

      <ChangePasswordCard password={password} settings={settings} />
    </div>
  );
}

function ChangePasswordCard({ password, settings }: { password: string; settings: any }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const change = useMutation({
    mutationFn: async () => {
      if (current !== password) throw new Error("Current password is incorrect");
      if (next.length < 4) throw new Error("New password must be at least 4 characters");
      if (next !== confirmPw) throw new Error("New passwords do not match");
      return saveSettings({
        data: {
          password: current,
          business_name: settings.business_name ?? "",
          item_name: settings.item_name ?? "",
          item_price: settings.item_price ?? "",
          reward_text: settings.reward_text ?? "",
          quiz_enabled: !!settings.quiz_enabled,
          retake_cooldown_minutes: Number(settings.retake_cooldown_minutes ?? 30),
          new_password: next,
        },
      });
    },
    onSuccess: () => {
      alert("Password changed. Please log in again.");
      sessionStorage.removeItem(PW_KEY);
      window.location.reload();
    },
    onError: (e: any) => alert(e?.message || "Failed to change password"),
  });

  return (
    <div className="rounded-2xl bg-card border p-4 space-y-3 mt-6">
      <div className="font-bold text-lg">🔒 Change Password</div>
      <div className="text-xs text-muted-foreground">Update your owner console password anytime.</div>
      <Field label="Current Password" value={current} onChange={setCurrent} type="password" placeholder="Enter current password" />
      <Field label="New Password" value={next} onChange={setNext} type="password" placeholder="At least 4 characters" />
      <Field label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Re-enter new password" />
      <button
        onClick={() => change.mutate()}
        disabled={!current || !next || !confirmPw || change.isPending}
        className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 disabled:opacity-60"
      >
        {change.isPending ? "Updating…" : "Update Password"}
      </button>
    </div>
  );
}


function ModesTab({ password, modes, onChanged }: { password: string; modes: any[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);
  return (
    <div className="space-y-4">
      {modes.map((m) => (
        <div key={m.id} className="rounded-2xl bg-card border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-black">{m.players} Player{m.players > 1 ? "s" : ""}</div>
              <div className="text-xs text-muted-foreground">
                {m.num_questions} Qs · E{m.easy_count}/M{m.moderate_count}/D{m.difficult_count} · {m.time_limit_seconds}s · Win {m.correct_to_win}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">🎁 {m.reward_text}</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${m.enabled ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
              {m.enabled ? "On" : "Off"}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setEditing(m)} className="flex-1 rounded-xl bg-secondary text-secondary-foreground py-2 text-sm font-semibold">Edit</button>
            <button
              onClick={async () => {
                if (!confirm("Delete this mode?")) return;
                await deleteMode({ data: { password, id: m.id } });
                onChanged();
              }}
              className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold"
            >Delete</button>
          </div>
        </div>
      ))}
      <button
        onClick={() => setEditing({ players: 4, enabled: true, num_questions: 6, easy_count: 1, moderate_count: 3, difficult_count: 2, time_limit_seconds: 90, correct_to_win: 4, reward_text: "Free Churumuri", sort_order: modes.length + 1 })}
        className="w-full rounded-2xl border-2 border-dashed border-primary text-primary font-bold py-4"
      >+ Add Player Mode</button>

      {editing && <ModeEditor password={password} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
    </div>
  );
}

function ModeEditor({ password, initial, onClose, onSaved }: any) {
  const [f, setF] = useState<any>(initial);
  const save = useMutation({
    mutationFn: () => upsertMode({ data: { password, ...f } }),
    onSuccess: onSaved,
    onError: (e: any) => alert(e?.message || "Failed"),
  });
  const num = (k: string) => (v: string) => setF({ ...f, [k]: Number(v) || 0 });
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-y-auto p-5">
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black">{initial.id ? "Edit Mode" : "New Mode"}</div>
          <button onClick={onClose} className="text-2xl">✕</button>
        </div>
        <Field label="Players" value={String(f.players)} onChange={num("players")} type="number" />
        <Field label="Total Questions" value={String(f.num_questions)} onChange={num("num_questions")} type="number" />
        <div className="grid grid-cols-3 gap-2">
          <Field label="Easy" value={String(f.easy_count)} onChange={num("easy_count")} type="number" />
          <Field label="Moderate" value={String(f.moderate_count)} onChange={num("moderate_count")} type="number" />
          <Field label="Difficult" value={String(f.difficult_count)} onChange={num("difficult_count")} type="number" />
        </div>
        <Field label="Time Limit (sec)" value={String(f.time_limit_seconds)} onChange={num("time_limit_seconds")} type="number" />
        <Field label="Correct to Win" value={String(f.correct_to_win)} onChange={num("correct_to_win")} type="number" />
        <Field label="Reward Text" value={f.reward_text} onChange={(v) => setF({ ...f, reward_text: v })} />
        <Field label="Sort Order" value={String(f.sort_order)} onChange={num("sort_order")} type="number" />
        <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border">
          <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} className="h-5 w-5" />
          <span className="font-semibold">Enabled</span>
        </label>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4">
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function QuestionsTab({ password, count, onDone }: { password: string; count: number; onDone: () => void }) {
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ total: number; sample: any[] } | null>(null);
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a CSV file");
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV is empty");
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const col = (name: string) => header.indexOf(name.toLowerCase());
      const need = [
        "question_en", "option_a_en", "option_b_en", "option_c_en", "option_d_en", "correct_answer", "difficulty",
      ];
      for (const n of need) if (col(n) < 0) throw new Error(`Missing column: ${n}`);
      const items = rows.slice(1).map((r) => ({
        question_code: r[col("question_id")] ?? null,
        subject: r[col("subject")] ?? null,
        topic: r[col("topic")] ?? null,
        difficulty: (r[col("difficulty")] || "Moderate").trim(),
        question_en: r[col("question_en")],
        question_kn: r[col("question_kn")] ?? null,
        option_a_en: r[col("option_a_en")], option_a_kn: r[col("option_a_kn")] ?? null,
        option_b_en: r[col("option_b_en")], option_b_kn: r[col("option_b_kn")] ?? null,
        option_c_en: r[col("option_c_en")], option_c_kn: r[col("option_c_kn")] ?? null,
        option_d_en: r[col("option_d_en")], option_d_kn: r[col("option_d_kn")] ?? null,
        correct_answer: (r[col("correct_answer")] || "").trim().toUpperCase().slice(0, 1),
        active: col("active") >= 0 ? String(r[col("active")]).trim() !== "0" : true,
      })).filter((x) => x.question_en && ["A","B","C","D"].includes(x.correct_answer));
      return uploadQuestions({ data: { password, mode, rows: items } });
    },
    onSuccess: (res) => {
      alert(`Uploaded ${res.inserted} questions.`);
      setFile(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      onDone();
    },
    onError: (e: any) => setError(e?.message || "Upload failed"),
  });

  const onPick = async (f: File | null) => {
    setError(""); setFile(f); setPreview(null);
    if (!f) return;
    const text = await f.text();
    const rows = parseCSV(text);
    setPreview({ total: rows.length - 1, sample: rows.slice(1, 3) });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border p-4">
        <div className="text-sm text-muted-foreground">Current Questions</div>
        <div className="text-3xl font-black text-primary">{count}</div>
      </div>

      <div className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="font-bold">Upload CSV</div>
        <div className="text-xs text-muted-foreground">
          Expected columns: Question_ID, Subject, Topic, Difficulty, Question_EN, Question_KN,
          Option_A_EN, Option_A_KN, Option_B_EN, Option_B_KN, Option_C_EN, Option_C_KN,
          Option_D_EN, Option_D_KN, Correct_Answer, Active
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["replace", "append"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 text-sm font-semibold capitalize ${mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {m === "replace" ? "Replace all" : "Append"}
            </button>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {preview && (
          <div className="text-xs text-muted-foreground">
            Detected {preview.total} rows. Ready to upload.
          </div>
        )}
        {error && <div className="text-sm text-destructive">{error}</div>}
        <button
          onClick={() => upload.mutate()}
          disabled={!file || upload.isPending}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 disabled:opacity-60"
        >
          {upload.isPending ? "Uploading…" : mode === "replace" ? "Replace Questions" : "Append Questions"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );
}

function SampleTab({ password }: { password: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["sample-owner"],
    queryFn: () => getSampleOwnerData({ data: { password } }),
  });
  const [editing, setEditing] = useState<any | null>(null);

  if (q.isLoading || !q.data) return <div className="text-center text-muted-foreground">Loading…</div>;
  const questions = q.data.questions ?? [];
  const refresh = () => qc.invalidateQueries();

  return (
    <div className="space-y-5">
      <SampleConfigCard password={password} config={q.data.config} onSaved={refresh} />

      <div className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-bold">🧪 Sample Questions</div>
          <div className="text-xs text-muted-foreground">{questions.length} total</div>
        </div>
        {questions.length === 0 && (
          <div className="text-xs text-muted-foreground">No sample questions yet. Add one below.</div>
        )}
        {questions.map((sq: any) => (
          <div key={sq.id} className="rounded-xl border p-3">
            <div className="text-sm font-semibold">{sq.question_en}</div>
            <div className="text-xs text-muted-foreground mt-1">
              #{sq.sort_order} · {sq.difficulty} · Answer {sq.correct_answer} · {sq.active ? "Active" : "Off"}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setEditing(sq)} className="flex-1 rounded-lg bg-secondary text-secondary-foreground py-2 text-xs font-semibold">Edit</button>
              <button
                onClick={async () => {
                  if (!confirm("Delete this sample question?")) return;
                  await deleteSampleQuestion({ data: { password, id: sq.id } });
                  refresh();
                }}
                className="rounded-lg bg-destructive text-destructive-foreground px-3 py-2 text-xs font-semibold"
              >Delete</button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setEditing({
            question_code: "", subject: "", topic: "", difficulty: "Easy",
            question_en: "", question_kn: "", 
            option_a_en: "", option_a_kn: "", option_b_en: "", option_b_kn: "",
            option_c_en: "", option_c_kn: "", option_d_en: "", option_d_kn: "",
            correct_answer: "A", active: true, sort_order: questions.length + 1,
          })}
          className="w-full rounded-2xl border-2 border-dashed border-primary text-primary font-bold py-3"
        >+ Add Sample Question</button>
      </div>

      <SampleCsvCard password={password} onDone={refresh} />

      {editing && (
        <SampleQuestionEditor
          password={password}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

function SampleConfigCard({ password, config, onSaved }: { password: string; config: any; onSaved: () => void }) {
  const [f, setF] = useState({
    enabled: !!config?.enabled,
    num_questions: Number(config?.num_questions ?? 3),
    time_limit_seconds: Number(config?.time_limit_seconds ?? 60),
    correct_to_win: Number(config?.correct_to_win ?? 2),
    reward_text: config?.reward_text ?? "",
    intro_text_en: config?.intro_text_en ?? "",
    intro_text_kn: config?.intro_text_kn ?? "",
  });
  const save = useMutation({
    mutationFn: () => saveSampleConfig({ data: { password, ...f } }),
    onSuccess: () => { alert("Sample quiz settings saved."); onSaved(); },
    onError: (e: any) => alert(e?.message || "Save failed"),
  });
  const num = (k: keyof typeof f, max: number) => (v: string) =>
    setF({ ...f, [k]: Math.max(0, Math.min(max, Number(v) || 0)) });

  return (
    <div className="rounded-2xl bg-card border p-4 space-y-3">
      <div className="font-bold text-lg">🧪 Sample Quiz Setup</div>
      <div className="text-xs text-muted-foreground">
        A short practice round first-time players can try before the real quiz. It never gives a real reward
        and never uses up their retake wait time.
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
        <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} className="h-5 w-5" />
        <span className="font-semibold text-sm">Show sample quiz to users</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Questions Shown" type="number" value={String(f.num_questions)} onChange={num("num_questions", 50)} />
        <Field label="Time Limit (sec)" type="number" value={String(f.time_limit_seconds)} onChange={num("time_limit_seconds", 3600)} />
      </div>
      <Field label="Correct Answers to Pass" type="number" value={String(f.correct_to_win)} onChange={num("correct_to_win", 50)} />
      <Field label="Sample Reward Text" value={f.reward_text} onChange={(v) => setF({ ...f, reward_text: v })} placeholder="e.g. Practice round — no reward" />
      <Field label="Intro Text (English)" value={f.intro_text_en} onChange={(v) => setF({ ...f, intro_text_en: v })} />
      <Field label="Intro Text (ಕನ್ನಡ)" value={f.intro_text_kn} onChange={(v) => setF({ ...f, intro_text_kn: v })} />
      <button onClick={() => save.mutate()} disabled={save.isPending} className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4">
        {save.isPending ? "Saving…" : "Save Sample Settings"}
      </button>
    </div>
  );
}

function SampleQuestionEditor({ password, initial, onClose, onSaved }: any) {
  const [f, setF] = useState<any>(initial);
  const save = useMutation({
    mutationFn: () => {
      const { id, created_at, ...row } = f;
      return upsertSampleQuestion({
        data: {
          password,
          ...(initial.id ? { id: initial.id } : {}),
          row: { ...row, correct_answer: String(row.correct_answer || "A").toUpperCase().slice(0, 1) },
        },
      });
    },
    onSuccess: onSaved,
    onError: (e: any) => alert(e?.message || "Failed"),
  });
  const set = (k: string) => (v: string) => setF({ ...f, [k]: v });

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-y-auto p-5">
      <div className="max-w-md mx-auto space-y-3 pb-10">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black">{initial.id ? "Edit Sample Question" : "New Sample Question"}</div>
          <button onClick={onClose} className="text-2xl">✕</button>
        </div>
        <Field label="Question (English)" value={f.question_en} onChange={set("question_en")} />
        <Field label="Question (ಕನ್ನಡ)" value={f.question_kn ?? ""} onChange={set("question_kn")} />
        {(["a", "b", "c", "d"] as const).map((L) => (
          <div key={L} className="grid grid-cols-2 gap-2">
            <Field label={`Option ${L.toUpperCase()} (EN)`} value={f[`option_${L}_en`] ?? ""} onChange={set(`option_${L}_en`)} />
            <Field label={`Option ${L.toUpperCase()} (KN)`} value={f[`option_${L}_kn`] ?? ""} onChange={set(`option_${L}_kn`)} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-sm font-semibold mb-1">Correct Answer</div>
            <select
              value={f.correct_answer}
              onChange={(e) => setF({ ...f, correct_answer: e.target.value })}
              className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 outline-none focus:border-primary"
            >
              {["A", "B", "C", "D"].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <Field label="Difficulty" value={f.difficulty ?? "Easy"} onChange={set("difficulty")} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Subject" value={f.subject ?? ""} onChange={set("subject")} />
          <Field label="Order" type="number" value={String(f.sort_order ?? 0)} onChange={(v) => setF({ ...f, sort_order: Number(v) || 0 })} />
        </div>
        <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border">
          <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-5 w-5" />
          <span className="font-semibold">Active</span>
        </label>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !f.question_en || !f.option_a_en || !f.option_b_en || !f.option_c_en || !f.option_d_en}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save Question"}
        </button>
      </div>
    </div>
  );
}

function SampleCsvCard({ password, onDone }: { password: string; onDone: () => void }) {
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a CSV file");
      const rows = parseCSV(await file.text());
      if (rows.length < 2) throw new Error("CSV is empty");
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const col = (n: string) => header.indexOf(n.toLowerCase());
      for (const n of ["question_en", "option_a_en", "option_b_en", "option_c_en", "option_d_en", "correct_answer"]) {
        if (col(n) < 0) throw new Error(`Missing column: ${n}`);
      }
      const items = rows.slice(1).map((r, i) => ({
        question_code: col("question_id") >= 0 ? r[col("question_id")] : null,
        subject: col("subject") >= 0 ? r[col("subject")] : null,
        topic: col("topic") >= 0 ? r[col("topic")] : null,
        difficulty: (col("difficulty") >= 0 ? r[col("difficulty")] : "Easy") || "Easy",
        question_en: r[col("question_en")],
        question_kn: col("question_kn") >= 0 ? r[col("question_kn")] : null,
        option_a_en: r[col("option_a_en")], option_a_kn: col("option_a_kn") >= 0 ? r[col("option_a_kn")] : null,
        option_b_en: r[col("option_b_en")], option_b_kn: col("option_b_kn") >= 0 ? r[col("option_b_kn")] : null,
        option_c_en: r[col("option_c_en")], option_c_kn: col("option_c_kn") >= 0 ? r[col("option_c_kn")] : null,
        option_d_en: r[col("option_d_en")], option_d_kn: col("option_d_kn") >= 0 ? r[col("option_d_kn")] : null,
        correct_answer: (r[col("correct_answer")] || "").trim().toUpperCase().slice(0, 1),
        active: true,
        sort_order: i + 1,
      })).filter((x) => x.question_en && ["A", "B", "C", "D"].includes(x.correct_answer));
      if (items.length === 0) throw new Error("No valid rows found");
      return uploadSampleQuestions({ data: { password, mode, rows: items } });
    },
    onSuccess: (res: any) => {
      alert(`Uploaded ${res.inserted} sample questions.`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onDone();
    },
    onError: (e: any) => setError(e?.message || "Upload failed"),
  });

  return (
    <div className="rounded-2xl bg-card border p-4 space-y-3">
      <div className="font-bold">Upload Sample Questions (CSV)</div>
      <div className="text-xs text-muted-foreground">
        Same columns as the main question bank: Question_EN, Question_KN, Option_A_EN … Option_D_KN, Correct_Answer, Difficulty.
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["replace", "append"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 text-sm font-semibold ${mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {m === "replace" ? "Replace all" : "Append"}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => { setError(""); setFile(e.target.files?.[0] ?? null); }} className="block w-full text-sm" />
      {error && <div className="text-sm text-destructive">{error}</div>}
      <button onClick={() => upload.mutate()} disabled={!file || upload.isPending} className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 disabled:opacity-60">
        {upload.isPending ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
