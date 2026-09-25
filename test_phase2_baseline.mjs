/**
 * PHASE 2 — Single Baseline Registration Test
 * Synthetic 2-member registration with prefix LOADTEST_TBS26_
 */

const ENDPOINT = "https://script.google.com/macros/s/AKfycbyIIyg2C5VOVYKXagutyVlLsMv4xxZ97tiFUbm7R3zzI1KQXpEXmmjCJDacG36YitIR/exec";
const DUMMY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function runBaseline() {
  console.log("=== PHASE 2: EXECUTING SINGLE BASELINE REGISTRATION ===");
  const submissionId = "LOADTEST_TBS26_BASE_" + Date.now();

  const payload = {
    clientSubmissionId: submissionId,
    registrationMode: "same-team",
    sameTeamAcrossEvents: true,
    transactionScreenshots: {
      teamLeader: { data: DUMMY_PNG_BASE64, name: "leader_receipt.png", mimeType: "image/png" },
      member1: { data: DUMMY_PNG_BASE64, name: "m1_receipt.png", mimeType: "image/png" }
    },
    registrations: [
      {
        event: "Paper Presentation",
        team: {
          teamName: "LOADTEST_TBS26_BaselineTeam",
          teamLeader: {
            name: "LOADTEST Leader",
            participantId: "LOADTEST-TBS-01",
            mobile: "9000000001",
            transactionId: "TXN-LOADTEST-001"
          },
          member1: {
            name: "LOADTEST Member1",
            participantId: "LOADTEST-TBS-02",
            mobile: "9000000002",
            transactionId: "TXN-LOADTEST-002"
          }
        }
      }
    ]
  };

  const startTime = Date.now();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const duration = Date.now() - startTime;
  const text = await res.text();
  console.log("HTTP Status:", res.status);
  console.log("Latency:", duration + "ms");
  console.log("Raw Response:", text);

  let json = {};
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("JSON parse error:", err);
  }

  console.log("Parsed JSON:", JSON.stringify(json, null, 2));

  if (json.success && json.registrations?.[0]?.registrationId) {
    console.log("✅ PHASE 2 SUCCESS: Registration ID:", json.registrations[0].registrationId);
  } else {
    console.error("❌ PHASE 2 FAILED");
    process.exit(1);
  }
}

runBaseline();
