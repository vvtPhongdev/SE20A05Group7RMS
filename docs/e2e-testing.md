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
