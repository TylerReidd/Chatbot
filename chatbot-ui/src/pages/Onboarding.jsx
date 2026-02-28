import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { getDashboardPath } from "../utils/roles.js";

// Keep this aligned with the steps you actually render.
const STEPS = ["Welcome", "Experience", "Context", "Strengths", "Scenario", "Plan"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();

  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    experienceLevel: "",
    salesContext: "",
    strengths: [],
    weaknesses: [],
    scenarioStyle: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const progress = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step]
  );

  const toggleArrayValue = (key, value) => {
    setData((prev) => {
      const arr = new Set(prev[key]);
      if (arr.has(value)) arr.delete(value);
      else arr.add(value);
      return { ...prev, [key]: Array.from(arr) };
    });
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setIsSaving(true);
    setSaveError(null);
    window.localStorage.setItem("onboarding.profile", JSON.stringify(data));
    try {
      await updateUser({ onboardingComplete: true });
      navigate(getDashboardPath(user?.role), { replace: true });
    } catch (err) {
      setSaveError(err?.message || "Unable to complete onboarding.");
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 flex items-start justify-center">
      {/* Phone-sized column */}
      <div className="  w-full
                        max-w-[420px]
                        sm:max-w-[480px]
                        md:max-w-[560px]
                        lg:max-w-[640px]">
        <WizardChrome
          step={step}
          steps={STEPS}
          progress={progress}
        />

        {/* “Phone card” */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            {step === 0 && (
              <WizardStep
                align="center"
                header={
                  <div className="mb-2 flex justify-center">
                    <img src="/images/image001.PNG" alt="..." />

                  </div>
                }
                title="Welcome to your Sales Coach"
                subtitle={ `${`This will help you sell confidently on the floor and avoid common mistakes.`}` }
                footer={
                  <PrimaryButton onClick={next}>
                    Let’s Begin
                  </PrimaryButton>
                }
              >
                <HeroBadge />
                <div className="mt-4 text-sm text-slate-500">
                  Takes about <span className="font-semibold text-slate-700">3 minutes</span> to get started.
                </div>
              </WizardStep>
            )}

            {step === 1 && (
              <WizardStep
                title="What’s your experience level?"
                subtitle="Choose one to start."
                footer={
                  <WizardFooter
                    back={back}
                    next={next}
                    nextDisabled={!data.experienceLevel}
                    nextLabel="Continue"
                  />
                }
              >
                <div className="mt-5 space-y-3">
                  {[
                    { id: "new", label: "New to Sales", icon: "⭐" },
                    { id: "intermediate", label: "Some Experience", icon: "✅" },
                    { id: "advanced", label: "Experienced / Top Performer", icon: "🏅" },
                  ].map((opt) => (
                    <OptionCard
                      key={opt.id}
                      icon={opt.icon}
                      title={opt.label}
                      selected={data.experienceLevel === opt.id}
                      onClick={() => setData((p) => ({ ...p, experienceLevel: opt.id }))}
                    />
                  ))}
                </div>
              </WizardStep>
            )}

            {step === 2 && (
              <WizardStep
                title="Where do you sell?"
                subtitle="Pick the closest match."
                footer={
                  <WizardFooter
                    back={back}
                    next={next}
                    nextDisabled={!data.salesContext}
                    nextLabel="Continue"
                  />
                }
              >
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {[
                    "Retail / In-store",
                    "Inside Sales / Phone",
                    "B2B / Account-based",
                    "Commission-only",
                    "Freelance / Solo",
                    "Other",
                  ].map((opt) => (
                    <OptionCard
                      key={opt}
                      icon="🏷️"
                      title={opt}
                      selected={data.salesContext === opt}
                      onClick={() => setData((p) => ({ ...p, salesContext: opt }))}
                    />
                  ))}
                </div>
              </WizardStep>
            )}

            {step === 3 && (
              <WizardStep
                title="Strengths & weaknesses"
                subtitle="Pick a few. We’ll build your plan around this."
                footer={
                  <WizardFooter
                    back={back}
                    next={next}
                    nextDisabled={data.strengths.length === 0 && data.weaknesses.length === 0}
                    nextLabel="Continue"
                  />
                }
              >
                <div className="mt-5">
                  <div className="text-sm font-semibold text-slate-900">Strengths</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Greeting", "Product knowledge", "Reading customers", "Closing", "Follow-up", "Confidence"].map((t) => (
                      <Chip
                        key={t}
                        active={data.strengths.includes(t)}
                        onClick={() => toggleArrayValue("strengths", t)}
                        label={t}
                      />
                    ))}
                  </div>

                  <div className="mt-5 text-sm font-semibold text-slate-900">Weaknesses</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Objections", "Price pushback", "Staying calm", "Asking for the sale", "Talking too much", "Talking too little"].map((t) => (
                      <Chip
                        key={t}
                        active={data.weaknesses.includes(t)}
                        onClick={() => toggleArrayValue("weaknesses", t)}
                        label={t}
                      />
                    ))}
                  </div>
                </div>
              </WizardStep>
            )}

            {step === 4 && (
              <WizardStep
                title="Scenario Practice"
                subtitle={
                  <>
                    Customer says:{" "}
                    <span className="font-semibold text-slate-900">“We’re just looking.”</span>
                    <div className="mt-2 text-sm text-slate-500">How would you respond?</div>
                  </>
                }
                footer={
                  <WizardFooter
                    back={back}
                    next={next}
                    nextDisabled={!data.scenarioStyle}
                    nextLabel="Continue"
                  />
                }
              >
                <div className="mt-4 space-y-3">
                  {[
                    { id: "soft", label: "“No problem—take your time.”" },
                    { id: "guided", label: "“Totally—what brought you in today?”" },
                    { id: "confident", label: "“Perfect. Want a quick tour of the best options?”" },
                    { id: "direct", label: "“Great. What are you comparing today?”" },
                  ].map((opt) => (
                    <OptionCard
                      key={opt.id}
                      icon="💬"
                      title={opt.label}
                      selected={data.scenarioStyle === opt.id}
                      onClick={() => setData((p) => ({ ...p, scenarioStyle: opt.id }))}
                    />
                  ))}
                </div>
              </WizardStep>
            )}

            {step === 5 && (
              <WizardStep
                title="Your training plan"
                subtitle="Here’s what we’ll start with."
                footer={
                  <div className="mt-6 flex gap-3">
                    <SecondaryButton onClick={back}>Back</SecondaryButton>
                    <PrimaryButton onClick={finish} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Start Training"}
                    </PrimaryButton>
                  </div>
                }
              >
                <div className="mt-5 space-y-3">
                  <PlanItem text="Greeting the customer" />
                  <PlanItem text="Handling price objections" />
                  <PlanItem text="Competitive comparisons" />
                </div>

                <div className="mt-6 text-sm text-slate-500">
                  Daily lessons, 5–10 minutes each.
                </div>
                {saveError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {saveError}
                  </div>
                ) : null}
              </WizardStep>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
         Saleswhiz &copy; 2026. All rights reserved.
        </div>
      </div>
    </main>
  );
}

