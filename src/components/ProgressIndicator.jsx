import React from "react";
import { Check } from "lucide-react";

export default function ProgressIndicator({ currentStep, hasMultipleEvents }) {
  const steps = [
    { number: 1, id: "events", label: "Events", code: "01" },
    ...(hasMultipleEvents
      ? [{ number: 2, id: "mode", label: "Team Setup", code: "02" }]
      : []),
    { number: 3, id: "details", label: "Team Details", code: hasMultipleEvents ? "03" : "02" },
    { number: 4, id: "uploads", label: "Screenshots", code: hasMultipleEvents ? "04" : "03" },
    { number: 5, id: "review", label: "Review", code: hasMultipleEvents ? "05" : "04" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Desktop / Tablet Timeline */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-800 -z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-rose-600 to-rose-400 -z-0 transition-all duration-300"
          style={{
            width: `${((Math.min(currentStep, 5) - 1) / (steps.length - 1)) * 100}%`
          }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 border-2 ${
                  isCompleted
                    ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/60"
                    : isCurrent
                    ? "bg-[#0b0e17] border-rose-500 text-rose-400 ring-4 ring-rose-500/20 shadow-lg shadow-rose-950/40"
                    : "bg-[#0c0f18] border-slate-700 text-slate-500"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.code}
              </div>
              <span
                className={`mt-2 font-mono text-xs tracking-wider uppercase whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "text-rose-400 font-semibold"
                    : isCompleted
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Compact Bar */}
      <div className="sm:hidden flex items-center justify-between bg-[#0e121d] px-4 py-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white font-mono text-xs font-bold">
            {currentStep}
          </span>
          <span className="font-mono text-xs text-slate-400">
            / {steps.length}
          </span>
          <span className="font-mono text-xs text-white uppercase font-semibold ml-1">
            {steps.find((s) => s.number === currentStep)?.label || "Registration"}
          </span>
        </div>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 transition-all duration-300 rounded-full"
            style={{
              width: `${(Math.min(currentStep, 5) / steps.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
