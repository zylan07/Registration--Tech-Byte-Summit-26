/**
 * TECHBYTE SUMMIT 26 — Idempotency and Sheet Verification Test
 */

const ENDPOINT = "https://script.google.com/macros/s/AKfycbyIIyg2C5VOVYKXagutyVlLsMv4xxZ97tiFUbm7R3zzI1KQXpEXmmjCJDacG36YitIR/exec";
const DUMMY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testIdempotency() {
  console.log("=== RUNNING IDEMPOTENCY TEST ===");
  const testSubId = "idemp_test_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  const payload = {
    clientSubmissionId: testSubId,
    registrationMode: "same-team",
    sameTeamAcrossEvents: true,
    transactionScreenshots: {
      teamLeader: { data: DUMMY_PNG_BASE64, name: "leader_idemp.png", mimeType: "image/png" },
      member1: { data: DUMMY_PNG_BASE64, name: "m1_idemp.png", mimeType: "image/png" }
    },
    registrations: [
      {
        event: "Paper Presentation",
        team: {
          teamName: "Idempotent Team",
          teamLeader: {
            name: "Idemp Leader",
            participantId: "TBS-26-ID-0",
            mobile: "9876543210",
            transactionId: "TXN-IDEMP-001"
          },
          member1: {
            name: "Idemp Member1",
            participantId: "TBS-26-ID-1",
            mobile: "9876543211",
            transactionId: "TXN-IDEMP-002"
          }
        }
      }
    ]
  };

  console.log("1. Sending First Submission with clientSubmissionId:", testSubId);
  const res1 = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  const json1 = await res1.json();
  console.log("First Response:", json1);

  if (!json1.success || !json1.registrations?.[0]?.registrationId) {
    console.error("❌ First submission failed!");
    return false;
  }

  const firstRegId = json1.registrations[0].registrationId;
  console.log("Received Registration ID:", firstRegId);

  console.log("\n2. Sending Second Submission (DUPLICATE RETRY) with SAME clientSubmissionId:", testSubId);
  const res2 = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  const json2 = await res2.json();
  console.log("Second Response:", json2);

  if (!json2.success || !json2.registrations?.[0]?.registrationId) {
    console.error("❌ Second submission failed!");
    return false;
  }

  const secondRegId = json2.registrations[0].registrationId;
  console.log("Received Second Registration ID:", secondRegId);

  if (firstRegId === secondRegId) {
    console.log("✅ PASS: Idempotency verified! Duplicate retry returned identical Registration ID:", firstRegId);
    return true;
  } else {
    console.error("❌ FAIL: Duplicate retry created a new Registration ID! Got:", secondRegId, "expected:", firstRegId);
    return false;
  }
}

testIdempotency().then(success => {
  console.log("Test finished with result:", success);
}).catch(err => {
  console.error("Idempotency test error:", err);
});
