# RMS API / Integration Test Results

Initial run marker: `SWT-20260720060659`

Latest targeted rerun marker: `SWT-RERUN-20260720062049`

Summary: PASS=49, FAIL=2, BLOCKED=2

| Test case | Status | Actual | Evidence |
|---|---:|---|---|
| RRP-001 | PASS | Created live request cd49c527-702e-4d0e-8326-fb6529a8497e in DRAFT. | [log](api/RRP-001.log) |
| RRP-002 | PASS | Missing positionTitle was rejected with HTTP 400. | [log](api/RRP-002.log) |
| RRP-003 | PASS | Request cd49c527-702e-4d0e-8326-fb6529a8497e moved to PENDING_HR_REVIEW. | [log](api/RRP-003.log) |
| RRP-004 | PASS | Request forwarded by live HR account vophongthank25@gmail.com. | [log](api/RRP-004.log) |
| RRP-005 | PASS | Live Admin approved request cd49c527-702e-4d0e-8326-fb6529a8497e. | [log](api/RRP-005.log) |
| RRP-006 | PASS | Rejection reason and 5 audit log(s) persisted. | [log](api/RRP-006.log) |
| RRP-007 | PASS | Live Candidate de190421vovanthanhphong@gmail.com received HTTP 403. | [log](api/RRP-007.log) |
| RRP-008 | PASS | 5 audit entries returned in chronological order. | [log](api/RRP-008.log) |
| RRP-009 | PASS | Current implementation exposes tracking through request detail; status=APPROVED. | [log](api/RRP-009.log) |
| RRP-010 | PASS | Created plan 68b37c42-26f2-423c-a045-06d4c5806404 with status DRAFT. | [log](api/RRP-010.log) |
| RRP-011 | PASS | Live HR vophongthank25@gmail.com submitted plan 68b37c42-26f2-423c-a045-06d4c5806404; status=PENDING_APPROVAL. | [log](api/RRP-011.log) |
| RRP-012 | FAIL | Plan is APPROVED but request is PLAN_APPROVED; workbook expects ACTIVE immediately after approval. Current implementation requires start-campaign. | [log](api/RRP-012.log) |
| RRP-013 | PASS | Admin admin@demo.test requested revision and the notes were persisted. | [log](api/RRP-013.log) |
| RRP-014 | PASS | Live HR updated task 3ec980bd-e45b-46f8-b2d7-258ccea72179; durationDays=3. | [log](api/RRP-014.log) |
| AUTH-001 | PASS | Account rms.verification.swt-20260720060659@demo.test created with HTTP 201. | [log](api/AUTH-001.log) |
| AUTH-002 | PASS | Existing system email admin@demo.test was rejected with HTTP 409. | [log](api/AUTH-002.log) |
| AUTH-003 | PASS | Logged in live account admin@demo.test and received access/refresh tokens. | [log](api/AUTH-003.log) |
| AUTH-004 | PASS | Wrong password was rejected with HTTP 401. | [log](api/AUTH-004.log) |
| AUTH-005 | PASS | A new token pair was issued and the old refresh token returned HTTP 401. | [log](api/AUTH-005.log) |
| AUTH-006 | PASS | Logout returned HTTP 204 and revoked the refresh token for admin@demo.test. | [log](api/AUTH-006.log) |
| AUTH-007 | PASS | Reset flow accepted live system account admin@demo.test. | [log](api/AUTH-007.log) |
| AUTH-008 | PASS | Valid reset token changed the password and the new password logged in successfully; original hash restored afterward. | [log](api/AUTH-008.log) |
| AUTH-009 | PASS | Invalid reset token returned HTTP 400 and password hash stayed unchanged. | [log](api/AUTH-009.log) |
| AUTH-010 | PASS | /me returned live Admin admin@demo.test. | [log](api/AUTH-010.log) |
| AUTH-011 | PASS | Admin received a paginated/list response containing 6 visible user(s). | [log](api/AUTH-011.log) |
| AUTH-012 | PASS | Candidate received 403; Admin changed the live user role; original role restored. | [log](api/AUTH-012.log) |
| AUTH-013 | PASS | Gateway and 6 downstream services reported ok. | [log](api/AUTH-013.log) |
| AUTH-014 | PASS | Gateway returned a controlled 5xx while Identity was unavailable, stayed healthy, and login succeeded after automatic recovery. | [log](api/AUTH-014.log) |
| INT-001 | PASS | Scheduled interview c555bf7d-272f-439f-9e97-8100cf85e2a1 for a live candidate/application. | [log](api/INT-001.log) |
| INT-002 | FAIL | GET /interviews/available-slots?start=2026-07-21T06%3A08%3A18.032Z&end=2026-07-27T06%3A08%3A18.032Z: expected 200, received 404 | [log](api/INT-002.log) |
| INT-003 | PASS | Interview 321c1ca4-d7bf-4cfc-907c-4e32b674c011 was rescheduled with the complete live panel. | [log](api/INT-003.log) |
| INT-004 | PASS | Interview 321c1ca4-d7bf-4cfc-907c-4e32b674c011 moved to CANCELLED; notifications were returned. | [log](api/INT-004.log) |
| INT-005 | PASS | Two live panel members recorded feedback; interview 3df6124a-47c8-4fc9-8958-9935b5b0554e is COMPLETED. | [log](api/INT-005.log) |
| INT-006 | PASS | Admin decision, offer, and live candidate acceptance completed request be2796f7-4646-43bf-8cc7-1378c9705b96. | [log](api/INT-006.log) |
| CV-001 | PASS | PDF uploaded as CV bec9a25a-4ab3-4a4e-b54b-52febd371cc7. | [log](api/CV-001.log) |
| CV-002 | PASS | Executable upload was rejected with HTTP 400. | [log](api/CV-002.log) |
| CV-003 | PASS | Worker extracted 1595 characters; parsedAt=2026-07-20T06:08:57.888Z. | [log](api/CV-003.log) |
| CV-004 | PASS | Current semantic endpoint /talent/search returned 2 ranked live candidate result(s); workbook route /candidates/search has drifted. | [log](api/CV-004.log) |
| CV-005 | PASS | Live candidate profile 1a0ecd06-1dce-4e6b-a70b-5be3bed5aade updated; original summary restored. | [log](api/CV-005.log) |
| CV-006 | PASS | Live HR downloaded 654801 bytes of the candidate CV. | [log](api/CV-006.log) |
| CV-007 | PASS | Candidate de190421vovanthanhphong@gmail.com received HTTP 403 for another candidate's CV. | [log](api/CV-007.log) |
| NOTI-001 | PASS | Returned 24 notification(s) scoped to live HR vophongthank25@gmail.com. | [log](api/NOTI-001.log) |
| NOTI-002 | PASS | Notification 583cf713-b649-4ba1-a21d-d067328b8ee1 changed to read; restored to unread afterward. | [log](api/NOTI-002.log) |
| NOTI-003 | PASS | 24 notification(s) marked read; original unread set restored. | [log](api/NOTI-003.log) |
| NOTI-004 | PASS | Current list endpoint reports 24 unread notification(s), matching the database. | [log](api/NOTI-004.log) |
| NOTI-005 | PASS | 3 interview email log(s) reached SENT. | [log](api/NOTI-005.log) |
| REP-001 | PASS | Annual report returned keys: year, summary, yoyComparison, departmentBreakdown, managerPerformance, timeToHireByStage. | [log](api/REP-001.log) |
| REP-002 | PASS | Department report returned for live department Engineer. | [log](api/REP-002.log) |
| REP-003 | PASS | Time-to-hire report returned keys: averageTimeToHireDays, averageTimeInStageDays, totalCompletedHires. | [log](api/REP-003.log) |
| REP-004 | PASS | Pipeline returned keys: totalActiveCampaigns, totalCampaigns, breakdown. | [log](api/REP-004.log) |
| REP-005 | PASS | Live Candidate de190421vovanthanhphong@gmail.com received HTTP 403. | [log](api/REP-005.log) |
| DEF-001 | BLOCKED | No defect-management API/module or external issue tracker is present in the supplied system, so workflow New -> Assigned cannot be executed. | [log](api/DEF-001.log) |
| DEF-002 | BLOCKED | No persisted defect with status Fixed and no defect-management integration exists to retest/close/reopen. | [log](api/DEF-002.log) |
