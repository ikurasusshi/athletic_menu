export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
        {/* Track lines */}
        <div className="absolute inset-0 flex flex-col justify-center gap-8 opacity-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-px w-full bg-white" />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            <span className="text-white font-bold text-lg tracking-tight">Athletic Menu</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold text-white leading-snug">
            The optimal menu<br />
            for your<br />
            condition.
          </h2>
          <p className="text-blue-200/70 text-sm leading-relaxed max-w-xs">
            Just enter your physical condition, muscle soreness, and motivation level —
            AI will automatically generate the best training menu for today.
          </p>

          <div className="flex gap-6 pt-2">
            {[
              { label: "All Events", value: "Supported" },
              { label: "AI Generation", value: "Claude" },
              { label: "History", value: "Unlimited" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-white font-semibold text-sm">{item.value}</p>
                <p className="text-blue-300/60 text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-blue-300/40 text-xs">© 2026 Athletic Menu Generator</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-xl">🏃</span>
            <span className="font-bold text-gray-900 tracking-tight">Athletic Menu</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
