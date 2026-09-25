/**
 * TECHBYTE SUMMIT 26 — Progressive Concurrency Load Test Suite
 * Tests live endpoint with synthetic data under concurrent load:
 * Test A: 50 concurrent
 * Test B: 100 concurrent
 * Test C: 250 concurrent
 * Test D: 500 concurrent
 */

const ENDPOINT = "https://script.google.com/macros/s/AKfycbyIIyg2C5VOVYKXagutyVlLsMv4xxZ97tiFUbm7R3zzI1KQXpEXmmjCJDacG36YitIR/exec";

// 1x1 transparent PNG base64
const DUMMY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const EVENTS = [
  "Paper Presentation",
  "Poster Creation",
  "Project Presentation",
  "Hackathon"
];

function generateSyntheticTeamPayload(index, memberCount = 2, multiEvent = false, isSameTeam = true) {
  const pad = String(index).padStart(4, "0");
  const teamName = `LOADTEST_TBS26_Team_${pad}`;
  const submissionId = `LOADTEST_TBS26_sub_${Date.now()}_${pad}_${Math.random().toString(36).slice(2, 7)}`;

  const leader = {
    name: `LOADTEST Leader ${pad}`,
    participantId: `LOADTEST-TBS-S${pad}-0`,
    mobile: `980000${pad}`,
    transactionId: `TXN-LOADTEST-${pad}-0`
  };

  const member1 = {
    name: `LOADTEST Member1 ${pad}`,
    participantId: `LOADTEST-TBS-S${pad}-1`,
    mobile: `980001${pad}`,
    transactionId: `TXN-LOADTEST-${pad}-1`
  };

  let member2 = { name: "", participantId: "", mobile: "", transactionId: "" };
  let member3 = { name: "", participantId: "", mobile: "", transactionId: "" };

  if (memberCount >= 3) {
    member2 = {
      name: `LOADTEST Member2 ${pad}`,
      participantId: `LOADTEST-TBS-S${pad}-2`,
      mobile: `980002${pad}`,
      transactionId: `TXN-LOADTEST-${pad}-2`
    };
  }
  if (memberCount >= 4) {
    member3 = {
      name: `LOADTEST Member3 ${pad}`,
      participantId: `LOADTEST-TBS-S${pad}-3`,
      mobile: `980003${pad}`,
      transactionId: `TXN-LOADTEST-${pad}-3`
    };
  }

  const teamObj = {
    teamName,
    teamLeader: leader,
    member1
  };
  if (memberCount >= 3) teamObj.member2 = member2;
  if (memberCount >= 4) teamObj.member3 = member3;

  const screenshots = {
    teamLeader: { data: DUMMY_PNG_BASE64, name: `ldr_${pad}.png`, mimeType: "image/png" },
    member1: { data: DUMMY_PNG_BASE64, name: `m1_${pad}.png`, mimeType: "image/png" }
  };
  if (memberCount >= 3) {
    screenshots.member2 = { data: DUMMY_PNG_BASE64, name: `m2_${pad}.png`, mimeType: "image/png" };
  }
  if (memberCount >= 4) {
    screenshots.member3 = { data: DUMMY_PNG_BASE64, name: `m3_${pad}.png`, mimeType: "image/png" };
  }

  const selectedEvents = multiEvent 
    ? [EVENTS[index % EVENTS.length], EVENTS[(index + 1) % EVENTS.length]]
    : [EVENTS[index % EVENTS.length]];

  const registrations = selectedEvents.map(evt => ({
    event: evt,
    team: teamObj,
    transactionScreenshots: screenshots
  }));

  return {
    clientSubmissionId: submissionId,
    registrationMode: isSameTeam ? "same-team" : "different-team",
    sameTeamAcrossEvents: isSameTeam,
    transactionScreenshots: screenshots,
    registrations
  };
}

async function sendSingleRequestWithRetry(payload, maxAttempts = 4, timeoutMs = 60000) {
  const overallStart = Date.now();
  let attemptsMade = 0;
  let lastResult = null;
  let attempt1Result = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptsMade = attempt;
    const attemptStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const attemptDuration = Date.now() - attemptStart;
      const text = await res.text();
      let json = {};
      try { json = JSON.parse(text); } catch {}

      const isSuccess = json.success === true;
      const isRetryable = json.retryable === true ||
        [429, 500, 502, 503, 504].includes(res.status) ||
        (json.message && (
          json.message.includes("high volume") ||
          json.message.includes("busy") ||
          json.message.includes("Lock") ||
          json.message.includes("concurrently")
        ));

      const rawSnippet = text ? text.slice(0, 200).replace(/\s+/g, ' ') : "Empty body";
      const message = json.message || rawSnippet;

      const curResult = {
        status: res.status,
        duration: attemptDuration,
        totalDuration: Date.now() - overallStart,
        attemptsMade,
        success: isSuccess,
        retryable: isRetryable,
        message: message,
        raw: rawSnippet,
        registrations: json.registrations || [],
        json
      };

      if (attempt === 1) attempt1Result = curResult;
      lastResult = curResult;

      if (isSuccess) {
        return {
          ...curResult,
          attempt1Result
        };
      }

      if (isRetryable && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return {
        ...curResult,
        attempt1Result
      };

    } catch (err) {
      clearTimeout(timeoutId);
      const attemptDuration = Date.now() - attemptStart;
      const curResult = {
        status: err.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
        duration: attemptDuration,
        totalDuration: Date.now() - overallStart,
        attemptsMade,
        success: false,
        retryable: true,
        error: err.message
      };

      if (attempt === 1) attempt1Result = curResult;
      lastResult = curResult;

      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return {
        ...curResult,
        attempt1Result
      };
    }
  }

  return {
    ...lastResult,
    attempt1Result
  };
}

