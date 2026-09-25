import React from "react";
import { Users, Layers, ArrowRight, ArrowLeft, Check } from "lucide-react";

export default function TeamModeSelection({
  registrationMode,
  onSelectMode,
  onContinue,
  onBack
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-semibold mb-2 block">
          Step 02 &bull; Setup Strategy
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-wider text-white uppercase">
          TEAM SETUP
        </h1>
        <p className="mt-3 text-base text-slate-300">
          Are you going to use the same team for all the selected events?
        </p>
      </div>

      {/* Prominent Selection Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Same Team Option */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMode("same-team")}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && onSelectMode("same-team")}
          className={`p-7 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left relative flex flex-col justify-between ${
            registrationMode === "same-team"
              ? "bg-[#111728] border-rose-500 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/40"
              : "bg-[#0b0e17] border-slate-800 hover:border-slate-700 hover:bg-[#0f1422]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  registrationMode === "same-team"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Users className="w-6 h-6" />
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  registrationMode === "same-team"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "border-2 border-slate-700"
                }`}
              >
                {registrationMode === "same-team" && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            <h3 className="font-heading text-2xl tracking-wide text-white mb-2">
              YES — SAME TEAM
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Use one team for every selected event.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
            ✓ Fill leader and members once
          </div>
        </div>

        {/* Different Teams Option */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMode("different-team")}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && onSelectMode("different-team")}
          className={`p-7 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left relative flex flex-col justify-between ${
            registrationMode === "different-team"
              ? "bg-[#111728] border-rose-500 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/40"
              : "bg-[#0b0e17] border-slate-800 hover:border-slate-700 hover:bg-[#0f1422]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  registrationMode === "different-team"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Layers className="w-6 h-6" />
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  registrationMode === "different-team"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "border-2 border-slate-700"
                }`}
              >
                {registrationMode === "different-team" && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            <h3 className="font-heading text-2xl tracking-wide text-white mb-2">
              NO — DIFFERENT TEAMS
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Register a separate team for each selected event.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
            ✓ Individual rosters per event with copy feature
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={onContinue}
          disabled={!registrationMode}
          className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-heading text-xl tracking-wider uppercase text-white transition-all cursor-pointer ${
            registrationMode
              ? "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-xl shadow-rose-950/50 border border-rose-400/30 hover:scale-[1.02] active:scale-[0.98]"
              : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
          }`}
        >
          <span>CONTINUE</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
