"use client";

import { useState } from "react";
import { api, type ConditionInput } from "@/lib/api";

const MUSCLE_PARTS = [
  { key: "legs", label: "Legs" },
  { key: "hamstrings", label: "Hamstrings" },
  { key: "calves", label: "Calves" },
  { key: "core", label: "Core" },
  { key: "arms", label: "Arms" },
  { key: "shoulders", label: "Shoulders" },
];

const SEVERITY_OPTIONS = [
  { value: "NONE", label: "None", color: "bg-gray-100 text-gray-600 border-gray-200" },
  { value: "MILD", label: "Mild", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "SEVERE", label: "Severe", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

type Severity = "NONE" | "MILD" | "SEVERE";

function RatingInput({
  label,
  hint,
  value,
  onChange,
  icons,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  icons: string[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label className="text-sm font-medium text-gray-800">{label}</label>
        <span className="text-xs text-gray-400">{hint}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              value === n
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <span className="text-base">{icons[n - 1]}</span>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [motivation, setMotivation] = useState(3);
  const [goalCommitment, setGoalCommitment] = useState(3);
  const [muscleSoreness, setMuscleSoreness] = useState<Record<string, Severity>>(
    Object.fromEntries(MUSCLE_PARTS.map((p) => [p.key, "NONE"]))
  );
  const [injuryText, setInjuryText] = useState("");
  const [generatedMenu, setGeneratedMenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setSeverity(part: string, severity: Severity) {
    setMuscleSoreness((prev) => ({ ...prev, [part]: severity }));
  }

  async function handleGenerate() {
    setError("");
    setLoading(true);
    setGeneratedMenu("");
    try {
      const injuryStatus = injuryText.trim()
        ? [{ part: "Other", detail: injuryText.trim() }]
        : [];

      const condition: ConditionInput = {
        motivation,
        muscleSoreness,
        injuryStatus,
        goalCommitment,
      };

      const session = await api.sessions.create(condition);
      setGeneratedMenu(session.generatedMenu);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate training menu. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Today's Training</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your condition to generate the optimal training menu</p>
      </div>

      {/* Condition form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {/* Motivation */}
        <div className="p-6">
          <RatingInput
            label="Motivation"
            hint="Today's energy & focus level"
            value={motivation}
            onChange={setMotivation}
            icons={["😴", "😐", "🙂", "😊", "🔥"]}
          />
        </div>

        {/* Goal commitment */}
        <div className="p-6">
          <RatingInput
            label="Goal Commitment"
            hint="Level of dedication to your goal"
            value={goalCommitment}
            onChange={setGoalCommitment}
            icons={["💤", "😑", "👍", "💪", "🏆"]}
          />
        </div>

        {/* Muscle soreness */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-800">Muscle Soreness</p>
            <p className="text-xs text-gray-400 mt-0.5">Select the severity for each muscle group</p>
          </div>
          <div className="space-y-3">
            {MUSCLE_PARTS.map((part) => (
              <div key={part.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 w-24">{part.label}</span>
                <div className="flex gap-1.5">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(part.key, opt.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                        muscleSoreness[part.key] === opt.value
                          ? opt.color + " shadow-sm"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Injury */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Injury / Pain Details
            <span className="ml-1.5 text-xs font-normal text-gray-400">Optional</span>
          </label>
          <textarea
            value={injuryText}
            onChange={(e) => setInjuryText(e.target.value)}
            rows={2}
            placeholder="e.g., Discomfort on the outside of the left knee"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <span className="text-red-500 text-sm">⚠</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            AI is generating your menu...
          </span>
        ) : (
          "✨ Generate Training Menu"
        )}
      </button>

      {/* Generated menu */}
      {generatedMenu && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📋</span>
            <h2 className="text-base font-semibold text-gray-900">Today's Training Menu</h2>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {generatedMenu}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-gray-100`} style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
