# CoBest QA session log (chronological, human-verified)

Master issue: [#26 — QA Master](https://github.com/skionin123/cobestme/issues/26)  
Test instructions: [QA_RUNBOOK.md](QA_RUNBOOK.md)  
Development branch: `feat/cobest-mvp-five-milestones`  
**Manual testing status:** NOT STARTED. No human results yet.

## Baseline — 2026-10-12

| Field | Value |
|---|---|
| Production | https://cobest.me — Railway `cobestme` production |
| Current production commit last verified | `af8e9e4d1e71645a24f8c665866554de663b8923` |
| Development PR | #25, draft; current code is **not** deployed to production |
| Automated CI baseline | `2cb648a41012ecfe6b75920cab4fe33d66f095c9` — succeeded before the later QA documentation and site-type readiness changes |
| Manual first test | **T01.1 — Open live landing page** |
| Screenshots | None |
| Human PASS | 0 |
| Human FAIL | 0 |
| BLOCKED | T15.1 provider sandbox prerequisites; others NOT RUN |

The CI baseline confirms only automated test execution; it cannot be counted as a manual PASS. Update this row when a newer code commit is validated.

## Test log

| Test ID | Environment / commit | Result | Actual observation | Evidence | Issue / fix / retest |
|---|---|---|---|---|---|
| T01.1 | LIVE / verify before testing | NOT RUN | Awaiting first landing page visit | None | — |
| T01.2–T01.4 | LIVE | NOT RUN | Signup/login/recovery pending | None | — |
| T02–T06 | LIVE or STAGE | NOT RUN | Onboarding/editor/publishing pending | None | — |
| T07–T08 | LIVE or STAGE | NOT RUN | Categories, products, variants pending | None | — |
| T09 | STAGE | NOT RUN | Suppliers/CSV tests require development deployment | None | — |
| T10–T13 | LIVE or STAGE | NOT RUN | Checkout-safe, orders, reporting, mobile pending | None | — |
| T14 | STAGE | NOT RUN | Independent account/site isolation pending | None | — |
| T15 | STAGE | BLOCKED | Stripe/PayPal merchant sandboxes and reconciliation not configured | None | — |

## Session 001 — scheduled for our first interactive QA walk-through

**Environment:** LIVE (https://cobest.me)  
**Scope:** T01.1 only. Do not mix additional tests into this result.  
**Expected:** Public website is reachable, correct branding and first action are visible, and there is no immediate fatal browser error.  
**Action for tester:** Open the site in a private desktop window, inspect the first screen, and send the result or a redacted screenshot.  
**Result:** NOT RUN — awaiting user observations.  
**Next:** Record PASS/FAIL/BLOCKED, create a bug issue if needed, then move to T01.2.

## Session update instructions

After each **one** subtest:
1. Add a new log line with date/time (Philippine local time), test ID, environment, browser/viewport, expected and actual.
2. Attach/link screenshot safely if supplied. Never store real personal or payment data.
3. If FAIL, file a *distinct issue* and link its number and priority; if a feature is unavailable in that build mark BLOCKED, not FAIL.
4. Update only the corresponding checkbox in issue #26 after the test is verified.
5. Mark fixes `ready for retest` until repeated successfully; link PR/commit.
6. Record exact next test number to continue without guessing what was done.

### Log entry template

```md
### Session XXX — date/time (Asia/Manila)
- Test ID:
- Environment / app version:
- Browser/device:
- Expected:
- Actual:
- Outcome: PASS / FAIL / BLOCKED / NOT RUN
- Screenshot/video evidence (redacted):
- Issue(s):
- Fix commit / PR:
- Retest status:
- Next test:
```
