/**
 * Validation rules and helpers for TECHBYTE SUMMIT 26
 * Updated with required Transaction ID validation for all existing members.
 */

export const MEMBER_ROLE_LABELS = {
  teamLeader: "Team Leader",
  member1: "Member 1",
  member2: "Member 2",
  member3: "Member 3"
};

export const MEMBER_SCREENSHOT_LABELS = {
  teamLeader: "Team Leader Transaction Screenshot",
  member1: "Member 1 Transaction Screenshot",
  member2: "Member 2 Transaction Screenshot",
  member3: "Member 3 Transaction Screenshot"
};

export function isValidMobile(mobile) {
  if (!mobile) return false;
  // Clean string and test for 10 digits (common for Indian mobile numbers)
  const cleaned = mobile.trim();
  return /^[6-9]\d{9}$/.test(cleaned) || /^\d{10}$/.test(cleaned);
}

export function isValidParticipantId(id) {
  if (!id) return false;
  const trimmed = id.trim();
  return trimmed.length >= 3;
}

/**
 * Returns an array of active member keys present in the team.
 * Leader and Member 1 are always mandatory.
 * Member 2 and Member 3 are included only if their details are populated.
 *
 * @param {Object} team
 * @returns {Array<"teamLeader" | "member1" | "member2" | "member3">}
 */
export function getActiveMemberKeys(team = {}) {
  const keys = ["teamLeader", "member1"];
  const m2 = team.member2 || {};
  if (
    (m2.name && m2.name.trim() !== "") ||
    (m2.participantId && m2.participantId.trim() !== "") ||
    (m2.mobile && m2.mobile.trim() !== "") ||
    (m2.transactionId && m2.transactionId.trim() !== "")
  ) {
    keys.push("member2");
  }
  const m3 = team.member3 || {};
  if (
    (m3.name && m3.name.trim() !== "") ||
    (m3.participantId && m3.participantId.trim() !== "") ||
    (m3.mobile && m3.mobile.trim() !== "") ||
    (m3.transactionId && m3.transactionId.trim() !== "")
  ) {
    keys.push("member3");
  }
  return keys;
}

/**
 * Validates a single team's details.
 * Leader and Member 1 require Name, Participant ID, Mobile, and Transaction ID.
 * Member 2 and Member 3 are optional, but if added, ALL their fields are required.
 *
 * @param {Object} team
 * @returns {{ isValid: boolean, errors: Record<string, string>, memberCount: number }}
 */
