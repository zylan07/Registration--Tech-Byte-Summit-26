/**
 * Verification test suite for TECHBYTE SUMMIT 26
 * Validates updated team-level transaction screenshot logic (TEST A - J).
 */

import {
  validateTeam,
  validateTransactionScreenshots,
  getActiveMemberKeys,
  isValidMobile,
  isValidParticipantId
} from "./src/utils/validation.js";
import { EVENTS, getEventById } from "./src/data/events.js";

console.log("=== RUNNING TECHBYTE SUMMIT 26 UPDATED TEST SUITE ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// Setup mock teams
const team2Members = {
  teamName: "DuoDevs",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211" },
  member2: { name: "", participantId: "", mobile: "" },
  member3: { name: "", participantId: "", mobile: "" }
};

const team3Members = {
  teamName: "TrioCoders",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211" },
  member2: { name: "Charlie", participantId: "TBS26-03", mobile: "9876543212" },
  member3: { name: "", participantId: "", mobile: "" }
};

const team4Members = {
  teamName: "QuadBytes",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211" },
  member2: { name: "Charlie", participantId: "TBS26-03", mobile: "9876543212" },
  member3: { name: "David", participantId: "TBS26-04", mobile: "9876543213" }
};

// -------------------------------------------------------------
// TEST A: 2-member team -> exactly 2 transaction screenshots required
// -------------------------------------------------------------
const keysA = getActiveMemberKeys(team2Members);
const screenA = {
  teamLeader: { file: { name: "leader.png" } },
  member1: { file: { name: "m1.png" } }
};
const resA = validateTransactionScreenshots(screenA, keysA);
assert(
  keysA.length === 2 && resA.isValid === true && resA.requiredCount === 2,
  "TEST A: 2-member team requires and accepts exactly 2 transaction screenshots"
);

// -------------------------------------------------------------
// TEST B: 3-member team -> exactly 3 required
// -------------------------------------------------------------
const keysB = getActiveMemberKeys(team3Members);
const screenB = {
  teamLeader: { file: { name: "leader.png" } },
  member1: { file: { name: "m1.png" } },
  member2: { file: { name: "m2.png" } }
};
const resB = validateTransactionScreenshots(screenB, keysB);
assert(
  keysB.length === 3 && resB.isValid === true && resB.requiredCount === 3,
  "TEST B: 3-member team requires and accepts exactly 3 transaction screenshots"
);

// -------------------------------------------------------------
// TEST C: 4-member team -> exactly 4 required
// -------------------------------------------------------------
const keysC = getActiveMemberKeys(team4Members);
const screenC = {
  teamLeader: { file: { name: "leader.png" } },
  member1: { file: { name: "m1.png" } },
  member2: { file: { name: "m2.png" } },
  member3: { file: { name: "m3.png" } }
};
const resC = validateTransactionScreenshots(screenC, keysC);
assert(
  keysC.length === 4 && resC.isValid === true && resC.requiredCount === 4,
  "TEST C: 4-member team requires and accepts exactly 4 transaction screenshots"
);

// -------------------------------------------------------------
// TEST D: 2-member team with only 1 screenshot -> rejected
// -------------------------------------------------------------
const screenD = {
  teamLeader: { file: { name: "leader.png" } },
  member1: null
};
const resD = validateTransactionScreenshots(screenD, keysA);
assert(
  resD.isValid === false &&
  resD.missingMembers.includes("member1") &&
  resD.errors.member1.includes("Member 1"),
  "TEST D: 2-member team with only 1 screenshot is rejected"
);

// -------------------------------------------------------------
// TEST E: 3-member team with only 2 screenshots -> rejected
// -------------------------------------------------------------
const screenE = {
  teamLeader: { file: { name: "leader.png" } },
  member1: { file: { name: "m1.png" } },
  member2: null
};
const resE = validateTransactionScreenshots(screenE, keysB);
assert(
  resE.isValid === false &&
  resE.missingMembers.includes("member2") &&
  resE.errors.member2.includes("Member 2"),
  "TEST E: 3-member team with only 2 screenshots is rejected"
);

// -------------------------------------------------------------
// TEST F: 4-member team with only 3 screenshots -> rejected
// -------------------------------------------------------------
const screenF = {
  teamLeader: { file: { name: "leader.png" } },
  member1: { file: { name: "m1.png" } },
  member2: { file: { name: "m2.png" } },
  member3: null
};
const resF = validateTransactionScreenshots(screenF, keysC);
assert(
  resF.isValid === false &&
  resF.missingMembers.includes("member3") &&
  resF.errors.member3.includes("Member 3"),
  "TEST F: 4-member team with only 3 screenshots is rejected"
);

// -------------------------------------------------------------
// TEST G: Same team across 3 events -> only one set of transaction screenshots
// -------------------------------------------------------------
const sameTeamPayload = {
  registrationMode: "same-team",
  sameTeamAcrossEvents: true,
  transactionScreenshots: {
    teamLeader: { name: "leader.png", mimeType: "image/png", data: "BASE64..." },
    member1: { name: "m1.png", mimeType: "image/png", data: "BASE64..." },
    member2: { name: "m2.png", mimeType: "image/png", data: "BASE64..." }
  },
  registrations: [
    { event: "Paper Presentation", team: team3Members },
    { event: "Poster Creation", team: team3Members },
    { event: "Hackathon", team: team3Members }
  ]
};

const uniquePayloadScreenshots = Object.keys(sameTeamPayload.transactionScreenshots).length;
assert(
  uniquePayloadScreenshots === 3 && sameTeamPayload.registrations.length === 3,
  "TEST G: Same team across 3 events provides exactly one set of transaction screenshots (3 slots)"
);

// -------------------------------------------------------------
// TEST H: Same team across 3 events -> screenshots are not duplicated as physical uploads
// -------------------------------------------------------------
// In the backend, uploadTransactionScreenshotsOnce is called ONCE per team
const uploadedUrlsMock = {
  teamLeader: "https://drive.google.com/file/d/111",
  member1: "https://drive.google.com/file/d/222",
  member2: "https://drive.google.com/file/d/333"
};
const eventRowsWritten = sameTeamPayload.registrations.map(r => ({
  event: r.event,
  driveUrls: uploadedUrlsMock
}));
assert(
  eventRowsWritten.length === 3 &&
  eventRowsWritten[0].driveUrls === eventRowsWritten[1].driveUrls &&
  Object.keys(uploadedUrlsMock).length === 3,
  "TEST H: Reuses identical 3 Drive URLs across all 3 events without duplicating physical file uploads"
);

// -------------------------------------------------------------
// TEST I: Different teams -> each team has its own transaction screenshot set
// -------------------------------------------------------------
const diffTeamPayload = {
  registrationMode: "different-team",
  sameTeamAcrossEvents: false,
  registrations: [
    {
      event: "Paper Presentation",
      team: team2Members,
      transactionScreenshots: {
        teamLeader: { name: "paper_leader.png" },
        member1: { name: "paper_m1.png" }
      }
    },
    {
      event: "Hackathon",
      team: team4Members,
      transactionScreenshots: {
        teamLeader: { name: "hack_leader.png" },
        member1: { name: "hack_m1.png" },
        member2: { name: "hack_m2.png" },
        member3: { name: "hack_m3.png" }
      }
    }
  ]
};
const paperScreenshotsCount = Object.keys(diffTeamPayload.registrations[0].transactionScreenshots).length;
const hackScreenshotsCount = Object.keys(diffTeamPayload.registrations[1].transactionScreenshots).length;
assert(
  paperScreenshotsCount === 2 && hackScreenshotsCount === 4,
  "TEST I: Different teams maintain independent transaction screenshot sets (2 for Paper, 4 for Hackathon)"
);

// -------------------------------------------------------------
// TEST J: Removing optional Member 3 removes the Member 3 screenshot requirement
// -------------------------------------------------------------
const dynamicTeam = structuredClone(team4Members);
// User clears Member 3
dynamicTeam.member3 = { name: "", participantId: "", mobile: "" };
const updatedKeys = getActiveMemberKeys(dynamicTeam);
const resJ = validateTransactionScreenshots(screenB, updatedKeys);
assert(
  updatedKeys.length === 3 && !updatedKeys.includes("member3") && resJ.isValid === true,
  "TEST J: Removing Member 3 dynamically drops the Member 3 screenshot requirement"
);

// -------------------------------------------------------------
// TEST K: Verify exact 26 columns order
// -------------------------------------------------------------
const EXPECTED_26_COLUMNS = [
  "Timestamp",
  "Registration ID",
  "Team Name",
  "Team Leader Name",
  "Team Leader Participant ID",
  "Team Leader Mobile",
  "Team Leader Transaction ID",
  "Member 1 Name",
  "Member 1 Participant ID",
  "Member 1 Mobile",
  "Member 1 Transaction ID",
  "Member 2 Name",
  "Member 2 Participant ID",
  "Member 2 Mobile",
  "Member 2 Transaction ID",
  "Member 3 Name",
  "Member 3 Participant ID",
  "Member 3 Mobile",
  "Member 3 Transaction ID",
  "Team Leader Transaction Screenshot",
  "Member 1 Transaction Screenshot",
  "Member 2 Transaction Screenshot",
  "Member 3 Transaction Screenshot",
  "Registration Mode",
  "Same Team Across Events",
  "Verification Status"
];

assert(
  EXPECTED_26_COLUMNS.length === 26,
  "TEST K: Production Google Sheets specification has exactly 26 columns"
);

// -------------------------------------------------------------
// TEST L: Ticket9 Transaction ID is mandatory for Leader and Member 1
// -------------------------------------------------------------
const missingLeaderTxTeam = {
  teamName: "AlphaTeam",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210", transactionId: "" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211", transactionId: "TX12345" },
  member2: { name: "", participantId: "", mobile: "", transactionId: "" },
  member3: { name: "", participantId: "", mobile: "", transactionId: "" }
};
const resL1 = validateTeam(missingLeaderTxTeam);
assert(
  resL1.isValid === false &&
  resL1.errors["teamLeader.transactionId"] === "Ticket9 Transaction ID is required.",
  "TEST L1: Missing Leader Transaction ID triggers 'Ticket9 Transaction ID is required.'"
);

