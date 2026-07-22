# RMS Frontend Test Results

Run marker: `SWT-FE-20260720064416`

Browser backend: unavailable. Results below use live API calls, compiled source branches, and React SSR where applicable; FE-007 is blocked.

Summary: PASS=6, FAIL=5, BLOCKED=1

| Test case | Status | Actual | Evidence |
|---|---:|---|---|
| FE-001 | PASS | Invalid email produced the inline validation message and the submit branch returns early. | [log](ui/FE-001.log) |
| FE-002 | PASS | All four live roles map to distinct protected dashboard components; webapp typecheck passed. | [log](ui/FE-002.log) |
| FE-003 | FAIL | Correct request be2796f7-4646-43bf-8cc7-1378c9705b96 is loaded, but the UI opens an overlay modal; workbook expects navigation to a detail page. | [log](ui/FE-003.log) |
| FE-004 | PASS | Missing dates are blocked in the plan form and the live API also rejected an empty plan with HTTP 400. | [log](ui/FE-004.log) |
| FE-005 | FAIL | Manual date/time scheduling creates interviews, but the workbook step requires choosing an available slot; no slot UI exists and the available-slots API returns 404. | [log](ui/FE-005.log) |
| FE-006 | PASS | Live HR search returned 1 candidate(s), sorted by relevance score. | [log](ui/FE-006.log) |
| FE-007 | BLOCKED | Chrome/Edge/Firefox visual comparison could not run because the configured browser-control runtime exposed no browser backend. | [log](ui/FE-007.log) |
| FE-008 | FAIL | The live API reports 35 unread notification(s) and mark-read works, but the shared Layout has no bell with unread-count badge as required. | [log](ui/FE-008.log) |
| FE-009 | PASS | Sidebar metadata exposes only the expected protected menu entries for all four live roles. | [log](ui/FE-009.log) |
| FE-010 | FAIL | The API rejects the expired token with 401, but AuthContext restores the saved user without checking exp and ProtectedRoute does not redirect on token expiry. | [log](ui/FE-010.log) |
| FE-011 | FAIL | The UI does not crash because pages catch ApiError, but a 500 is surfaced as the raw “Internal server error”; no friendly global 5xx toast/message mapping exists. | [log](ui/FE-011.log) |
| FE-012 | PASS | All four role loading components rendered successfully and the protected route contains an animated spinner branch. | [log](ui/FE-012.log) |
