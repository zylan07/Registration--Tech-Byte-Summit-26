import React, { useState } from "react";
import Header from "./components/Header";
import ProgressIndicator from "./components/ProgressIndicator";
import EventSelection from "./components/EventSelection";
import TeamModeSelection from "./components/TeamModeSelection";
import TeamForm from "./components/TeamForm";
import ScreenshotUpload from "./components/ScreenshotUpload";
import ReviewRegistration from "./components/ReviewRegistration";
import SuccessScreen from "./components/SuccessScreen";
import { getEventById } from "./data/events";
import { validateTeam, validateTransactionScreenshots, getActiveMemberKeys } from "./utils/validation";
import { fileToBase64 } from "./utils/fileUtils";
import { submitRegistration } from "./utils/api";
import { ArrowRight, ArrowLeft } from "lucide-react";

const createEmptyTeam = () => ({
  teamName: "",
  teamLeader: { name: "", participantId: "", mobile: "", transactionId: "" },
  member1: { name: "", participantId: "", mobile: "", transactionId: "" },
  member2: { name: "", participantId: "", mobile: "", transactionId: "" },
  member3: { name: "", participantId: "", mobile: "", transactionId: "" }
});

const createEmptyScreenshots = () => ({
  teamLeader: null,
  member1: null,
  member2: null,
  member3: null
});