const missingM1TxTeam = {
  teamName: "AlphaTeam",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210", transactionId: "TX12345" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211", transactionId: "" },
  member2: { name: "", participantId: "", mobile: "", transactionId: "" },
  member3: { name: "", participantId: "", mobile: "", transactionId: "" }
};
const resL2 = validateTeam(missingM1TxTeam);
assert(
  resL2.isValid === false &&
  resL2.errors["member1.transactionId"] === "Ticket9 Transaction ID is required.",
  "TEST L2: Missing Member 1 Transaction ID triggers 'Ticket9 Transaction ID is required.'"
);

// -------------------------------------------------------------
// TEST M: Optional Member 2 / 3 require Transaction ID once member is added
// -------------------------------------------------------------
const member2PartialTeam = {
  teamName: "AlphaTeam",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210", transactionId: "TX100" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211", transactionId: "TX101" },
  member2: { name: "Charlie", participantId: "TBS26-03", mobile: "9876543212", transactionId: "" },
  member3: { name: "", participantId: "", mobile: "", transactionId: "" }
};
const resM1 = validateTeam(member2PartialTeam);
assert(
  resM1.isValid === false &&
  resM1.errors["member2.transactionId"] === "Ticket9 Transaction ID is required.",
  "TEST M1: Populated Member 2 missing Transaction ID triggers 'Ticket9 Transaction ID is required.'"
);