export function validateTeam(team = {}) {
  const errors = {};

  if (!team.teamName || team.teamName.trim() === "") {
    errors.teamName = "Team name is required.";
  }

  // Team Leader (Mandatory)
  const leader = team.teamLeader || {};
  if (!leader.name || leader.name.trim() === "") {
    errors["teamLeader.name"] = "Team Leader name is required.";
  }
  if (!leader.participantId || leader.participantId.trim() === "") {
    errors["teamLeader.participantId"] = "Team Leader Participant ID is required.";
  }
  if (!leader.mobile || leader.mobile.trim() === "") {
    errors["teamLeader.mobile"] = "Team Leader mobile number is required.";
  } else if (!isValidMobile(leader.mobile)) {
    errors["teamLeader.mobile"] = "Enter a valid 10-digit mobile number.";
  }
  if (!leader.transactionId || leader.transactionId.trim() === "") {
    errors["teamLeader.transactionId"] = "Ticket9 Transaction ID is required.";
  }

  // Member 1 (Mandatory)
  const member1 = team.member1 || {};
  if (!member1.name || member1.name.trim() === "") {
    errors["member1.name"] = "Member 1 name is required.";
  }
  if (!member1.participantId || member1.participantId.trim() === "") {
    errors["member1.participantId"] = "Member 1 Participant ID is required.";
  }
  if (!member1.mobile || member1.mobile.trim() === "") {
    errors["member1.mobile"] = "Member 1 mobile number is required.";
  } else if (!isValidMobile(member1.mobile)) {
    errors["member1.mobile"] = "Enter a valid 10-digit mobile number.";
  }
  if (!member1.transactionId || member1.transactionId.trim() === "") {
    errors["member1.transactionId"] = "Ticket9 Transaction ID is required.";
  }

  let memberCount = 2; // Leader + Member 1

  // Member 2 (Optional, but if added, ALL fields are required)
  const member2 = team.member2 || {};
  const m2HasAny = Boolean(
    (member2.name && member2.name.trim() !== "") ||
    (member2.participantId && member2.participantId.trim() !== "") ||
    (member2.mobile && member2.mobile.trim() !== "") ||
    (member2.transactionId && member2.transactionId.trim() !== "")
  );

  if (m2HasAny) {
    if (!member2.name || member2.name.trim() === "") {
      errors["member2.name"] = "Member 2 name is required.";
    }
    if (!member2.participantId || member2.participantId.trim() === "") {
      errors["member2.participantId"] = "Member 2 Participant ID is required.";
    }
    if (!member2.mobile || member2.mobile.trim() === "") {
      errors["member2.mobile"] = "Member 2 mobile number is required.";
    } else if (!isValidMobile(member2.mobile)) {
      errors["member2.mobile"] = "Enter a valid 10-digit mobile number.";
    }
    if (!member2.transactionId || member2.transactionId.trim() === "") {
      errors["member2.transactionId"] = "Ticket9 Transaction ID is required.";
    }

    if (
      member2.name?.trim() &&
      member2.participantId?.trim() &&
      isValidMobile(member2.mobile) &&
      member2.transactionId?.trim()
    ) {
      memberCount += 1;
    }
  }

  // Member 3 (Optional, but if added, ALL fields are required)
  const member3 = team.member3 || {};
  const m3HasAny = Boolean(
    (member3.name && member3.name.trim() !== "") ||
    (member3.participantId && member3.participantId.trim() !== "") ||
    (member3.mobile && member3.mobile.trim() !== "") ||
    (member3.transactionId && member3.transactionId.trim() !== "")
  );

  if (m3HasAny) {
    if (!m2HasAny) {
      errors["member3.name"] = "Please fill in Member 2 before adding Member 3.";
    }
    if (!member3.name || member3.name.trim() === "") {
      errors["member3.name"] = "Member 3 name is required.";
    }
    if (!member3.participantId || member3.participantId.trim() === "") {
      errors["member3.participantId"] = "Member 3 Participant ID is required.";
    }
    if (!member3.mobile || member3.mobile.trim() === "") {
      errors["member3.mobile"] = "Member 3 mobile number is required.";
    } else if (!isValidMobile(member3.mobile)) {
      errors["member3.mobile"] = "Enter a valid 10-digit mobile number.";
    }
    if (!member3.transactionId || member3.transactionId.trim() === "") {
      errors["member3.transactionId"] = "Ticket9 Transaction ID is required.";
    }

    if (
      member3.name?.trim() &&
      member3.participantId?.trim() &&
      isValidMobile(member3.mobile) &&
      member3.transactionId?.trim()
    ) {
      memberCount += 1;
    }
  }

  // Strict team size validation: 2 to 4
  if (memberCount < 2) {
    errors.teamSize = "Every team must have a minimum of 2 members (Leader + Member 1).";
  } else if (memberCount > 4) {
    errors.teamSize = "Maximum team size is 4 members.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    memberCount
  };
}

/**
 * Validates transaction screenshots for a team.
 * The number of required transaction screenshots strictly equals the team size (2 to 4).
 *
 * @param {Record<string, {file?: File, previewUrl?: string} | null>} transactionScreenshots
 * @param {Object | Array<string>} teamOrActiveKeys
 * @returns {{ isValid: boolean, missingMembers: string[], errors: Record<string, string>, requiredCount: number }}
 */
export function validateTransactionScreenshots(transactionScreenshots = {}, teamOrActiveKeys) {
  const activeKeys = Array.isArray(teamOrActiveKeys)
    ? teamOrActiveKeys
    : getActiveMemberKeys(teamOrActiveKeys);

  const missingMembers = [];
  const errors = {};

  for (const key of activeKeys) {
    const item = transactionScreenshots[key];
    if (!item || !item.file) {
      missingMembers.push(key);
      const roleLabel = MEMBER_ROLE_LABELS[key] || key;
      errors[key] = `Please upload the transaction screenshot for ${roleLabel}.`;
    }
  }

  return {
    isValid: missingMembers.length === 0,
    missingMembers,
    errors,
    requiredCount: activeKeys.length
  };
}
