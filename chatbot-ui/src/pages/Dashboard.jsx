import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const modules = [
  { id: "greeting", label: "Greeting", short: "GR", status: "completed", accent: "amber" },
  { id: "presenting", label: "Presenting", short: "PR", status: "completed", accent: "sky" },
  { id: "objections", label: "Objection Handling", short: "OB", status: "in-progress", accent: "indigo" },
  { id: "closing", label: "Closing", short: "CL", status: "in-progress", accent: "emerald" },
  { id: "followup", label: "Follow-Up", short: "FU", status: "up-next", accent: "slate" },
];

const badges = ["Customer First", "Smooth Closer", "Objection Ninja"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || "there";

  const completedCount = useMemo(
    () => modules.filter((module) => module.status === "completed").length,
    []
  );
  const progressPercent = Math.round((completedCount / modules.length) * 100);

  return (
    <main className="relative min-h-screen h-screen bg-slate-50 px-6 py-12 md:px-10 lg:px-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />
      </div>
      <div className="relative h-full w-full">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base uppercase tracking-[0.18em] text-slate-400">Sales Coach Dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Welcome back, {displayName}.</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Log out
            </button>
            <Link
              to="/home"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Start Coaching
            </Link>
          </div>
        </div>

        <div className="grid flex-1 gap-6 md:grid-cols-2 lg:gap-8">
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Completed modules</h2>
                <p className="mt-1 text-base text-slate-500">
                  {completedCount} of {modules.length} done
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-base font-semibold text-slate-600">
                {progressPercent}%
              </div>
            </div>

            <div className="mt-5 h-3 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {modules
                .filter((module) => module.status === "completed")
                .map((module) => (
                  <span
                    key={module.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {module.label}
                  </span>
                ))}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                Earned badges
              </h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                      B
                    </span>
                    {badge}
                  </div>
                ))}
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-2 text-base text-slate-400">
                  More badges coming soon
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur">
            <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-200">Tip of the Day</p>
              <h2 className="mt-2 text-2xl font-semibold">
                Lead with curiosity, then offer two clear options.
              </h2>
              <p className="mt-2 text-base text-slate-200">
                Example: “Are you looking for energy savings or more capacity? I can show you the best
                fit for both.”
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                Current modules
              </h3>
              <div className="mt-3 space-y-3">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold",
                          module.accent === "amber" && "bg-amber-100 text-amber-700",
                          module.accent === "sky" && "bg-sky-100 text-sky-700",
                          module.accent === "indigo" && "bg-indigo-100 text-indigo-700",
                          module.accent === "emerald" && "bg-emerald-100 text-emerald-700",
                          module.accent === "slate" && "bg-slate-200 text-slate-600",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {module.short}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-800">{module.label}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {module.status.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        module.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : module.status === "in-progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {module.status === "completed"
                        ? "Done"
                        : module.status === "in-progress"
                        ? "Active"
                        : "Up next"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
