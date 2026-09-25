import React, { useRef } from "react";
import { Upload, X, RefreshCw, FileCheck, AlertCircle, User, ShieldCheck } from "lucide-react";
import { formatBytes, ACCEPTED_IMAGE_TYPES } from "../utils/fileUtils";
import { MEMBER_ROLE_LABELS, MEMBER_SCREENSHOT_LABELS } from "../utils/validation";

export default function ScreenshotUpload({
  teamTitle = "Team",
  teamMembers = {},
  activeMemberKeys = ["teamLeader", "member1"],
  transactionScreenshots = {},
  errors = {},
  onUploadMemberScreenshot,
  onRemoveMemberScreenshot,
  isMultipleEvents = false
}) {
  const requiredCount = activeMemberKeys.length;
  const uploadedCount = activeMemberKeys.filter(
    (key) => transactionScreenshots[key]?.file
  ).length;

  return (
    <div className="bg-[#0e121e] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      {/* Section Header */}
      <div className="pb-5 mb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-semibold block mb-1">
              Payment Verification &bull; {teamTitle}
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-wide text-white">
              TRANSACTION SCREENSHOTS
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-[#080a11] border border-slate-800 text-slate-300">
              Uploaded:{" "}
              <strong
                className={
                  uploadedCount === requiredCount
                    ? "text-emerald-400 font-bold"
                    : "text-rose-400 font-bold"
                }
              >
                {uploadedCount} of {requiredCount}
              </strong>
            </span>
          </div>
        </div>

        {/* Supporting text */}
        <p className="text-sm text-slate-300 leading-relaxed">
          Upload the Ticket9 transaction screenshot for each team member. These screenshots are required only once for the team, even if the team participates in multiple events.
        </p>

        {/* Requirement Dynamic Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[#090b14] border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span className="text-white font-semibold">
              {requiredCount} transaction screenshot{requiredCount !== 1 ? "s" : ""} required
            </span>
            <span className="text-slate-500 hidden sm:inline">
              (One per registered team member)
            </span>
          </div>
          {isMultipleEvents && (
            <span className="text-rose-400 text-[11px] bg-rose-950/30 px-2 py-0.5 rounded border border-rose-500/20">
              Applies across all selected events
            </span>
          )}
        </div>
      </div>

      {/* Global Section Error if any member missing */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-300 font-mono text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200 mb-1">
              Please complete all required transaction screenshot uploads:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dynamic Member Slots Grid (strictly matches active members) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeMemberKeys.map((memberKey) => {
          const memberData = teamMembers[memberKey] || {};
          const title = MEMBER_SCREENSHOT_LABELS[memberKey] || "Transaction Screenshot";
          const roleLabel = MEMBER_ROLE_LABELS[memberKey] || memberKey;
          const item = transactionScreenshots[memberKey];
          const slotError = errors[memberKey];

          return (
            <MemberScreenshotSlot
              key={memberKey}
              memberKey={memberKey}
              title={title}
              roleLabel={roleLabel}
              memberName={memberData.name || ""}
              participantId={memberData.participantId || ""}
              item={item}
              slotError={slotError}
              onUpload={(file) => onUploadMemberScreenshot(memberKey, file)}
              onRemove={() => onRemoveMemberScreenshot(memberKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

function MemberScreenshotSlot({
  memberKey,
  title,
  roleLabel,
  memberName,
  participantId,
  item,
  slotError,
  onUpload,
  onRemove
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a valid image (JPG, JPEG, PNG, or WEBP).");
        return;
      }
      onUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a valid image (JPG, JPEG, PNG, or WEBP).");
        return;
      }
      onUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
        item
          ? "bg-[#111625] border-slate-700/80"
          : slotError
          ? "bg-[#170e14] border-rose-500/80 shadow-md shadow-rose-950/30"
          : "bg-[#090c15] border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Header Info */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="font-semibold text-sm text-white">
            {title}
          </h4>

          {item ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileCheck className="w-3 h-3" />
              Uploaded
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              Required
            </span>
          )}
        </div>

        {/* Member Name and ID context badge */}
        {(memberName || participantId) && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-[#06080e] p-2 rounded-lg border border-slate-800/80 mb-2">
            <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold text-white truncate">
              {memberName || roleLabel}
            </span>
            {participantId && (
              <span className="text-slate-400 text-[11px] ml-auto shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {participantId}
              </span>
            )}
          </div>
        )}

        {/* Helper text as specified */}
        <p className="text-xs text-slate-400">
          Upload the Ticket9 transaction screenshot for this team member.
        </p>
      </div>

      {/* Upload Box or Preview */}
      {item ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-700/60 bg-black/40 group">
          <div className="h-44 w-full flex items-center justify-center bg-[#07090f] overflow-hidden">
            <img
              src={item.previewUrl}
              alt={title}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Controls */}
          <div className="p-2.5 bg-[#0b0e18] border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="truncate mr-2">
              <p className="text-slate-200 truncate text-[11px]" title={item.file?.name}>
                {item.file?.name}
              </p>
              <p className="text-slate-500 text-[10px]">
                {formatBytes(item.file?.size)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Replace screenshot"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-md hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Remove screenshot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700/70 hover:border-rose-500/70 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#080a12]/60 hover:bg-[#0d101a] group h-44"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800/80 group-hover:bg-rose-500/20 text-slate-400 group-hover:text-rose-400 flex items-center justify-center mb-2 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
            Click to upload or drag & drop
          </p>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            PNG, JPG, JPEG or WEBP (Max 5MB)
          </p>
        </div>
      )}

      {slotError && (
        <p className="mt-2 text-[11px] font-mono text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{slotError}</span>
        </p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