export default function App() {
  // Wizard Step: 1 = Events, 2 = Team Setup (conditional), 3 = Details, 4 = Uploads, 5 = Review, 6 = Success
  const [currentStep, setCurrentStep] = useState(1);

  // Selected Events
  const [selectedEventIds, setSelectedEventIds] = useState([]);

  // Registration Mode: 'same-team' | 'different-team'
  const [registrationMode, setRegistrationMode] = useState("same-team");

  // Team Form Data
  const [sharedTeam, setSharedTeam] = useState(createEmptyTeam());
  const [teamsByEvent, setTeamsByEvent] = useState({});

  // Validation Errors
  const [sharedTeamErrors, setSharedTeamErrors] = useState({});
  const [errorsByEvent, setErrorsByEvent] = useState({});

  // Transaction Screenshots State:
  // For same-team mode:
  const [sharedTransactionScreenshots, setSharedTransactionScreenshots] = useState(createEmptyScreenshots());
  // For different-team mode:
  const [transactionScreenshotsByEvent, setTransactionScreenshotsByEvent] = useState({});

  // Screenshot Errors
  const [sharedScreenshotErrors, setSharedScreenshotErrors] = useState({});
  const [screenshotErrorsByEvent, setScreenshotErrorsByEvent] = useState({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registrationResult, setRegistrationResult] = useState(null);

  const hasMultipleEvents = selectedEventIds.length > 1;

  // Toggle Event Selection
  const handleToggleEvent = (id) => {
    setSelectedEventIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];

      // Auto initialize teams and screenshots for newly selected event
      if (!exists) {
        setTeamsByEvent((old) => ({
          ...old,
          [id]: old[id] || createEmptyTeam()
        }));
        setTransactionScreenshotsByEvent((old) => ({
          ...old,
          [id]: old[id] || createEmptyScreenshots()
        }));
      }
      return next;
    });
  };

  // Continue from Step 1 (Events)
  const handleEventsContinue = () => {
    if (selectedEventIds.length === 1) {
      setRegistrationMode("same-team");
      setCurrentStep(3); // Skip Team Mode Selection
    } else {
      setCurrentStep(2);
    }
  };

  // Continue from Step 2 (Team Mode)
  const handleModeContinue = () => {
    setCurrentStep(3);
  };

  // Step 3: Handle Team Form Changes with dynamic screenshot cleanup
  const handleSharedTeamChange = (newTeam) => {
    setSharedTeam(newTeam);
    if (Object.keys(sharedTeamErrors).length > 0) {
      setSharedTeamErrors({});
    }

    // Dynamic cleanup: if Member 2 or 3 is removed, clean up associated screenshot
    const m2HasName = Boolean(newTeam.member2?.name?.trim());
    const m3HasName = Boolean(newTeam.member3?.name?.trim());

    setSharedTransactionScreenshots((prev) => {
      let updated = false;
      const next = { ...prev };

      if (!m2HasName && next.member2) {
        if (next.member2?.previewUrl) URL.revokeObjectURL(next.member2.previewUrl);
        next.member2 = null;
        updated = true;
      }
      if (!m3HasName && next.member3) {
        if (next.member3?.previewUrl) URL.revokeObjectURL(next.member3.previewUrl);
        next.member3 = null;
        updated = true;
      }

      return updated ? next : prev;
    });
  };

  const handleEventTeamChange = (eventId, newTeam) => {
    setTeamsByEvent((prev) => ({
      ...prev,
      [eventId]: newTeam
    }));
    if (errorsByEvent[eventId]) {
      setErrorsByEvent((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    }

    // Dynamic cleanup: if Member 2 or 3 is removed, clean up associated screenshot
    const m2HasName = Boolean(newTeam.member2?.name?.trim());
    const m3HasName = Boolean(newTeam.member3?.name?.trim());

    setTransactionScreenshotsByEvent((prev) => {
      const eventScreenshots = prev[eventId] || createEmptyScreenshots();
      let updated = false;
      const nextEvent = { ...eventScreenshots };

      if (!m2HasName && nextEvent.member2) {
        if (nextEvent.member2?.previewUrl) URL.revokeObjectURL(nextEvent.member2.previewUrl);
        nextEvent.member2 = null;
        updated = true;
      }
      if (!m3HasName && nextEvent.member3) {
        if (nextEvent.member3?.previewUrl) URL.revokeObjectURL(nextEvent.member3.previewUrl);
        nextEvent.member3 = null;
        updated = true;
      }

      if (updated) {
        return {
          ...prev,
          [eventId]: nextEvent
        };
      }
      return prev;
    });
  };

  // Copy previous event's team using deep cloning (structuredClone)
  const handleCopyPreviousTeam = (currentIndex) => {
    if (currentIndex <= 0) return;
    const prevEventId = selectedEventIds[currentIndex - 1];
    const prevTeam = teamsByEvent[prevEventId] || sharedTeam;
    const prevScreenshots = transactionScreenshotsByEvent[prevEventId] || sharedTransactionScreenshots;

    const currentEventId = selectedEventIds[currentIndex];

    // Deep clone team state
    const clonedTeam = structuredClone(prevTeam);

    // Copy transaction screenshot references into an independent new object
    const clonedScreenshots = {
      teamLeader: prevScreenshots.teamLeader ? { ...prevScreenshots.teamLeader } : null,
      member1: prevScreenshots.member1 ? { ...prevScreenshots.member1 } : null,
      member2: prevScreenshots.member2 ? { ...prevScreenshots.member2 } : null,
      member3: prevScreenshots.member3 ? { ...prevScreenshots.member3 } : null
    };

    setTeamsByEvent((prev) => ({
      ...prev,
      [currentEventId]: clonedTeam
    }));

    setTransactionScreenshotsByEvent((prev) => ({
      ...prev,
      [currentEventId]: clonedScreenshots
    }));
  };

  // Continue from Step 3 (Team Details)
  const handleDetailsContinue = () => {
    let hasError = false;

    if (registrationMode === "same-team") {
      const validation = validateTeam(sharedTeam);
      if (!validation.isValid) {
        setSharedTeamErrors(validation.errors);
        hasError = true;
      } else {
        setSharedTeamErrors({});
      }
    } else {
      const newErrorsByEvent = {};
      for (const eventId of selectedEventIds) {
        const team = teamsByEvent[eventId] || createEmptyTeam();
        const validation = validateTeam(team);
        if (!validation.isValid) {
          newErrorsByEvent[eventId] = validation.errors;
          hasError = true;
        }
      }
      setErrorsByEvent(newErrorsByEvent);
    }

    if (hasError) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 4: Handle Transaction Screenshot Uploads
  // For same-team mode:
  const handleUploadSharedScreenshot = (memberKey, file) => {
    const previewUrl = URL.createObjectURL(file);
    setSharedTransactionScreenshots((prev) => {
      if (prev[memberKey]?.previewUrl) {
        URL.revokeObjectURL(prev[memberKey].previewUrl);
      }
      return {
        ...prev,
        [memberKey]: { file, previewUrl }
      };
    });

    if (sharedScreenshotErrors[memberKey]) {
      setSharedScreenshotErrors((prev) => {
        const next = { ...prev };
        delete next[memberKey];
        return next;
      });
    }
  };

  const handleRemoveSharedScreenshot = (memberKey) => {
    setSharedTransactionScreenshots((prev) => {
      if (prev[memberKey]?.previewUrl) {
        URL.revokeObjectURL(prev[memberKey].previewUrl);
      }
      return {
        ...prev,
        [memberKey]: null
      };
    });
  };

  // For different-team mode:
  const handleUploadEventScreenshot = (eventId, memberKey, file) => {
    const previewUrl = URL.createObjectURL(file);
    setTransactionScreenshotsByEvent((prev) => {
      const eventScreenshots = prev[eventId] || createEmptyScreenshots();
      if (eventScreenshots[memberKey]?.previewUrl) {
        URL.revokeObjectURL(eventScreenshots[memberKey].previewUrl);
      }
      return {
        ...prev,
        [eventId]: {
          ...eventScreenshots,
          [memberKey]: { file, previewUrl }
        }
      };
    });

    if (screenshotErrorsByEvent[eventId]?.[memberKey]) {
      setScreenshotErrorsByEvent((prev) => {
        const nextEventErrors = { ...(prev[eventId] || {}) };
        delete nextEventErrors[memberKey];
        return {
          ...prev,
          [eventId]: nextEventErrors
        };
      });
    }
  };

  const handleRemoveEventScreenshot = (eventId, memberKey) => {
    setTransactionScreenshotsByEvent((prev) => {
      const eventScreenshots = prev[eventId] || createEmptyScreenshots();
      if (eventScreenshots[memberKey]?.previewUrl) {
        URL.revokeObjectURL(eventScreenshots[memberKey].previewUrl);
      }
      return {
        ...prev,
        [eventId]: {
          ...eventScreenshots,
          [memberKey]: null
        }
      };
    });
  };

  // Continue from Step 4 (Uploads)
  const handleUploadsContinue = () => {
    if (registrationMode === "same-team") {
      const activeKeys = getActiveMemberKeys(sharedTeam);
      const validation = validateTransactionScreenshots(
        sharedTransactionScreenshots,
        activeKeys
      );

      if (!validation.isValid) {
        setSharedScreenshotErrors(validation.errors);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setSharedScreenshotErrors({});
    } else {
      let hasError = false;
      const newErrorsByEvent = {};

      for (const eventId of selectedEventIds) {
        const team = teamsByEvent[eventId] || createEmptyTeam();
        const activeKeys = getActiveMemberKeys(team);
        const eventScreenshots = transactionScreenshotsByEvent[eventId] || createEmptyScreenshots();

        const validation = validateTransactionScreenshots(
          eventScreenshots,
          activeKeys
        );

        if (!validation.isValid) {
          newErrorsByEvent[eventId] = validation.errors;
          hasError = true;
        }
      }

      if (hasError) {
        setScreenshotErrorsByEvent(newErrorsByEvent);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setScreenshotErrorsByEvent({});
    }

    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Back Navigation Handlers
  const handleBackFromMode = () => setCurrentStep(1);
  const handleBackFromDetails = () => (selectedEventIds.length === 1 ? setCurrentStep(1) : setCurrentStep(2));
  const handleBackFromUploads = () => setCurrentStep(3);
  const handleBackFromReview = () => setCurrentStep(4);

  // Final Submission to Google Apps Script
  const handleFinalSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    setSubmitError("");

    // Generate unique client submission ID for concurrency idempotency
    const clientSubmissionId = "tbs26_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);

    try {
      const isSameTeam = registrationMode === "same-team";

      if (isSameTeam) {
        // 1. Convert active members' transaction screenshots to Base64
        const activeKeys = getActiveMemberKeys(sharedTeam);
        const convertedScreenshots = {};

        for (const key of activeKeys) {
          const item = sharedTransactionScreenshots[key];
          if (!item || !item.file) {
            throw new Error(`Missing required transaction screenshot for ${key}.`);
          }
          convertedScreenshots[key] = await fileToBase64(item.file);
        }

        // Build shared team object
        const teamObj = {
          teamName: sharedTeam.teamName.trim(),
          teamLeader: {
            name: sharedTeam.teamLeader.name.trim(),
            participantId: sharedTeam.teamLeader.participantId.trim(),
            mobile: sharedTeam.teamLeader.mobile.trim(),
            transactionId: (sharedTeam.teamLeader.transactionId || "").trim()
          },
          member1: {
            name: sharedTeam.member1.name.trim(),
            participantId: sharedTeam.member1.participantId.trim(),
            mobile: sharedTeam.member1.mobile.trim(),
            transactionId: (sharedTeam.member1.transactionId || "").trim()
          }
        };
        if (sharedTeam.member2?.name?.trim()) {
          teamObj.member2 = {
            name: sharedTeam.member2.name.trim(),
            participantId: sharedTeam.member2.participantId.trim(),
            mobile: sharedTeam.member2.mobile.trim(),
            transactionId: (sharedTeam.member2.transactionId || "").trim()
          };
        }
        if (sharedTeam.member3?.name?.trim()) {
          teamObj.member3 = {
            name: sharedTeam.member3.name.trim(),
            participantId: sharedTeam.member3.participantId.trim(),
            mobile: sharedTeam.member3.mobile.trim(),
            transactionId: (sharedTeam.member3.transactionId || "").trim()
          };
        }

        // Only include screenshots for members that actually exist - never duplicate leader/member1 screenshots
        const memberScreenshots = [
          convertedScreenshots.teamLeader,
          convertedScreenshots.member1,
          convertedScreenshots.member2 || null,
          convertedScreenshots.member3 || null
        ].filter(Boolean);

        // Registrations array for each selected event
        const registrations = selectedEventIds.map((eventId) => {
          const eventMeta = getEventById(eventId);
          return {
            event: eventMeta.apiName,
            team: teamObj,
            transactionScreenshots: convertedScreenshots,
            screenshots: memberScreenshots
          };
        });

        const payload = {
          clientSubmissionId,
          registrationMode: "same-team",
          sameTeamAcrossEvents: true,
          transactionScreenshots: convertedScreenshots,
          registrations: registrations
        };

        // Sanitized diagnostic payload log (No Base64 / No PII)
        console.log("[TECHBYTE DIAGNOSTIC] Sanitized Submission Payload (Same-Team):", {
          events: payload.registrations.map((r) => r.event),
          registrationMode: payload.registrationMode,
          sameTeamAcrossEvents: payload.sameTeamAcrossEvents,
          teamMemberNames: {
            leader: teamObj.teamLeader?.name,
            member1: teamObj.member1?.name,
            member2: teamObj.member2?.name || "(none)",
            member3: teamObj.member3?.name || "(none)"
          },
          transactionIdPresence: {
            leader: Boolean(teamObj.teamLeader?.transactionId),
            member1: Boolean(teamObj.member1?.transactionId),
            member2: Boolean(teamObj.member2?.transactionId),
            member3: Boolean(teamObj.member3?.transactionId)
          },
          transactionScreenshotKeys: Object.keys(convertedScreenshots),
          screenshotCount: Object.keys(convertedScreenshots).length
        });

        const response = await submitRegistration(payload);
        setRegistrationResult(response);
      } else {
        // Different Teams flow
        const registrations = await Promise.all(
          selectedEventIds.map(async (eventId) => {
            const eventMeta = getEventById(eventId);
            const team = teamsByEvent[eventId] || sharedTeam;
            const activeKeys = getActiveMemberKeys(team);
            const eventScreenshots = transactionScreenshotsByEvent[eventId] || createEmptyScreenshots();

            const convertedScreenshots = {};
            for (const key of activeKeys) {
              const item = eventScreenshots[key];
              if (!item || !item.file) {
                throw new Error(`Missing required transaction screenshot for ${team.teamName || eventMeta.title}.`);
              }
              convertedScreenshots[key] = await fileToBase64(item.file);
            }

            const teamObj = {
              teamName: team.teamName.trim(),
              teamLeader: {
                name: team.teamLeader.name.trim(),
                participantId: team.teamLeader.participantId.trim(),
                mobile: team.teamLeader.mobile.trim(),
                transactionId: (team.teamLeader.transactionId || "").trim()
              },
              member1: {
                name: team.member1.name.trim(),
                participantId: team.member1.participantId.trim(),
                mobile: team.member1.mobile.trim(),
                transactionId: (team.member1.transactionId || "").trim()
              }
            };
            if (team.member2?.name?.trim()) {
              teamObj.member2 = {
                name: team.member2.name.trim(),
                participantId: team.member2.participantId.trim(),
                mobile: team.member2.mobile.trim(),
                transactionId: (team.member2.transactionId || "").trim()
              };
            }
            if (team.member3?.name?.trim()) {
              teamObj.member3 = {
                name: team.member3.name.trim(),
                participantId: team.member3.participantId.trim(),
                mobile: team.member3.mobile.trim(),
                transactionId: (team.member3.transactionId || "").trim()
              };
            }

            // Only include screenshots for members that actually exist - never duplicate leader/member1 screenshots
            const memberScreenshots = [
              convertedScreenshots.teamLeader,
              convertedScreenshots.member1,
              convertedScreenshots.member2 || null,
              convertedScreenshots.member3 || null
            ].filter(Boolean);

            return {
              event: eventMeta.apiName,
              team: teamObj,
              transactionScreenshots: convertedScreenshots,
              screenshots: memberScreenshots
            };
          })
        );

        const payload = {
          clientSubmissionId,
          registrationMode: "different-team",
          sameTeamAcrossEvents: false,
          registrations: registrations
        };

        // Sanitized diagnostic payload log (No Base64 / No PII)
        console.log("[TECHBYTE DIAGNOSTIC] Sanitized Submission Payload (Different-Teams):", {
          registrationMode: payload.registrationMode,
          sameTeamAcrossEvents: payload.sameTeamAcrossEvents,
          events: payload.registrations.map((r) => r.event),
          teams: payload.registrations.map((r) => ({
            event: r.event,
            teamMemberNames: {
              leader: r.team.teamLeader?.name,
              member1: r.team.member1?.name,
              member2: r.team.member2?.name || "(none)",
              member3: r.team.member3?.name || "(none)"
            },
            transactionIdPresence: {
              leader: Boolean(r.team.teamLeader?.transactionId),
              member1: Boolean(r.team.member1?.transactionId),
              member2: Boolean(r.team.member2?.transactionId),
              member3: Boolean(r.team.member3?.transactionId)
            },
            transactionScreenshotKeys: Object.keys(r.transactionScreenshots || {}),
            screenshotCount: Object.keys(r.transactionScreenshots || {}).length
          }))
        });

        const response = await submitRegistration(payload);
        setRegistrationResult(response);
      }

      setCurrentStep(6); // Success Screen
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("[TECHBYTE SUMMIT 26] Submission Error:", err);
      setSubmitError(
        err.message || "Something went wrong while submitting your registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to initial state
  const handleResetRegistration = () => {
    // Revoke object URLs to prevent memory leaks
    Object.values(sharedTransactionScreenshots).forEach((item) => {
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    Object.values(transactionScreenshotsByEvent).forEach((map) => {
      Object.values(map || {}).forEach((item) => {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    });

    setSelectedEventIds([]);
    setRegistrationMode("same-team");
    setSharedTeam(createEmptyTeam());
    setTeamsByEvent({});
    setSharedTeamErrors({});
    setErrorsByEvent({});
    setSharedTransactionScreenshots(createEmptyScreenshots());
    setTransactionScreenshotsByEvent({});
    setSharedScreenshotErrors({});
    setScreenshotErrorsByEvent({});
    setSubmitError("");
    setRegistrationResult(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 flex flex-col font-sans">
      <Header />

      {/* Progress Wizard (Screens 1 to 5) */}
      {currentStep <= 5 && (
        <ProgressIndicator
          currentStep={currentStep}
          hasMultipleEvents={hasMultipleEvents}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* SCREEN 1: Event Selection */}
        {currentStep === 1 && (
          <EventSelection
            selectedEventIds={selectedEventIds}
            onToggleEvent={handleToggleEvent}
            onContinue={handleEventsContinue}
          />
        )}

        {/* SCREEN 2: Team Mode Selection (only if > 1 event selected) */}
        {currentStep === 2 && (
          <TeamModeSelection
            registrationMode={registrationMode}
            onSelectMode={setRegistrationMode}
            onContinue={handleModeContinue}
            onBack={handleBackFromMode}
          />
        )}

        {/* SCREEN 3: Team Details */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-semibold mb-2 block">
                Step {hasMultipleEvents ? "03" : "02"} &bull; Roster Information
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl tracking-wider text-white uppercase">
                TEAM DETAILS
              </h1>
              <p className="mt-3 text-base text-slate-300">
                {registrationMode === "same-team"
                  ? "Enter the team details to be used for your selected events."
                  : "Provide individual team details for each selected event."}
              </p>
            </div>

            {/* Same Team Form */}
            {registrationMode === "same-team" ? (
              <div className="space-y-6 mb-8">
                <TeamForm
                  eventTitle={
                    selectedEventIds.length === 1
                      ? getEventById(selectedEventIds[0])?.title
                      : "Shared Team Details"
                  }
                  eventSubtitle={
                    selectedEventIds.length === 1
                      ? getEventById(selectedEventIds[0])?.subtitle
                      : `Applies to ${selectedEventIds.length} Selected Events`
                  }
                  teamData={sharedTeam}
                  onChangeTeam={handleSharedTeamChange}
                  errors={sharedTeamErrors}
                />
              </div>
            ) : (
              /* Different Teams Forms */
              <div className="space-y-8 mb-8">
                {selectedEventIds.map((eventId, idx) => {
                  const eventMeta = getEventById(eventId);
                  const teamData = teamsByEvent[eventId] || createEmptyTeam();
                  const prevEventMeta = idx > 0 ? getEventById(selectedEventIds[idx - 1]) : null;

                  return (
                    <TeamForm
                      key={eventId}
                      eventTitle={eventMeta?.title}
                      eventSubtitle={eventMeta?.subtitle}
                      teamData={teamData}
                      onChangeTeam={(newTeam) => handleEventTeamChange(eventId, newTeam)}
                      errors={errorsByEvent[eventId] || {}}
                      canCopyPrevious={idx > 0}
                      previousEventTitle={prevEventMeta?.title}
                      onCopyFromPrevious={() => handleCopyPreviousTeam(idx)}
                    />
                  );
                })}
              </div>
            )}

            {/* Step 3 Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBackFromDetails}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleDetailsContinue}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-heading text-xl tracking-wider uppercase text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-xl shadow-rose-950/50 border border-rose-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: Transaction Screenshots (Team-Level, strictly dynamic) */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-semibold mb-2 block">
                Step {hasMultipleEvents ? "04" : "03"} &bull; Payment Verification
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl tracking-wider text-white uppercase">
                TRANSACTION SCREENSHOTS
              </h1>
              <p className="mt-3 text-base text-slate-300">
                Upload the Ticket9 transaction screenshot for each team member.
              </p>
            </div>

            {/* Same Team Mode: Exactly ONE section for the entire team registration */}
            {registrationMode === "same-team" ? (
              <div className="mb-8">
                <ScreenshotUpload
                  teamTitle={sharedTeam.teamName || "Team"}
                  teamMembers={sharedTeam}
                  activeMemberKeys={getActiveMemberKeys(sharedTeam)}
                  transactionScreenshots={sharedTransactionScreenshots}
                  errors={sharedScreenshotErrors}
                  onUploadMemberScreenshot={handleUploadSharedScreenshot}
                  onRemoveMemberScreenshot={handleRemoveSharedScreenshot}
                  isMultipleEvents={hasMultipleEvents}
                />
              </div>
            ) : (
              /* Different Teams Mode: One section per team */
              <div className="space-y-8 mb-8">
                {selectedEventIds.map((eventId) => {
                  const eventMeta = getEventById(eventId);
                  const team = teamsByEvent[eventId] || createEmptyTeam();
                  const eventScreenshots = transactionScreenshotsByEvent[eventId] || createEmptyScreenshots();
                  const eventErrors = screenshotErrorsByEvent[eventId] || {};

                  return (
                    <ScreenshotUpload
                      key={eventId}
                      teamTitle={`${eventMeta?.title} (${team.teamName || "Team"})`}
                      teamMembers={team}
                      activeMemberKeys={getActiveMemberKeys(team)}
                      transactionScreenshots={eventScreenshots}
                      errors={eventErrors}
                      onUploadMemberScreenshot={(memberKey, file) =>
                        handleUploadEventScreenshot(eventId, memberKey, file)
                      }
                      onRemoveMemberScreenshot={(memberKey) =>
                        handleRemoveEventScreenshot(eventId, memberKey)
                      }
                      isMultipleEvents={false}
                    />
                  );
                })}
              </div>
            )}

            {/* Step 4 Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBackFromUploads}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleUploadsContinue}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-heading text-xl tracking-wider uppercase text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-xl shadow-rose-950/50 border border-rose-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>CONTINUE TO REVIEW</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: Review & Final Submit */}
        {currentStep === 5 && (
          <ReviewRegistration
            selectedEventIds={selectedEventIds}
            registrationMode={registrationMode}
            sameTeamAcrossEvents={registrationMode === "same-team"}
            teamsByEvent={teamsByEvent}
            sharedTeam={sharedTeam}
            sharedTransactionScreenshots={sharedTransactionScreenshots}
            transactionScreenshotsByEvent={transactionScreenshotsByEvent}
            onSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onEditStep={(step) => setCurrentStep(step)}
            onBack={handleBackFromReview}
          />
        )}

        {/* SCREEN 6: Success */}
        {currentStep === 6 && (
          <SuccessScreen
            registrationResult={registrationResult}
            onReset={handleResetRegistration}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#06070c] py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; TECHBYTE SUMMIT 26. All rights reserved.</span>
          <span>Official Team Event Registration Portal</span>
        </div>
      </footer>
    </div>
  );
}
