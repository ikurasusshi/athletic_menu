"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type ProfileInput } from "@/lib/api";

const EVENT_OPTIONS = [
  { value: "SHORT", label: "短距離", desc: "100m・200m・400m" },
  { value: "MIDDLE_LONG", label: "中長距離", desc: "800m・1500m・マラソン" },
  { value: "JUMP", label: "跳躍", desc: "走高跳・走幅跳・三段跳" },
  { value: "THROW", label: "投擲", desc: "砲丸投・円盤投・やり投" },
] as const;

const GENDER_OPTIONS = [
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "OTHER", label: "その他" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileInput>({
    event: "SHORT",
    age: 20,
    gender: "MALE",
    targetRecord: "",
    personalBest: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.profile.get()
      .then((profile) => {
        setForm({
          event: profile.event,
          age: profile.age,
          gender: profile.gender,
          targetRecord: profile.targetRecord ?? "",
          personalBest: profile.personalBest ?? "",
        });
      })
      .catch(() => {/* 未登録は無視 */})
      .finally(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      await api.profile.update(form);
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="h-40 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">プロフィール設定</h1>
        <p className="text-sm text-gray-500 mt-0.5">メニュー生成に使用する情報を登録してください</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 種目 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <label className="block text-sm font-medium text-gray-800">競技種目</label>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, event: opt.value }))}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                  form.event === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className={`text-sm font-medium ${form.event === opt.value ? "text-blue-700" : "text-gray-800"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 年齢・性別 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="age" className="block text-sm font-medium text-gray-800">年齢</label>
            <input
              id="age"
              type="number"
              required
              min={10}
              max={99}
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
              className="w-32 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-800">性別</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: opt.value }))}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    form.gender === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 記録 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="personalBest" className="block text-sm font-medium text-gray-800">
              自己ベスト
              <span className="ml-1.5 text-xs font-normal text-gray-400">任意</span>
            </label>
            <input
              id="personalBest"
              type="text"
              value={form.personalBest ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, personalBest: e.target.value }))}
              placeholder="例：100m 11秒20"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="targetRecord" className="block text-sm font-medium text-gray-800">
              目標記録
              <span className="ml-1.5 text-xs font-normal text-gray-400">任意</span>
            </label>
            <input
              id="targetRecord"
              type="text"
              value={form.targetRecord ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, targetRecord: e.target.value }))}
              placeholder="例：100m 10秒台"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <span className="text-red-500 text-sm">⚠</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
            <span className="text-green-500 text-sm">✓</span>
            <p className="text-sm text-green-700">保存しました。ダッシュボードに移動します...</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              保存中...
            </span>
          ) : (
            "保存してダッシュボードへ"
          )}
        </button>
      </form>
    </div>
  );
}
