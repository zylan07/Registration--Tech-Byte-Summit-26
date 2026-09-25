import React from "react";
import { User, Phone, Hash, Crown, Users } from "lucide-react";

export default function MemberFields({
  memberKey,
  label,
  roleBadge,
  isMandatory,
  data = {},
  errors = {},
  onChange
}) {
  const isLeader = memberKey === "teamLeader";

  const handleFieldChange = (field, value) => {
    // If mobile, keep digits only and max 10 chars
    if (field === "mobile") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      onChange(memberKey, field, digitsOnly);
    } else {
      onChange(memberKey, field, value);
    }
  };

  const nameError = errors[`${memberKey}.name`];
  const idError = errors[`${memberKey}.participantId`];
  const mobileError = errors[`${memberKey}.mobile`];
  const txnError = errors[`${memberKey}.transactionId`];

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isLeader
          ? "bg-[#111726]/60 border-rose-500/30 shadow-sm"
          : "bg-[#0a0d16]/70 border-slate-800"
      }`}
    >
      {/* Member Section Title */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isLeader ? (
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          )}
          <span className="font-heading text-lg tracking-wide text-white">
            {label}
          </span>
          {isMandatory ? (
            <span className="text-rose-400 font-bold text-sm">*</span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Optional
            </span>
          )}
        </div>

        {roleBadge && (
          <span
            className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
              isLeader
                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                : "bg-slate-800/80 text-slate-400"
            }`}
          >
            {roleBadge}
          </span>
        )}
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
            Full Name {isMandatory && <span className="text-rose-400">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. Alex Morgan"
              value={data.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className={`w-full bg-[#07090f] border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                nameError
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-rose-500/80 focus:ring-rose-500/50"
              }`}
            />
          </div>
          {nameError && (
            <p className="mt-1 text-[11px] font-mono text-rose-400">{nameError}</p>
          )}
        </div>

        {/* Participant ID */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
            Participant ID {isMandatory && <span className="text-rose-400">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="e.g. TBS26-1"
              value={data.participantId || ""}
              onChange={(e) => handleFieldChange("participantId", e.target.value)}
              className={`w-full bg-[#07090f] border rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-slate-600 uppercase focus:outline-none focus:ring-1 transition-colors ${
                idError
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-rose-500/80 focus:ring-rose-500/50"
              }`}
            />
          </div>
          {idError ? (
            <p className="mt-1 text-[11px] font-mono text-rose-400">{idError}</p>
          ) : (
            <p className="mt-1 text-[10px] font-mono text-slate-400">
              Enter the Participant ID provided through Ticket9.
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
            Mobile Number {isMandatory && <span className="text-rose-400">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit number"
              value={data.mobile || ""}
              onChange={(e) => handleFieldChange("mobile", e.target.value)}
              className={`w-full bg-[#07090f] border rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                mobileError
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-rose-500/80 focus:ring-rose-500/50"
              }`}
            />
          </div>
          {mobileError ? (
            <p className="mt-1 text-[11px] font-mono text-rose-400">{mobileError}</p>
          ) : (
            <p className="mt-1 text-[10px] font-mono text-slate-400">
              10 digits Indian mobile
            </p>
          )}
        </div>

        {/* Ticket9 Transaction ID */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
            Ticket9 Transaction ID {isMandatory ? <span className="text-rose-400">*</span> : <span className="text-slate-500 font-normal">(*)</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="e.g. TXN-12345"
              value={data.transactionId || ""}
              onChange={(e) => handleFieldChange("transactionId", e.target.value)}
              className={`w-full bg-[#07090f] border rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                txnError
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-rose-500/80 focus:ring-rose-500/50"
              }`}
            />
          </div>
          {txnError ? (
            <p className="mt-1 text-[11px] font-mono text-rose-400">{txnError}</p>
          ) : (
            <p className="mt-1 text-[10px] font-mono text-slate-400">
              Ticket9 transaction / order ID
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
