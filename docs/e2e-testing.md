# End-to-End Role Flow Testing

## Scope

The role-flow suites verify the running gateway and web application against the enterprise hiring
workflow. They do not use mock authentication or mock service responses.

- `test:e2e:roles` exercises the API workflow from Department Head request creation through
  Candidate offer acceptance.
- `test:ui:roles` signs in through the real login form for HR, Department Head, Candidate, and
  Admin at desktop and mobile viewports.
- `cv-demo.pdf` is the default CV fixture for the Candidate upload step.

Both runners accept credentials as CLI options so passwords are not stored in source control.

## Verified Accounts

| Account                             | Expected role   |
| ----------------------------------- | --------------- |
| `vophongthank25@gmail.com`          | HR              |
| `pineandy2@gmail.com`               | HR              |
| `nlbtboss1@gmail.com`               | Department Head |
| `de190421vovanthanhphong@gmail.com` | Candidate       |
| `fongwuvi@gmail.com`                | Candidate       |
| `admin@demo.test`                   | Admin           |

## API Workflow

Start the stack first:

```bash
npm run dev
```

Run the API suite with one account from each role:

```bash
npm run test:e2e:roles -- \
  --hr-email=<hr-email> --hr-password=<hr-password> \
  --dept-email=<department-head-email> --dept-password=<department-head-password> \
  --candidate-email=<candidate-email> --candidate-password=<candidate-password> \
  --admin-email=<admin-email> --admin-password=<admin-password> \
  --cv=cv-demo.pdf
```

The runner checks these transitions:

1. Department Head creates and submits a recruitment request.
2. HR claims and forwards the request.
3. Admin approves the request.
4. HR completes the scaffolded task plan, submits it, and starts the approved campaign.
5. HR publishes a job posting.
6. Candidate uploads a CV and applies.
7. HR schedules an interview; Candidate and panel confirm attendance.
8. Panel members record feedback and HR submits the final recommendation.
9. Admin makes the hire decision and Candidate accepts the generated offer.

Every run uses an `E2E-<timestamp>` marker so test records can be identified without touching
pre-existing recruitment data.

## UI Workflow

```bash
npm run test:ui:roles -- \
  --hr-email=<hr-email> --hr-password=<hr-password> \
  --dept-email=<department-head-email> --dept-password=<department-head-password> \
  --candidate-email=<candidate-email> --candidate-password=<candidate-password> \
  --admin-email=<admin-email> --admin-password=<admin-password>
```

The UI suite checks role redirects, JavaScript errors, blank renders, page-level horizontal
overflow, and button text overflow at `1440x900` and `390x844`. Screenshots are written to
`/tmp/rms-<role>-<viewport>.png`.

## Playwright UI Coverage

The Playwright suite under `e2e/` covers every public route and every Admin, Department Head, HR,
and Candidate route declared by the web application, including dynamic campaign, job-posting, and
offer-detail pages. It also verifies login redirects, authorization boundaries, sign-out, public
form validation, uncaught browser errors, blank renders, and horizontal page overflow.

The stateful workflow tests under `e2e/use-cases/` exercise the user-visible normal, validation,
alternative, and exception flows from the 61 project Use Cases. See
[`use-case-e2e-coverage.md`](./use-case-e2e-coverage.md) for the complete traceability matrix and
for Use Cases that are API/worker-only or still have a UI implementation gap.

The default suite runs Chromium at desktop and mobile viewports. API responses are intercepted with
deterministic browser-level fixtures, so the complete UI suite does not create or mutate development
database records.

```bash
npm run test:ui:e2e
```

Run only the desktop Use Case workflows:

```bash
npm run test:ui:e2e:use-cases
```

Useful variants:

```bash
npm run test:ui:e2e:desktop
npm run test:ui:e2e:cross-browser
npm run test:ui:e2e:firefox
npm run test:ui:e2e:headed
npm run test:ui:e2e:report
```

The cross-browser command runs Chromium and WebKit serially for predictable resource usage.
Firefox remains available as a separate command because some Windows headless environments cannot
initialize its software compositor.

Set `E2E_BASE_URL` to target another web URL. Set `E2E_SKIP_WEBSERVER=1` when that application is
already managed outside Playwright.

## Quality Gates

Run these before merging:

```bash
npm run lint
npm run typecheck
npm run build
npm test --workspace=@wr/gateway -- --runInBand
npm test --workspace=@wr/identity -- --runInBand
npm test --workspace=@wr/interview -- --runInBand
npm test --workspace=@wr/notification -- --runInBand
npm test --workspace=@wr/recruiting -- --runInBand
npm test --workspace=@wr/worker -- --runInBand
npm test --workspace=@wr/ai -- --runInBand
```
