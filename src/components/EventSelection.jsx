import React, { useState } from "react";
import { ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import EventCard from "./EventCard";
import { EVENTS } from "../data/events";

export default function EventSelection({ selectedEventIds, onToggleEvent, onContinue }) {
  const [errorMessage, setErrorMessage] = useState("");

  const handleProceed = () => {
    if (selectedEventIds.length === 0) {
      setErrorMessage("Please select at least one event.");
      return;
    }
    setErrorMessage("");
    onContinue();
  };

  const handleToggle = (id) => {
    setErrorMessage("");
    onToggleEvent(id);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TECHBYTE SUMMIT 26</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-wider text-white uppercase">
          TEAM REGISTRATION
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-300">
          Select the team events you want to participate in.
        </p>
      </div>

      {/* Inline Validation Error */}
      {errorMessage && (
        <div className="max-w-md mx-auto mb-6 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-center gap-2.5 text-rose-300 font-mono text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={selectedEventIds.includes(event.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
        <div className="font-mono text-xs text-slate-400">
          Selected:{" "}
          <span className="text-white font-semibold">
            {selectedEventIds.length} of {EVENTS.length} event{selectedEventIds.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          onClick={handleProceed}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-heading text-xl tracking-wider uppercase text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-xl shadow-rose-950/50 border border-rose-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>CONTINUE</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
