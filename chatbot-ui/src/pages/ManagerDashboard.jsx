import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { apiBase } from "../utils/api.js";

const defaultCourse = "Greeting";

export default function ManagerDashboard() {
  const { user, token, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [globalCourse, setGlobalCourse] = useState(defaultCourse);
  const [courseDrafts, setCourseDrafts] = useState({});

  const displayName = user?.name || user?.email || "Manager";

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadEmployees = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/manager/employees`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load employees.");
      }
      setEmployees(payload.employees || []);
    } catch (err) {
      setError(err.message || "Unable to load employees.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [token]);

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/manager/employees`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to add employee.");
      }
      setEmail("");
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to add employee.");
    }
  };

  const assignCourse = async ({ course, employeeId }) => {
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/manager/assignments`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ course, employeeId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to assign course.");
      }
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to assign course.");
    }
  };

  const handleAssignAll = async (event) => {
    event.preventDefault();
    await assignCourse({ course: globalCourse });
  };

  const handleAssignToEmployee = async (employeeId) => {
    const nextCourse = (courseDrafts[employeeId] || defaultCourse).trim();
    if (!nextCourse) return;
    await assignCourse({ course: nextCourse, employeeId });
  };

  return (
    <main className="relative min-h-screen h-screen bg-slate-50 px-6 py-12 md:px-10 lg:px-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-indigo-100/80 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
      </div>

      <div className="relative h-full w-full">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base uppercase tracking-[0.18em] text-slate-400">Manager Dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">
              Welcome back, {displayName}.
            </h1>
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
              Open Coach
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold text-slate-900">Add employee by email</h2>
            <p className="mt-1 text-base text-slate-500">
              Attach an existing employee account to your team.
            </p>
            <form className="mt-5 flex gap-3" onSubmit={handleAddEmployee}>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@company.com"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700"
              >
                Add
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold text-slate-900">Assign course to all employees</h2>
            <p className="mt-1 text-base text-slate-500">Roll out one course to your full roster.</p>
            <form className="mt-5 flex gap-3" onSubmit={handleAssignAll}>
              <input
                type="text"
                required
                value={globalCourse}
                onChange={(event) => setGlobalCourse(event.target.value)}
                placeholder="Course name"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
              >
                Assign all
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Team roster</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-base font-semibold text-slate-600">
              {employees.length} employees
            </span>
          </div>

          {isLoading ? (
            <p className="mt-4 text-slate-500">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="mt-4 text-slate-500">No employees assigned yet.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-800">{employee.name}</p>
                      <p className="text-sm text-slate-500">{employee.email}</p>
                    </div>
                    <div className="flex w-full gap-2 md:w-auto">
                      <input
                        type="text"
                        value={courseDrafts[employee._id] || ""}
                        onChange={(event) =>
                          setCourseDrafts((prev) => ({
                            ...prev,
                            [employee._id]: event.target.value,
                          }))
                        }
                        placeholder={defaultCourse}
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAssignToEmployee(employee._id)}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Assign
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(employee.assignedCourses || []).map((course) => (
                      <span
                        key={`${employee._id}-${course}`}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                      >
                        {course}
                      </span>
                    ))}
                    {!employee.assignedCourses?.length ? (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                        No assigned courses
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