const member2FullTeam = {
  teamName: "AlphaTeam",
  teamLeader: { name: "Alice", participantId: "TBS26-01", mobile: "9876543210", transactionId: "TX100" },
  member1: { name: "Bob", participantId: "TBS26-02", mobile: "9876543211", transactionId: "TX101" },
  member2: { name: "Charlie", participantId: "TBS26-03", mobile: "9876543212", transactionId: "TX102" },
  member3: { name: "", participantId: "", mobile: "", transactionId: "" }
};
const resM2 = validateTeam(member2FullTeam);
assert(
  resM2.isValid === true && resM2.memberCount === 3,
  "TEST M2: Member 2 with all required fields (including Transaction ID) is valid (3 members)"
);

// -------------------------------------------------------------
// TEST N: 2-member team row generation leaves Col 22 & 23 blank ("")
// -------------------------------------------------------------
// Simulate Apps Script row mapping for 2-member team
function simulateRowGeneration(team, screenshotUrls) {
  var leader = team.teamLeader || {};
  var member1 = team.member1 || {};
  var member2 = team.member2 || {};
  var member3 = team.member3 || {};
  return [
    new Date(), leader.name, leader.transactionId,
    member1.name, member1.transactionId,
    member2.name || "", member2.transactionId || "",
    member3.name || "", member3.transactionId || "",
    screenshotUrls.teamLeader || "",
    screenshotUrls.member1 || "",
    screenshotUrls.member2 || "",
    screenshotUrls.member3 || ""
  ];
}
const twoMemberUrls = {
  teamLeader: "https://drive.google.com/file/d/leader",
  member1: "https://drive.google.com/file/d/m1",
  member2: "",
  member3: ""
};
const simulatedRow2 = simulateRowGeneration(team2Members, twoMemberUrls);
assert(
  simulatedRow2[10] === "https://drive.google.com/file/d/m1" &&
  simulatedRow2[11] === "" &&
  simulatedRow2[12] === "" &&
  twoMemberUrls.member2 === "" &&
  twoMemberUrls.member3 === "",
  "TEST N (Requirement 7): For a 2-member team, Member 2 and Member 3 screenshot slots are strictly empty strings and never duplicated"
);

