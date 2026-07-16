import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicConfig } from "@/lib/eatable.functions";
import { loadTeam } from "@/lib/eatable-session";
import { useEffect } from "react";

export const Route = createFileRoute("/modes")({
  component: ModesPage,
});

function ModesPage() {
  const nav = useNavigate();
  const team = typeof window !== "undefined" ? loadTeam() : "";
  useEffect(() => {
    if (!team) nav({ to: "/" });
  }, [team, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["public-config"],
    queryFn: () => getPublicConfig(),
  });
  const modes = data?.modes ?? [];

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} className="text-2xl">←</button>
        <div className="text-lg font-bold">Team: <span className="text-primary">{team}</span></div>
      </div>

      <h1 className="mt-6 text-2xl font-black">Choose Players</h1>
      <p className="text-muted-foreground text-sm">How many are playing?</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {isLoading && <div className="col-span-2 text-center text-muted-foreground">Loading…</div>}
        {!isLoading && modes.length === 0 && (
          <div className="col-span-2 text-center text-muted-foreground">No player modes available.</div>
        )}
        {modes.map((m: any) => (
          <button
            key={m.id}
            onClick={() => nav({ to: "/instructions/$modeId", params: { modeId: m.id } })}
            className="rounded-3xl bg-card border-2 border-border p-6 shadow-sm active:scale-[.98] transition"
          >
            <div className="text-4xl font-black text-primary">{m.players}</div>
            <div className="mt-1 text-sm font-semibold">Player{m.players > 1 ? "s" : ""}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {m.num_questions} Qs · {m.time_limit_seconds}s
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
