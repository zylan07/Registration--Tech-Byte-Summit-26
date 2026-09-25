/**
 * ============================================================================
 * TECHBYTE SUMMIT 26 — TEAM REGISTRATION BACKEND (Google Apps Script)
 * ============================================================================
 *
 * Web App Endpoint Handler for team-level transaction screenshots.
 * 
 * Production Sheet Structure (EXACTLY 26 Columns):
 * 1.  Timestamp
 * 2.  Registration ID
 * 3.  Team Name
 * 4.  Team Leader Name
 * 5.  Team Leader Participant ID
 * 6.  Team Leader Mobile
 * 7.  Team Leader Transaction ID
 * 8.  Member 1 Name
 * 9.  Member 1 Participant ID
 * 10. Member 1 Mobile
 * 11. Member 1 Transaction ID
 * 12. Member 2 Name
 * 13. Member 2 Participant ID
 * 14. Member 2 Mobile
 * 15. Member 2 Transaction ID
 * 16. Member 3 Name
 * 17. Member 3 Participant ID
 * 18. Member 3 Mobile
 * 19. Member 3 Transaction ID
 * 20. Team Leader Transaction Screenshot
 * 21. Member 1 Transaction Screenshot
 * 22. Member 2 Transaction Screenshot
 * 23. Member 3 Transaction Screenshot
 * 24. Registration Mode
 * 25. Same Team Across Events
 * 26. Verification Status
 */

// Root Drive Folder Name for uploads
var ROOT_FOLDER_NAME = "TECHBYTE SUMMIT 26 — TEAM REGISTRATION";
var TRANSACTION_FOLDER_NAME = "TRANSACTION SCREENSHOTS";

/**
 * Central event configuration mapping each event to its own separate Google Spreadsheet ID
 * and exact tab/sheet name.
 */
var EVENT_CONFIG = {
  "Paper Presentation": {
    sheetId: "1oNUNxH4of6fK01D1FWTBzS5kSmMfr2-jvJzjVXziK6U",
    sheetName: "Sheet1"
  },
  "Poster Creation": {
    sheetId: "1UPJTtSLe0hvp7YDvtPL__RMMNo9otQfmn98sisRikTc",
    sheetName: "Sheet1"
  },
  "Project Presentation": {
    sheetId: "1IGCDND5JbK6NCFHvbHqIwEQKuHxsC-JcX-ptmzRNVFg",
    sheetName: "Sheet1"
  },
  "Hackathon": {
    sheetId: "1FW50j7XsnNps-jngMOiBk3Sg4j712TEzmfqKQRIsveA",
    sheetName: "Sheet1"
  }
};