/* ---------- UI pieces (small + consistent) ---------- */

function WizardChrome({ step, steps, progress }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium">{steps[step]}</span>
        <span>Step {step + 1} of {steps.length}</span>
      </div>

      {/* dots */}
      <div className="mt-2 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={[
              "h-2.5 w-2.5 rounded-full transition",
              i <= step ? "bg-indigo-600" : "bg-slate-200",
            ].join(" ")}
          />
        ))}
        <div className="ml-auto text-xs text-slate-400">{progress}%</div>
      </div>

      {/* thin bar (optional, helps match “app polish”) */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function WizardStep({ title, subtitle, header, children, footer, align = "left" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {header ? <div>{header}</div> : null}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
      <div className="mt-2 text-slate-600 md:text-lg">{subtitle}</div>
      <div className="mt-5">{children}</div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}

function WizardFooter({ back, next, nextDisabled, nextLabel = "Continue" }) {
  return (
    <div className="flex gap-3">
      <SecondaryButton onClick={back} className="w-1/3">
        Back
      </SecondaryButton>
      <PrimaryButton onClick={next} disabled={nextDisabled} className="flex-1">
        {nextLabel}
      </PrimaryButton>
    </div>
  );
}

function PrimaryButton({ children, className = "", disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full border border-slate-200 rounded-2xl py-3 font-semibold text-slate-700 hover:bg-slate-50",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function OptionCard({ icon, title, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border p-4 transition flex items-center gap-3",
        selected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
        <span className="text-lg">{icon}</span>
      </div>

      <div className="flex-1">
        <div className="font-semibold text-slate-900">{title}</div>
      </div>

      <div
        className={[
          "h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold",
          selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 text-transparent",
        ].join(" ")}
        aria-hidden="true"
      >
        ✓
      </div>
    </button>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-2 rounded-full border text-sm transition",
        active
          ? "bg-indigo-50 border-indigo-600 text-indigo-700"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PlanItem({ text }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
        ✓
      </div>
      <div className="font-semibold text-slate-900">{text}</div>
    </div>
  );
}

function HeroBadge() {
  return (
    <div className="mx-auto h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center">
      <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
        SC
      </div>
    </div>
  );
}