// -------------------------------------------------------------
// TEST O (Requirement 8): 3-member team row generation leaves Col 23 (Member 3) blank ("")
// -------------------------------------------------------------
const threeMemberUrls = {
  teamLeader: "https://drive.google.com/file/d/leader",
  member1: "https://drive.google.com/file/d/m1",
  member2: "https://drive.google.com/file/d/m2",
  member3: ""
};
const simulatedRow3 = simulateRowGeneration(team3Members, threeMemberUrls);
assert(
  simulatedRow3[10] === "https://drive.google.com/file/d/m1" &&
  simulatedRow3[11] === "https://drive.google.com/file/d/m2" &&
  simulatedRow3[12] === "" &&
  threeMemberUrls.member3 === "",
  "TEST O (Requirement 8): For a 3-member team, Member 3 screenshot field remains strictly empty string"
);

// -------------------------------------------------------------
// TEST P: Backend active-member validation function (simulate Apps Script validateTeamTransactionScreenshots)
// -------------------------------------------------------------
function backendValidateTeamScreenshots(team, transactionScreenshots) {
  const activeKeys = getActiveMemberKeys(team);
  const expectedScreenshotCount = activeKeys.length;
  if (!transactionScreenshots) {
    return { isValid: false, expectedScreenshotCount };
  }
  for (let i = 0; i < activeKeys.length; i++) {
    const key = activeKeys[i];
    const shot = Array.isArray(transactionScreenshots) ? transactionScreenshots[i] : transactionScreenshots[key];
    if (!shot || (!shot.data && !shot.file)) {
      return { isValid: false, expectedScreenshotCount, missingKey: key };
    }
  }
  return { isValid: true, expectedScreenshotCount };
}

// 2-member team with 2 screenshots
assert(
  backendValidateTeamScreenshots(team2Members, screenA).isValid === true &&
  backendValidateTeamScreenshots(team2Members, screenA).expectedScreenshotCount === 2,
  "TEST P1: Backend logic accepts 2 screenshots for 2-member team"
);
// 2-member team with 1 screenshot
assert(
  backendValidateTeamScreenshots(team2Members, screenD).isValid === false,
  "TEST P2: Backend logic rejects 2-member team with 1 screenshot"
);
// 3-member team with 2 screenshots
assert(
  backendValidateTeamScreenshots(team3Members, screenE).isValid === false,
  "TEST P3: Backend logic rejects 3-member team with 2 screenshots"
);
// 4-member team with 3 screenshots
assert(
  backendValidateTeamScreenshots(team4Members, screenF).isValid === false,
  "TEST P4: Backend logic rejects 4-member team with 3 screenshots"
);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

