import React from "react";
import { Edit3, CheckCircle, ArrowLeft, Loader2, AlertCircle, Users, FileCheck, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { getEventById } from "../data/events";
import { MEMBER_ROLE_LABELS, MEMBER_SCREENSHOT_LABELS, getActiveMemberKeys } from "../utils/validation";

export default function ReviewRegistration({
  selectedEventIds,
  registrationMode,
  sameTeamAcrossEvents,
  teamsByEvent,
  sharedTeam,
  sharedTransactionScreenshots,
  transactionScreenshotsByEvent,
  onSubmit,
  isSubmitting,
  submitError,
  onEditStep,
  onBack
}) {
  const isSameTeam = registrationMode === "same-team";

  const getTeamForEvent = (eventId) => {
    return isSameTeam ? sharedTeam : teamsByEvent[eventId] || {};
  };

  const getActiveMembers = (team) => {
    const list = [];
    if (team.teamLeader?.name) {
      list.push({ role: "Leader", memberKey: "teamLeader", ...team.teamLeader });
    }
    if (team.member1?.name) {
      list.push({ role: "Member 1", memberKey: "member1", ...team.member1 });
    }
    if (team.member2?.name) {
      list.push({ role: "Member 2", memberKey: "member2", ...team.member2 });
    }
    if (team.member3?.name) {
      list.push({ role: "Member 3", memberKey: "member3", ...team.member3 });
    }
    return list;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-semibold mb-2 block">
          Final Verification
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-wider text-white uppercase">
          REVIEW REGISTRATION
        </h1>
        <p className="mt-3 text-base text-slate-300">
          Please verify your team details and uploaded transaction screenshots before final submission.
        </p>
      </div>

      {/* Mode Status Banner */}
      <div className="mb-8 p-4 rounded-xl bg-[#0e121e] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="font-mono text-xs font-semibold text-white">
              {isSameTeam ? "Same Team Flow" : "Different Teams Flow"}
            </p>
            <p className="text-xs text-slate-400">
              {isSameTeam
                ? "Same team will be registered for all selected events."
                : "Individual team rosters configured per event."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEditStep(3)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-rose-400" />
          <span>Edit Details</span>
        </button>
      </div>

      {/* Selected Events Summary Cards */}
      <div className="space-y-6 mb-8">
        {selectedEventIds.map((eventId) => {
          const eventMeta = getEventById(eventId);
          const team = getTeamForEvent(eventId);
          const members = getActiveMembers(team);

          return (
            <div
              key={eventId}
              className="bg-[#0b0e18] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg"
            >
              {/* Event Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800/80 gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-semibold block">
                    EVENT
                  </span>
                  <h3 className="font-heading text-2xl tracking-wide text-white">
                    {eventMeta?.title || eventId}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#101525] border border-slate-700 text-slate-300">
                    Team: <strong className="text-white">{team.teamName || "Untitled"}</strong> ({members.length} members)
                  </span>
                </div>
              </div>

              {/* Members Grid */}
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Team Members Roster ({members.length} members)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-[#080a11] border border-slate-800/80 rounded-xl p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] text-rose-400 font-medium uppercase">
                          {m.role}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          {m.participantId}
                        </span>
                      </div>
                      <p className="font-semibold text-white truncate">{m.name}</p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {m.mobile}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Transaction Screenshots Section */}
      <div className="mb-10 bg-[#0e121e] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h3 className="font-heading text-2xl tracking-wide text-white uppercase">
                TRANSACTION SCREENSHOTS
              </h3>
            </div>
            {isSameTeam && selectedEventIds.length > 1 && (
              <p className="text-xs text-slate-400 mt-1">
                These transaction screenshots apply to the team registration and are used for all selected events.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onEditStep(4)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5 text-rose-400" />
            <span>Change Screenshots</span>
          </button>
        </div>

        {/* Display screenshots */}
        {isSameTeam ? (
          <TransactionScreenshotSummaryList
            team={sharedTeam}
            screenshots={sharedTransactionScreenshots}
          />
        ) : (
          <div className="space-y-6">
            {selectedEventIds.map((eventId) => {
              const eventMeta = getEventById(eventId);
              const team = teamsByEvent[eventId] || {};
              const eventScreenshots = transactionScreenshotsByEvent[eventId] || {};

              return (
                <div key={eventId} className="bg-[#090b14] border border-slate-800/80 rounded-xl p-4">
                  <h4 className="font-heading text-lg text-rose-300 mb-3 tracking-wide">
                    {eventMeta?.title} &bull; {team.teamName || "Team"}
                  </h4>
                  <TransactionScreenshotSummaryList
                    team={team}
                    screenshots={eventScreenshots}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-300 font-mono text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">Submission Alert</p>
            <p className="leading-relaxed">{submitError}</p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-mono text-sm text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Uploads</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-heading text-xl tracking-wider uppercase text-white transition-all cursor-pointer ${
            isSubmitting
              ? "bg-rose-900 border border-rose-700/50 cursor-wait opacity-80"
              : "bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 shadow-xl shadow-rose-950/60 border border-rose-400/40 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting registration...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 stroke-[2.5]" />
              <span>SUBMIT TEAM REGISTRATION</span>
            </>
          )}
        </button>
      </div>

      {isSubmitting && (
        <p className="mt-3 text-center text-xs font-mono text-rose-300 animate-pulse">
          Please do not close or refresh this page.
        </p>
      )}
    </div>
  );
}

function TransactionScreenshotSummaryList({ team = {}, screenshots = {} }) {
  const activeKeys = getActiveMemberKeys(team);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {activeKeys.map((memberKey) => {
        const item = screenshots[memberKey];
        const memberData = team[memberKey] || {};
        const roleLabel = MEMBER_ROLE_LABELS[memberKey] || memberKey;
        const screenshotTitle = MEMBER_SCREENSHOT_LABELS[memberKey] || "Transaction Screenshot";

        return (
          <div
            key={memberKey}
            className="bg-[#080a11] border border-slate-800 rounded-xl p-3 flex items-center gap-3"
          >
            {item?.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={screenshotTitle}
                className="w-11 h-11 object-cover rounded-lg bg-slate-900 border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}

            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <FileCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <p className="font-mono text-[11px] text-white font-semibold truncate">
                  {roleLabel}
                </p>
              </div>
              <p className="font-mono text-[10px] text-slate-400 truncate">
                {memberData.name || "Uploaded"}
              </p>
              <p className="font-mono text-[10px] text-slate-500 truncate" title={item?.file?.name}>
                {item?.file?.name || "Missing"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