export async function runConcurrencyBatch(concurrencyCount, batchLabel) {
  console.log(`\n============================================================`);
  console.log(`STARTING ${batchLabel}: ${concurrencyCount} CONCURRENT REGISTRATIONS`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`============================================================\n`);

  const payloads = [];
  for (let i = 0; i < concurrencyCount; i++) {
    const memberCount = (i % 4 === 0) ? 4 : (i % 3 === 0) ? 3 : 2;
    const multiEvent = (i % 5 === 0);
    payloads.push(generateSyntheticTeamPayload(i + 1, memberCount, multiEvent, true));
  }

  const startTime = Date.now();
  // Fire all simultaneously
  const promises = payloads.map((p, idx) => sendSingleRequestWithRetry(p));
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  // Analysis
  let eventualSuccessCount = 0;
  let attempt1SuccessCount = 0;
  let failedCount = 0;
  let timeoutCount = 0;
  let http429Count = 0;
  let http500Count = 0;
  let totalRetriesExecuted = 0;
  const statusCodes = {};
  const errorMap = {};
  const regIds = [];
  const attempt1Durations = [];
  const totalDurations = [];

  for (const r of results) {
    totalDurations.push(r.totalDuration);
    attempt1Durations.push(r.attempt1Result?.duration || r.duration);
    statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;

    if (r.status === 429) http429Count++;
    if (r.status === 500) http500Count++;

    if (r.attemptsMade > 1) {
      totalRetriesExecuted += (r.attemptsMade - 1);
    }

    if (r.attempt1Result?.success) {
      attempt1SuccessCount++;
    }

    if (r.success) {
      eventualSuccessCount++;
      if (Array.isArray(r.registrations)) {
        for (const reg of r.registrations) {
          if (reg.registrationId) regIds.push(reg.registrationId);
        }
      }
    } else {
      failedCount++;
      if (r.status === "TIMEOUT") timeoutCount++;
      const msg = r.message || r.error || "Unknown error";
      errorMap[msg] = (errorMap[msg] || 0) + 1;
    }
  }

  // Duplicate ID detection
  const idCounts = {};
  const duplicates = [];
  for (const id of regIds) {
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (idCounts[id] === 2) duplicates.push(id);
  }

  totalDurations.sort((a, b) => a - b);
  attempt1Durations.sort((a, b) => a - b);

  const minDur = totalDurations[0];
  const maxDur = totalDurations[totalDurations.length - 1];
  const avgDur = Math.round(totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length);
  const p50 = totalDurations[Math.floor(totalDurations.length * 0.50)];
  const p90 = totalDurations[Math.floor(totalDurations.length * 0.90)];
  const p95 = totalDurations[Math.floor(totalDurations.length * 0.95)];

  const summary = {
    batchLabel,
    concurrencyCount,
    totalDurationMs: totalDuration,
    attempt1SuccessCount,
    eventualSuccessCount,
    failedCount,
    http429Count,
    http500Count,
    timeoutCount,
    totalRetriesExecuted,
    statusCodes,
    errorMap,
    totalRegistrationIdsGenerated: regIds.length,
    duplicateRegistrationIds: duplicates,
    hasDuplicates: duplicates.length > 0,
    latency: {
      minMs: minDur,
      maxMs: maxDur,
      avgMs: avgDur,
      p50Ms: p50,
      p90Ms: p90,
      p95Ms: p95
    }
  };

  console.log(`\n--- ${batchLabel} SUMMARY ---`);
  console.log(`Total Requests: ${concurrencyCount}`);
  console.log(`Raw Attempt 1 Instantaneous Success: ${attempt1SuccessCount} (${((attempt1SuccessCount/concurrencyCount)*100).toFixed(1)}%)`);
  console.log(`Eventual Success (with client retries): ${eventualSuccessCount} (${((eventualSuccessCount/concurrencyCount)*100).toFixed(1)}%)`);
  console.log(`Permanent Failures: ${failedCount}`);
  console.log(`Retries Executed: ${totalRetriesExecuted}`);
  console.log(`HTTP 429 Count: ${http429Count} | HTTP 500 Count: ${http500Count} | Timeouts: ${timeoutCount}`);
  console.log(`HTTP Status Breakdown:`, statusCodes);
  console.log(`Latencies: Min=${minDur}ms | Avg=${avgDur}ms | p50=${p50}ms | p90=${p90}ms | p95=${p95}ms | Max=${maxDur}ms`);
  console.log(`Registration IDs returned: ${regIds.length}`);
  console.log(`Duplicate IDs: ${duplicates.length > 0 ? duplicates.join(", ") : "0 (NONE)"}`);
  if (Object.keys(errorMap).length > 0) {
    console.log(`Error breakdown:`, errorMap);
  }

  return summary;
}

// CLI runner if executed directly
if (process.argv[1].endsWith("test_concurrency.mjs")) {
  const target = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
  runConcurrencyBatch(target, `CONCURRENCY_${target}`).then(res => {
    console.log("\nFinished batch.");
  }).catch(err => {
    console.error("Test error:", err);
  });
}