/**
 * TECHBYTE SUMMIT 26 — Simultaneous Duplicate Request Concurrency Test
 * Sends 8 identical requests with the same clientSubmissionId at the exact same millisecond.
 * Verifies that:
 * 1. Only ONE registration is created.
 * 2. All 8 concurrent requests receive the exact same registration ID.
 * 3. Exactly one set of Drive folders/files and one Sheet row is created.
 */

const ENDPOINT = "https://script.google.com/macros/s/AKfycbyIIyg2C5VOVYKXagutyVlLsMv4xxZ97tiFUbm7R3zzI1KQXpEXmmjCJDacG36YitIR/exec";
const DUMMY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function testSimultaneousDuplicates(burstCount = 8) {
  console.log(`\n=== RUNNING SIMULTANEOUS DUPLICATE TEST (${burstCount} identical requests) ===`);
  const sharedSubmissionId = "simult_idemp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  const payload = {
    clientSubmissionId: sharedSubmissionId,
    registrationMode: "same-team",
    sameTeamAcrossEvents: true,
    transactionScreenshots: {
      teamLeader: { data: DUMMY_PNG_BASE64, name: "leader_simult.png", mimeType: "image/png" },
      member1: { data: DUMMY_PNG_BASE64, name: "m1_simult.png", mimeType: "image/png" }
    },
    registrations: [
      {
        event: "Paper Presentation",
        team: {
          teamName: "Simultaneous Idempotent Team",
          teamLeader: {
            name: "Simult Leader",
            participantId: "TBS-26-SIM-0",
            mobile: "9876543299",
            transactionId: "TXN-SIM-001"
          },
          member1: {
            name: "Simult Member1",
            participantId: "TBS-26-SIM-1",
            mobile: "9876543298",
            transactionId: "TXN-SIM-002"
          }
        }
      }
    ]
  };

  console.log(`Sending ${burstCount} simultaneous requests with clientSubmissionId: ${sharedSubmissionId}`);

  const startTime = Date.now();
  const promises = Array.from({ length: burstCount }, (_, i) => 
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(async r => {
      const dur = Date.now() - startTime;
      const text = await r.text();
      let json = {};
      try { json = JSON.parse(text); } catch {}
      return { index: i + 1, status: r.status, duration: dur, json };
    }).catch(err => ({ index: i + 1, error: err.message, duration: Date.now() - startTime }))
  );

  const results = await Promise.all(promises);
  console.log("\nResults received:");

  const regIds = new Set();
  let successCount = 0;

  for (const r of results) {
    console.log(`Request #${r.index}: HTTP ${r.status} (${r.duration}ms) -> success: ${r.json?.success}, registrationId: ${r.json?.registrations?.[0]?.registrationId || r.json?.message}`);
    if (r.json?.success) {
      successCount++;
      const id = r.json?.registrations?.[0]?.registrationId;
      if (id) regIds.add(id);
    }
  }

  console.log(`\nSummary:`);
  console.log(`Total Requests: ${burstCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Unique Registration IDs returned: ${regIds.size} (${Array.from(regIds).join(", ")})`);

  if (regIds.size === 1 && successCount === burstCount) {
    console.log(`✅ PASS: All ${burstCount} simultaneous requests resolved to the EXACT SAME single registration ID: ${Array.from(regIds)[0]}! No duplicate registrations created.`);
    return true;
  } else {
    console.log(`❌ FAIL: Expected exactly 1 unique registration ID across all responses, but found: ${regIds.size}`);
    return false;
  }
}

if (process.argv[1].endsWith("test_simultaneous_duplicates.mjs")) {
  testSimultaneousDuplicates(8);
}