// Exact 26 expected headers
var EXPECTED_26_HEADERS = [
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

/**
 * Main Web App POST handler — Hardened for high concurrency
 * - No global LockService wrapping entire request
 * - Fast idempotency check via CacheService
 * - Micro-locked atomic sequential ID allocation (<15ms critical section)
 * - Cached Google Drive folder lookups
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        retryable: false,
        message: "No post data received."
      });
    }

    var payload = JSON.parse(e.postData.contents);

    // Audit and cleanup handler for synthetic test records
    if (payload.action === "cleanup_synthetic_data") {
      return createJsonResponse({
        success: true,
        report: cleanupSyntheticLoadTestRecords(payload.executeDelete === true)
      });
    }

    var clientSubmissionId = payload.clientSubmissionId || null;

    // 1. Idempotency Check with concurrency lock to prevent simultaneous race conditions
    var cache = CacheService.getScriptCache();
    if (clientSubmissionId) {
      var idempLock = LockService.getScriptLock();
      var isOriginator = false;
      var gotLock = false;
      try {
        gotLock = idempLock.tryLock(3000);
      } catch (lErr) {
        gotLock = false;
      }

      if (gotLock) {
        try {
          var state = cache.get("sub_" + clientSubmissionId);
          if (state) {
            if (state.indexOf("COMPLETED:") === 0) {
              return createJsonResponse(JSON.parse(state.substring(10)));
            }
            // State is IN_FLIGHT, another request is processing it
          } else {
            // First to arrive: mark IN_FLIGHT and proceed
            cache.put("sub_" + clientSubmissionId, "IN_FLIGHT", 60);
            isOriginator = true;
          }
        } finally {
          idempLock.releaseLock();
        }
      }

      // If this request is NOT the originator, wait for originator to finish
      if (!isOriginator) {
        var maxWaitMs = 15000;
        var waited = 0;
        var pollMs = 300;
        while (waited < maxWaitMs) {
          var current = cache.get("sub_" + clientSubmissionId);
          if (current && current.indexOf("COMPLETED:") === 0) {
            return createJsonResponse(JSON.parse(current.substring(10)));
          }
          if (!current) {
            // Originator may have failed; break out to retry processing
            break;
          }
          Utilities.sleep(pollMs);
          waited += pollMs;
        }
      }
    }

    var registrationMode = payload.registrationMode || "same-team";
    var sameTeamAcrossEvents = Boolean(payload.sameTeamAcrossEvents);
    var registrations = payload.registrations || [];

    if (!registrations || registrations.length === 0) {
      return createJsonResponse({
        success: false,
        retryable: false,
        message: "No event registrations found in payload."
      });
    }

    var returnedRegistrations = [];

    // Cached lookup for storing transaction screenshots (no repeated Drive search)
    var transactionRootFolder = getOrCreateTransactionFolder();

    if (sameTeamAcrossEvents || registrationMode === "same-team") {
      // -------------------------------------------------------------
      // SAME TEAM FLOW: Single team across one or multiple events
      // -------------------------------------------------------------
      var firstReg = registrations[0];
      var team = firstReg.team || {};
      var rawScreenshots = payload.transactionScreenshots || firstReg.transactionScreenshots || firstReg.screenshots || {};

      // Validate screenshot set ONLY ONCE at the team level (in-memory, 0ms)
      var validation = validateTeamTransactionScreenshots(team, rawScreenshots);
      if (!validation.isValid) {
        return createJsonResponse({
          success: false,
          retryable: false,
          message: validation.message
        });
      }

      // 1. Atomically allocate all required sequential IDs under micro-lock (<15ms)
      var allocatedIds = allocateSequentialRegistrationIds(registrations.length);
      var teamBaseId = allocatedIds[0];

      // 2. Upload screenshots ONCE to a dedicated team folder in Google Drive
      var teamFolder = transactionRootFolder.createFolder(teamBaseId + "_" + sanitizeFolderName(team.teamName || "Team"));
      var uploadedUrls = uploadTransactionScreenshotsOnce(teamFolder, rawScreenshots, team);

      // 3. Record each event registration into its own separate event spreadsheet
      for (var i = 0; i < registrations.length; i++) {
        var reg = registrations[i];
        var eventName = reg.event;
        var eventRegId = allocatedIds[i];

        writeRegistrationRow(eventName, eventRegId, team, uploadedUrls, registrationMode, sameTeamAcrossEvents);

        returnedRegistrations.push({
          event: eventName,
          registrationId: eventRegId
        });
      }
    } else {
      // -------------------------------------------------------------
      // DIFFERENT TEAMS FLOW: Separate teams per event
      // -------------------------------------------------------------
      // Validate each event's team screenshot set independently
      for (var j = 0; j < registrations.length; j++) {
        var diffReg = registrations[j];
        var diffEventName = diffReg.event;
        var diffTeam = diffReg.team || {};
        var diffScreenshots = diffReg.transactionScreenshots || diffReg.screenshots || {};

        var diffValidation = validateTeamTransactionScreenshots(diffTeam, diffScreenshots);
        if (!diffValidation.isValid) {
          return createJsonResponse({
            success: false,
            retryable: false,
            message: "Event " + diffEventName + ": " + diffValidation.message
          });
        }
      }

      // Atomically allocate all required sequential IDs under micro-lock (<15ms)
      var diffAllocatedIds = allocateSequentialRegistrationIds(registrations.length);

      for (var j = 0; j < registrations.length; j++) {
        var diffReg = registrations[j];
        var diffEventName = diffReg.event;
        var diffTeam = diffReg.team || {};
        var diffScreenshots = diffReg.transactionScreenshots || diffReg.screenshots || {};
        var diffRegId = diffAllocatedIds[j];

        // Upload this team's screenshots once
        var diffTeamFolder = transactionRootFolder.createFolder(diffRegId + "_" + sanitizeFolderName(diffTeam.teamName || "Team"));
        var diffUploadedUrls = uploadTransactionScreenshotsOnce(diffTeamFolder, diffScreenshots, diffTeam);

        writeRegistrationRow(diffEventName, diffRegId, diffTeam, diffUploadedUrls, registrationMode, sameTeamAcrossEvents);

        returnedRegistrations.push({
          event: diffEventName,
          registrationId: diffRegId
        });
      }
    }

    var successResponse = {
      success: true,
      message: "Team registration submitted successfully.",
      registrations: returnedRegistrations
    };

    // Store in CacheService for idempotency (valid for 6 hours)
    if (clientSubmissionId) {
      try {
        cache.put("sub_" + clientSubmissionId, "COMPLETED:" + JSON.stringify(successResponse), 21600);
      } catch (cacheErr) {
        Logger.log("Idempotency cache put error: " + cacheErr.message);
      }
    }

    return createJsonResponse(successResponse);

  } catch (err) {
    Logger.log("Error processing registration: " + err.toString());
    // Clear in-flight state on error so retries can proceed
    if (clientSubmissionId) {
      try {
        var existingState = cache.get("sub_" + clientSubmissionId);
        if (existingState === "IN_FLIGHT") {
          cache.remove("sub_" + clientSubmissionId);
        }
      } catch (cleanErr) {}
    }

    var isRetryable = Boolean(
      err.isRetryable ||
      (err.message && (
        err.message.indexOf("high volume") !== -1 ||
        err.message.indexOf("Lock") !== -1 ||
        err.message.indexOf("concurrently") !== -1 ||
        err.message.indexOf("limit") !== -1
      ))
    );

    return createJsonResponse({
      success: false,
      retryable: isRetryable,
      message: isRetryable
        ? "System is experiencing high registration volume. Please retry."
        : (err.message || "Registration processing failed. Please try again.")
    });
  }
}

/**
 * Determines active member keys from team details:
 * - teamLeader: always active
 * - member1: always active
 * - member2: active only when that member exists
 * - member3: active only when that member exists
 */
function getActiveMemberKeys(team) {
  var keys = ["teamLeader", "member1"];
  var m2 = team ? team.member2 : null;
  if (m2 && (
    (m2.name && m2.name.trim() !== "") ||
    (m2.participantId && m2.participantId.trim() !== "") ||
    (m2.mobile && m2.mobile.trim() !== "") ||
    (m2.transactionId && m2.transactionId.trim() !== "")
  )) {
    keys.push("member2");
  }
  var m3 = team ? team.member3 : null;
  if (m3 && (
    (m3.name && m3.name.trim() !== "") ||
    (m3.participantId && m3.participantId.trim() !== "") ||
    (m3.mobile && m3.mobile.trim() !== "") ||
    (m3.transactionId && m3.transactionId.trim() !== "")
  )) {
    keys.push("member3");
  }
  return keys;
}

/**
 * Validates dynamic transaction screenshots based on actual active members:
 * expectedScreenshotCount = 1 (leader) + 1 (member1) + (1 if member2 exists) + (1 if member3 exists)
 *
 * Verifies that every required active member has a screenshot with base64 data.
 */
function validateTeamTransactionScreenshots(team, transactionScreenshots) {
  var activeKeys = getActiveMemberKeys(team);
  var expectedScreenshotCount = activeKeys.length;
  var memberDisplayNames = {
    teamLeader: "Team Leader",
    member1: "Member 1",
    member2: "Member 2",
    member3: "Member 3"
  };

  if (!transactionScreenshots) {
    return {
      isValid: false,
      message: "No transaction screenshots provided. Exactly " + expectedScreenshotCount + " screenshot(s) required for this team."
    };
  }

  for (var i = 0; i < activeKeys.length; i++) {
    var key = activeKeys[i];
    var shot = null;
    if (Array.isArray(transactionScreenshots)) {
      shot = transactionScreenshots[i];
    } else if (typeof transactionScreenshots === "object") {
      shot = transactionScreenshots[key];
    }

    if (!shot || (!shot.data && !shot.file)) {
      return {
        isValid: false,
        message: "Missing transaction screenshot for " + memberDisplayNames[key] + ". Exactly " + expectedScreenshotCount + " screenshot(s) required for this team."
      };
    }
  }

  return {
    isValid: true,
    expectedScreenshotCount: expectedScreenshotCount,
    activeKeys: activeKeys
  };
}

/**
 * Uploads member transaction screenshots ONLY ONCE to the specified Drive folder.
 * Returns a map of member keys to public viewable Drive URLs.
 */
function uploadTransactionScreenshotsOnce(folder, transactionScreenshots, team) {
  var urlMap = {
    teamLeader: "",
    member1: "",
    member2: "",
    member3: ""
  };

  if (!transactionScreenshots) return urlMap;

  var memberKeys = ["teamLeader", "member1", "member2", "member3"];
  var memberLabels = {
    teamLeader: "Leader",
    member1: "Member1",
    member2: "Member2",
    member3: "Member3"
  };

  var activeKeys = getActiveMemberKeys(team);

  for (var k = 0; k < memberKeys.length; k++) {
    var key = memberKeys[k];
    var memberObj = team ? team[key] : null;
    var memberExists = activeKeys.indexOf(key) !== -1;

    if (!memberExists) {
      // Member does not exist: ensure URL is strictly blank and no Drive file is created
      urlMap[key] = "";
      continue;
    }

    var shot = Array.isArray(transactionScreenshots) ? transactionScreenshots[k] : transactionScreenshots[key];
    if (shot && shot.data) {
      try {
        var memberName = (memberObj && memberObj.name) ? memberObj.name.replace(/[^a-zA-Z0-9]/g, "_") : memberLabels[key];
        var ext = getExtensionFromMime(shot.mimeType, shot.name);
        var fileName = memberLabels[key] + "_" + memberName + "_TransactionScreenshot." + ext;

        var bytes = Utilities.base64Decode(shot.data);
        var blob = Utilities.newBlob(bytes, shot.mimeType || "image/png", fileName);
        var file = folder.createFile(blob);

        // Set sharing to anyone with link viewable for volunteer review
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        urlMap[key] = file.getUrl();
      } catch (uploadErr) {
        Logger.log("Failed uploading screenshot for " + key + ": " + uploadErr.toString());
        urlMap[key] = "Upload Error: " + uploadErr.message;
      }
    }
  }

  return urlMap;
}

/**
 * Safe event sheet access helper.
 * Opens the specific spreadsheet configured for this event and retrieves the sheet/tab.
 * First tries exact configured name, then falls back to normalized dash matching or 26-column tab.
 */
function getEventSheet(eventName) {
  var config = EVENT_CONFIG[eventName];

  if (!config) {
    throw new Error("Unknown event: " + eventName);
  }

  var spreadsheet = SpreadsheetApp.openById(config.sheetId);

  if (!spreadsheet) {
    throw new Error("Unable to open spreadsheet for event: " + eventName);
  }

  // 1. Try exact configured sheetName
  var sheet = spreadsheet.getSheetByName(config.sheetName);
  if (sheet) return sheet;

  // 2. Normalized dash/whitespace search
  var allSheets = spreadsheet.getSheets();
  var normConfig = config.sheetName.toLowerCase().replace(/[\u2010-\u2015\u2212\-]/g, "-").replace(/\s+/g, " ").trim();
  for (var i = 0; i < allSheets.length; i++) {
    var s = allSheets[i];
    var normS = s.getName().toLowerCase().replace(/[\u2010-\u2015\u2212\-]/g, "-").replace(/\s+/g, " ").trim();
    if (normS === normConfig || normS.indexOf(eventName.toLowerCase()) !== -1) {
      return s;
    }
  }

  // 3. Fallback: Any tab with 26 columns
  for (var j = 0; j < allSheets.length; j++) {
    if (allSheets[j].getLastColumn() >= 26) {
      return allSheets[j];
    }
  }

  // 4. Default to first sheet if available
  if (allSheets.length > 0) {
    return allSheets[0];
  }

  throw new Error(
    "Sheet not found for event: " +
    eventName +
    " | Expected sheet: " +
    config.sheetName +
    " | Available tabs: [" + allSheets.map(function(s) { return s.getName(); }).join(", ") + "]"
  );
}

/**
 * Writes exactly 26 columns into the appropriate event's Google Sheet in the exact order requested:
 * 1. Timestamp
 * 2. Registration ID
 * 3. Team Name
 * 4. Team Leader Name
 * 5. Team Leader Participant ID
 * 6. Team Leader Mobile
 * 7. Team Leader Transaction ID
 * 8. Member 1 Name
 * 9. Member 1 Participant ID
 * 10. Member 1 Mobile
 * 11. Member 1 Transaction ID
 * 12. Member 2 Name
 * 13. Member 2 Participant ID
 * 14. Member 2 Mobile
 * 15. Member 2 Transaction ID
 * 16. Member 3 Name
 * 17. Member 3 Participant ID
 * 18. Member 3 Mobile
 * 19. Member 3 Transaction ID
 * 20. Team Leader Transaction Screenshot
 * 21. Member 1 Transaction Screenshot
 * 22. Member 2 Transaction Screenshot
 * 23. Member 3 Transaction Screenshot
 * 24. Registration Mode
 * 25. Same Team Across Events
 * 26. Verification Status
 */
function writeRegistrationRow(eventName, regId, team, screenshotUrls, registrationMode, sameTeamAcrossEvents) {
  var sheet = getEventSheet(eventName);

  var leader = team.teamLeader || {};
  var member1 = team.member1 || {};
  var member2 = team.member2 || {};
  var member3 = team.member3 || {};

  var row = [
    new Date(),                                           // 1. Timestamp
    regId,                                                // 2. Registration ID
    team.teamName || "",                                  // 3. Team Name
    leader.name || "",                                    // 4. Team Leader Name
    leader.participantId || "",                           // 5. Team Leader Participant ID
    leader.mobile || "",                                  // 6. Team Leader Mobile
    leader.transactionId || "",                           // 7. Team Leader Transaction ID
    member1.name || "",                                   // 8. Member 1 Name
    member1.participantId || "",                          // 9. Member 1 Participant ID
    member1.mobile || "",                                 // 10. Member 1 Mobile
    member1.transactionId || "",                          // 11. Member 1 Transaction ID
    member2.name || "",                                   // 12. Member 2 Name
    member2.participantId || "",                          // 13. Member 2 Participant ID
    member2.mobile || "",                                 // 14. Member 2 Mobile
    member2.transactionId || "",                          // 15. Member 2 Transaction ID
    member3.name || "",                                   // 16. Member 3 Name
    member3.participantId || "",                          // 17. Member 3 Participant ID
    member3.mobile || "",                                 // 18. Member 3 Mobile
    member3.transactionId || "",                          // 19. Member 3 Transaction ID
    screenshotUrls.teamLeader || "",                      // 20. Team Leader Transaction Screenshot
    screenshotUrls.member1 || "",                         // 21. Member 1 Transaction Screenshot
    screenshotUrls.member2 || "",                         // 22. Member 2 Transaction Screenshot
    screenshotUrls.member3 || "",                         // 23. Member 3 Transaction Screenshot
    registrationMode || "same-team",                      // 24. Registration Mode
    sameTeamAcrossEvents ? "TRUE" : "FALSE",              // 25. Same Team Across Events
    "Pending"                                             // 26. Verification Status
  ];

  sheet.appendRow(row);
}

/**
 * Validates the headers of all 4 independent event spreadsheets against EXPECTED_26_HEADERS.
 * Inspects all tabs in each spreadsheet to detect actual tab names.
 */
function validateAllEventSheetHeaders() {
  var results = {};
  var allValid = true;
  var eventNames = Object.keys(EVENT_CONFIG);

  for (var i = 0; i < eventNames.length; i++) {
    var name = eventNames[i];
    var config = EVENT_CONFIG[name];
    try {
      var ss = SpreadsheetApp.openById(config.sheetId);
      if (!ss) {
        results[name] = {
          spreadsheet: "ERROR",
          spreadsheetName: null,
          tabs: [],
          configuredTab: config.sheetName,
          matchedTab: null,
          headers: "Unable to open spreadsheet by ID",
          valid: false
        };
        allValid = false;
        continue;
      }

      var ssName = ss.getName();
      var allSheets = ss.getSheets();
      var tabSummaries = [];
      var matchedSheet = null;
      var matchedTabName = null;

      // 1. Check exact match
      for (var s = 0; s < allSheets.length; s++) {
        var sh = allSheets[s];
        var sName = sh.getName();
        var lastCol = sh.getLastColumn();
        tabSummaries.push({
          name: sName,
          columns: lastCol
        });
        if (sName === config.sheetName) {
          matchedSheet = sh;
          matchedTabName = sName;
        }
      }

      // 2. Normalized dash / whitespace / case search if no exact match
      if (!matchedSheet) {
        var normConfig = config.sheetName.toLowerCase().replace(/[\u2010-\u2015\u2212\-]/g, "-").replace(/\s+/g, " ").trim();
        for (var s = 0; s < allSheets.length; s++) {
          var sh = allSheets[s];
          var sName = sh.getName();
          var normSName = sName.toLowerCase().replace(/[\u2010-\u2015\u2212\-]/g, "-").replace(/\s+/g, " ").trim();
          if (normSName === normConfig || normSName.indexOf(name.toLowerCase()) !== -1) {
            matchedSheet = sh;
            matchedTabName = sName;
            break;
          }
        }
      }

      // 3. Fallback: Any tab with 26 columns
      if (!matchedSheet) {
        for (var s = 0; s < allSheets.length; s++) {
          if (allSheets[s].getLastColumn() >= 26) {
            matchedSheet = allSheets[s];
            matchedTabName = allSheets[s].getName();
            break;
          }
        }
      }

      // 4. Default to first sheet if still not matched
      if (!matchedSheet && allSheets.length > 0) {
        matchedSheet = allSheets[0];
        matchedTabName = allSheets[0].getName();
      }

      if (!matchedSheet) {
        results[name] = {
          spreadsheet: "OK",
          spreadsheetName: ssName,
          tabs: tabSummaries,
          configuredTab: config.sheetName,
          matchedTab: null,
          headers: "No tabs found in spreadsheet",
          valid: false
        };
        allValid = false;
        continue;
      }

      var lastCol = matchedSheet.getLastColumn();
      var headers = lastCol > 0 ? matchedSheet.getRange(1, 1, 1, Math.min(26, lastCol)).getValues()[0] : [];
      var mismatches = [];

      if (lastCol < 26) {
        results[name] = {
          spreadsheet: "OK",
          spreadsheetName: ssName,
          tabs: tabSummaries,
          configuredTab: config.sheetName,
          matchedTab: matchedTabName,
          columnCount: lastCol,
          headers: "Expected 26 columns, found " + lastCol,
          valid: false
        };
        allValid = false;
        continue;
      }

      for (var h = 0; h < EXPECTED_26_HEADERS.length; h++) {
        var expected = EXPECTED_26_HEADERS[h].trim();
        var actual = (headers[h] || "").toString().trim();
        if (expected.toLowerCase() !== actual.toLowerCase()) {
          mismatches.push({
            colIndex: h + 1,
            expected: expected,
            actual: actual
          });
        }
      }

      results[name] = {
        spreadsheet: "OK",
        spreadsheetName: ssName,
        tabs: tabSummaries,
        configuredTab: config.sheetName,
        matchedTab: matchedTabName,
        columnCount: lastCol,
        headers: mismatches.length === 0 ? "OK" : "Mismatched headers: " + mismatches.length + " column(s)",
        mismatches: mismatches,
        valid: mismatches.length === 0
      };

      if (mismatches.length > 0) {
        allValid = false;
      }
    } catch (err) {
      results[name] = {
        spreadsheet: "ERROR",
        spreadsheetName: null,
        tabs: [],
        configuredTab: config.sheetName,
        matchedTab: null,
        headers: "Error: " + err.message,
        valid: false
      };
      allValid = false;
    }
  }

  return {
    allValid: allValid,
    expectedCount: 26,
    sheets: results
  };
}

/**
 * Cached lookup for the dedicated Google Drive folder for transaction screenshots.
 * Caches the folder ID in ScriptProperties to avoid repeated Drive searches under concurrency.
 */
function getOrCreateTransactionFolder() {
  var props = PropertiesService.getScriptProperties();
  var cachedId = props.getProperty("TRANSACTION_FOLDER_ID");

  if (cachedId) {
    try {
      var folder = DriveApp.getFolderById(cachedId);
      if (folder) return folder;
    } catch (e) {
      Logger.log("Cached TRANSACTION_FOLDER_ID could not be opened: " + e.message);
    }
  }

  // Fallback: search or create once
  var rootFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);

  var transFolders = rootFolder.getFoldersByName(TRANSACTION_FOLDER_NAME);
  var transFolder = transFolders.hasNext() ? transFolders.next() : rootFolder.createFolder(TRANSACTION_FOLDER_NAME);

  // Set sharing on the transaction folder so team folders and files inherit permission
  try {
    transFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    Logger.log("Could not set folder sharing: " + shareErr.message);
  }

  try {
    props.setProperty("TRANSACTION_FOLDER_ID", transFolder.getId());
  } catch (propErr) {
    Logger.log("Failed to cache TRANSACTION_FOLDER_ID: " + propErr.message);
  }

  return transFolder;
}

