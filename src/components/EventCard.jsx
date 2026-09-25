import React from "react";
import { Check, FileText, LayoutTemplate, Presentation, Code2 } from "lucide-react";

const ICON_MAP = {
  FileText: FileText,
  LayoutTemplate: LayoutTemplate,
  Presentation: Presentation,
  Code2: Code2
};

export default function EventCard({ event, isSelected, onToggle }) {
  const IconComponent = ICON_MAP[event.icon] || FileText;

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(event.id);
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onToggle(event.id)}
      onKeyDown={handleKeyDown}
      className={`group relative rounded-2xl p-6 transition-all duration-200 cursor-pointer select-none border text-left flex flex-col justify-between ${
        isSelected
          ? "bg-[#111625] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50"
          : "bg-[#0c0f18]/80 hover:bg-[#101421] border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isSelected
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-slate-800/60 text-slate-400 border border-slate-700/60 group-hover:text-slate-300"
            }`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          {/* Select Indicator */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                : "border-2 border-slate-700 group-hover:border-slate-500 bg-slate-900/60"
            }`}
          >
            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>

        {/* Subtitle / Category */}
        <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400/90 font-semibold mb-1 block">
          {event.subtitle}
        </span>

        {/* Title */}
        <h3 className="font-heading text-2xl tracking-wide text-white group-hover:text-rose-200 transition-colors">
          {event.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Team: 2–4 members</span>
        <span className={`transition-colors ${isSelected ? "text-rose-400 font-semibold" : "text-slate-500"}`}>
          {isSelected ? "Selected" : "Click to select"}
        </span>
      </div>
    </div>
  );
}
