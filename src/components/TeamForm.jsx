import React from "react";
import { Users, Copy, AlertCircle } from "lucide-react";
import MemberFields from "./MemberFields";

export default function TeamForm({
  eventTitle,
  eventSubtitle,
  teamData,
  onChangeTeam,
  errors = {},
  canCopyPrevious = false,
  previousEventTitle = "",
  onCopyFromPrevious
}) {
  const handleFieldChange = (memberKey, field, value) => {
    onChangeTeam({
      ...teamData,
      [memberKey]: {
        ...(teamData[memberKey] || {}),
        [field]: value
      }
    });
  };

  const handleTeamNameChange = (e) => {
    onChangeTeam({
      ...teamData,
      teamName: e.target.value
    });
  };

  return (
    <div className="bg-[#0e121e] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      {/* Event Header if applicable */}
      {eventTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-semibold block mb-1">
              {eventSubtitle || "Event Team Registration"}
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl tracking-wide text-white">
              {eventTitle}
            </h2>
          </div>

          {canCopyPrevious && (
            <button
              type="button"
              onClick={onCopyFromPrevious}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-rose-400" />
              <span>Same as {previousEventTitle || "previous event"}</span>
            </button>
          )}
        </div>
      )}

      {/* Team Size & Info Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090b12] border border-slate-800/80 mb-6">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <Users className="w-4 h-4 text-rose-400" />
          <span>Requirement:</span>
          <span className="text-white font-semibold">Team size: 2–4 members</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Leader + 1 to 3 Members
        </span>
      </div>

      {errors.teamSize && (
        <div className="mb-6 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 font-mono text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errors.teamSize}</span>
        </div>
      )}

      {/* Team Name Input */}
      <div className="mb-6">
        <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
          TEAM NAME <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. CyberKnights"
          value={teamData.teamName || ""}
          onChange={handleTeamNameChange}
          className={`w-full bg-[#080a11] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
            errors.teamName
              ? "border-rose-500 focus:ring-rose-500"
              : "border-slate-700 focus:border-rose-500 focus:ring-rose-500"
          }`}
        />
        {errors.teamName && (
          <p className="mt-1 text-xs font-mono text-rose-400">{errors.teamName}</p>
        )}
      </div>

      {/* Member Details */}
      <div className="space-y-4">
        {/* Team Leader */}
        <MemberFields
          memberKey="teamLeader"
          label="Team Leader"
          roleBadge="Primary Contact"
          isMandatory={true}
          data={teamData.teamLeader || {}}
          errors={errors}
          onChange={handleFieldChange}
        />

        {/* Member 1 */}
        <MemberFields
          memberKey="member1"
          label="Member 1"
          roleBadge="Mandatory Member"
          isMandatory={true}
          data={teamData.member1 || {}}
          errors={errors}
          onChange={handleFieldChange}
        />

        {/* Member 2 */}
        <MemberFields
          memberKey="member2"
          label="Member 2"
          roleBadge="Optional"
          isMandatory={false}
          data={teamData.member2 || {}}
          errors={errors}
          onChange={handleFieldChange}
        />

        {/* Member 3 */}
        <MemberFields
          memberKey="member3"
          label="Member 3"
          roleBadge="Optional"
          isMandatory={false}
          data={teamData.member3 || {}}
          errors={errors}
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
}