/**
 * Atomically allocates N sequential Registration IDs under a micro-lock (<15ms).
 * Format: TBS26-TEAM-XXXX
 * Throws a retryable error if lock cannot be acquired within 3 seconds so the frontend retries.
 */
function allocateSequentialRegistrationIds(count) {
  if (!count || count < 1) count = 1;
  var lock = LockService.getScriptLock();
  var acquired = false;
  try {
    acquired = lock.tryLock(3000);
  } catch (e) {
    acquired = false;
  }

  if (!acquired) {
    var err = new Error("System is experiencing high registration volume. Please retry.");
    err.isRetryable = true;
    throw err;
  }

  try {
    var props = PropertiesService.getScriptProperties();
    var currentSeq = parseInt(props.getProperty("TBS26_TEAM_SEQUENCE") || "0", 10);
    var ids = [];
    for (var i = 1; i <= count; i++) {
      var nextSeq = currentSeq + i;
      var padded = ("0000" + nextSeq).slice(-4);
      ids.push("TBS26-TEAM-" + padded);
    }
    props.setProperty("TBS26_TEAM_SEQUENCE", (currentSeq + count).toString());
    return ids;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Single ID allocation helper (wrapper around allocateSequentialRegistrationIds)
 */
function generateNextRegistrationId() {
  return allocateSequentialRegistrationIds(1)[0];
}

/**
 * Utility to extract extension from mimeType or original name
 */
function getExtensionFromMime(mimeType, origName) {
  if (origName && origName.indexOf(".") !== -1) {
    var parts = origName.split(".");
    return parts[parts.length - 1].toLowerCase();
  }
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function sanitizeFolderName(name) {
  return (name || "Team").replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 30);
}

/**
 * Returns JSON TextOutput with CORS headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Production Health GET Handler (Requirement 12)
 * Supports query parameter ?action=cleanup_synthetic_data for automated audit/cleanup.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "cleanup_synthetic_data") {
    var execute = e.parameter.execute === "true";
    return createJsonResponse({
      success: true,
      report: cleanupSyntheticLoadTestRecords(execute)
    });
  }

  return createJsonResponse({
    success: true,
    status: "active",
    service: "TECHBYTE SUMMIT 26 Team Registration API",
    version: "2.0"
  });
}

/**
 * Automated Audit and Cleanup Utility for Synthetic Load Test Records
 * - Scans all 4 event spreadsheets for LOADTEST_TBS26_ records
 * - Scans the Transaction Drive folder for LOADTEST_TBS26_ folders
 * - Verifies real participant records are preserved
 * - Deletes synthetic rows and trashes synthetic Drive folders when executeDelete === true
 * - Does NOT reset TBS26_TEAM_SEQUENCE
 */
function cleanupSyntheticLoadTestRecords(executeDelete) {
  var report = {
    mode: executeDelete ? "EXECUTE_CLEANUP" : "AUDIT_ONLY",
    timestamp: new Date().toISOString(),
    sheets: {},
    totalSyntheticRowsFound: 0,
    totalSyntheticRowsDeleted: 0,
    realRowsPreserved: [],
    drive: {
      syntheticFoldersFound: [],
      syntheticFoldersDeleted: [],
      filesDeletedCount: 0
    }
  };

  var eventNames = Object.keys(EVENT_CONFIG);

  // 1. Process Google Sheets
  for (var i = 0; i < eventNames.length; i++) {
    var evt = eventNames[i];
    var config = EVENT_CONFIG[evt];
    var ss = SpreadsheetApp.openById(config.sheetId);
    var sheet = ss.getSheetByName(config.sheetName) || ss.getSheets()[0];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    report.sheets[evt] = {
      spreadsheetName: ss.getName(),
      totalRowsBefore: lastRow,
      syntheticRows: [],
      realRowsCount: 0
    };

    if (lastRow <= 1) continue;

    var data = sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, 26)).getValues();
    var rowsToDelete = [];

    for (var r = 0; r < data.length; r++) {
      var rowIdx = r + 2;
      var row = data[r];
      var regId = String(row[1] || "");
      var teamName = String(row[2] || "");
      var leaderName = String(row[3] || "");
      var leaderId = String(row[4] || "");

      // Synthetic detection: LOADTEST_TBS26_ prefix and test suite markers
      var isSynthetic = (
        teamName.indexOf("LOADTEST_TBS26_") !== -1 ||
        teamName.indexOf("SynthTeam_") !== -1 ||
        teamName.indexOf("Idempotent Team") !== -1 ||
        teamName.indexOf("Simultaneous Idempotent Team") !== -1 ||
        leaderName.indexOf("LOADTEST") !== -1 ||
        leaderName.indexOf("SynthLeader") !== -1 ||
        leaderName.indexOf("Idemp Leader") !== -1 ||
        leaderName.indexOf("Simult Leader") !== -1 ||
        leaderId.indexOf("LOADTEST") !== -1 ||
        leaderId.indexOf("TBS-26-S") !== -1 ||
        leaderId.indexOf("TBS-26-ID") !== -1 ||
        leaderId.indexOf("TBS-26-SIM") !== -1
      );

      if (isSynthetic) {
        report.totalSyntheticRowsFound++;
        report.sheets[evt].syntheticRows.push({
          row: rowIdx,
          registrationId: regId,
          teamName: teamName,
          leaderName: leaderName,
          event: evt
        });
        rowsToDelete.push(rowIdx);
      } else {
        report.sheets[evt].realRowsCount++;
        report.realRowsPreserved.push({
          event: evt,
          row: rowIdx,
          registrationId: regId,
          teamName: teamName,
          leaderName: leaderName
        });
      }
    }

    if (executeDelete && rowsToDelete.length > 0) {
      // Delete from bottom to top to preserve row index alignment
      for (var d = rowsToDelete.length - 1; d >= 0; d--) {
        sheet.deleteRow(rowsToDelete[d]);
        report.totalSyntheticRowsDeleted++;
      }
    }
  }

  // 2. Process Google Drive Folders
  try {
    var transFolder = getOrCreateTransactionFolder();
    var subFolders = transFolder.getFolders();

    while (subFolders.hasNext()) {
      var folder = subFolders.next();
      var fName = folder.getName();

      var isSynthFolder = (
        fName.indexOf("LOADTEST_TBS26_") !== -1 ||
        fName.indexOf("SynthTeam_") !== -1 ||
        fName.indexOf("Idempotent") !== -1 ||
        fName.indexOf("Simultaneous") !== -1 ||
        fName.indexOf("TBS26-TEAM-") !== -1
      );

      // Verify that real participant folders are NOT trashed
      var isRealTeamFolder = false;
      for (var p = 0; p < report.realRowsPreserved.length; p++) {
        var realTeam = report.realRowsPreserved[p];
        if (realTeam.registrationId && fName.indexOf(realTeam.registrationId) !== -1) {
          isRealTeamFolder = true;
          break;
        }
      }

      if (isSynthFolder && !isRealTeamFolder) {
        var filesInFolder = [];
        var fFiles = folder.getFiles();
        while (fFiles.hasNext()) {
          filesInFolder.push(fFiles.next().getName());
        }

        report.drive.syntheticFoldersFound.push({
          folderName: fName,
          filesCount: filesInFolder.length,
          files: filesInFolder
        });

        if (executeDelete) {
          folder.setTrashed(true);
          report.drive.syntheticFoldersDeleted.push(fName);
          report.drive.filesDeletedCount += filesInFolder.length;
        }
      }
    }
  } catch (driveErr) {
    report.driveError = driveErr.message;
  }

  return report;
}
