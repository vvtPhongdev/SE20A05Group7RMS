# RMS Screen URL Registry

Document ID: `MAP-02`  
Source: `webapp/src/App.tsx`  
Base URL placeholder: `http://localhost:3000`

These URLs replace screenshots in the Markdown report set. They are development placeholders; replace the host with the deployed web URL when a production environment exists. Dynamic values in braces are placeholders.

## Public and shared screens

| ID         | Screen          | URL placeholder                       | Actor     | Related use cases |
| ---------- | --------------- | ------------------------------------- | --------- | ----------------- |
| SCR-COM-01 | Login           | http://localhost:3000/login           | All       | UC-03, UC-04      |
| SCR-COM-02 | Sign up         | http://localhost:3000/signup          | Candidate | UC-01, UC-04      |
| SCR-COM-03 | Verify email    | http://localhost:3000/verify-email    | Candidate | UC-02             |
| SCR-COM-04 | Forgot password | http://localhost:3000/forgot-password | All       | UC-07             |
| SCR-COM-05 | Reset password  | http://localhost:3000/reset-password  | All       | UC-07             |
| SCR-COM-06 | Unauthorized    | http://localhost:3000/unauthorized    | All       | UC-60             |

## Admin screens

| ID         | Screen                | URL placeholder                               | Main functions                                   |
| ---------- | --------------------- | --------------------------------------------- | ------------------------------------------------ |
| SCR-ADM-01 | Admin Dashboard       | http://localhost:3000/admin                   | Approval counts, active campaigns, tracking      |
| SCR-ADM-02 | Approval Queue        | http://localhost:3000/admin/approval-queue    | Request and plan approval/rejection/revision     |
| SCR-ADM-03 | All Requests          | http://localhost:3000/admin/requests          | Global request search and timeline               |
| SCR-ADM-04 | Interview Results     | http://localhost:3000/admin/interview-results | Review feedback, hire/reject/request information |
| SCR-ADM-05 | User Management       | http://localhost:3000/admin/users             | Users, roles and active status                   |
| SCR-ADM-06 | System Settings       | http://localhost:3000/admin/settings          | Organization and department settings             |
| SCR-ADM-07 | Annual Reports        | http://localhost:3000/admin/reports           | Annual metrics and export                        |
| SCR-ADM-08 | Department Statistics | http://localhost:3000/admin/dept-stats        | Department drill-down                            |

## Department Head screens

| ID        | Screen                  | URL placeholder                                                                         | Main functions                                         |
| --------- | ----------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| SCR-DH-01 | Department Dashboard    | http://localhost:3000/dept-head                                                         | Own request status and progress                        |
| SCR-DH-02 | Create Request          | http://localhost:3000/dept-head/create-request                                          | Draft and submit recruitment request                   |
| SCR-DH-03 | Requests                | http://localhost:3000/dept-head/requests                                                | Edit, resubmit, delete allowed requests; view timeline |
| SCR-DH-04 | Interviews and Feedback | http://localhost:3000/dept-head/interviews and http://localhost:3000/dept-head/feedback | View panel schedule and submit feedback                |
| SCR-DH-05 | Department Settings     | http://localhost:3000/dept-head/settings                                                | Department profile and team members                    |

## HR Leader screens

| ID        | Screen                | URL placeholder                                            | Main functions                                         |
| --------- | --------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| SCR-HR-01 | HR Dashboard          | http://localhost:3000/hr                                   | Queue, workload, campaign and interview summary        |
| SCR-HR-02 | Request Queue         | http://localhost:3000/hr/requests                          | Claim/review/return/forward requests                   |
| SCR-HR-03 | Campaigns             | http://localhost:3000/hr/campaigns                         | List campaign plans and status                         |
| SCR-HR-04 | Campaign Detail       | http://localhost:3000/hr/campaigns/{campaignId}            | Create/submit/resubmit/start plan                      |
| SCR-HR-05 | Task Planner          | http://localhost:3000/hr/tasks                             | Create, assign and update task status                  |
| SCR-HR-06 | Job Posting Workspace | http://localhost:3000/hr/job-postings/{requestId}          | Draft, media, publish and close posting                |
| SCR-HR-07 | Talent Pool           | http://localhost:3000/hr/candidates                        | Browse candidates and CVs                              |
| SCR-HR-08 | Candidate Search      | http://localhost:3000/hr/search                            | Hybrid/vector talent search and shortlist              |
| SCR-HR-09 | Interview Schedule    | http://localhost:3000/hr/interviews                        | Schedule/reschedule/cancel and invite panel            |
| SCR-HR-10 | Interview Detail      | http://localhost:3000/hr/interview-detail?id={interviewId} | Interview, candidate, attendance and invitation detail |
| SCR-HR-11 | Interview Results     | http://localhost:3000/hr/results                           | Panel feedback and final recommendation                |
| SCR-HR-12 | Pipeline Reports      | http://localhost:3000/hr/reports                           | Pipeline and time-to-hire metrics                      |
| SCR-HR-13 | System Notifications  | http://localhost:3000/hr/notifications                     | Notification history and read state                    |

## Candidate screens

| ID         | Screen              | URL placeholder                                 | Main functions                                            |
| ---------- | ------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| SCR-CAN-01 | Candidate Dashboard | http://localhost:3000/candidate                 | Profile, CV, interviews, offers and notifications summary |
| SCR-CAN-02 | Candidate Profile   | http://localhost:3000/candidate/profile         | View/update profile and avatar                            |
| SCR-CAN-03 | Upload CV           | http://localhost:3000/candidate/upload-cv       | Upload, replace, delete and track CV processing           |
| SCR-CAN-04 | Notifications       | http://localhost:3000/candidate/notifications   | Interview, result, offer and status notifications         |
| SCR-CAN-05 | Interviews          | http://localhost:3000/candidate/interviews      | View and respond to interview schedule                    |
| SCR-CAN-06 | Offers              | http://localhost:3000/candidate/offers          | List offers                                               |
| SCR-CAN-07 | Offer Details       | http://localhost:3000/candidate/offer/{offerId} | Review, accept or decline offer                           |

## Authorization rule

Every role-specific route is wrapped by `ProtectedRoute`. The Gateway remains the enforcement boundary; hiding a frontend route is not authorization. HTTP calls must use `/api/v1`, carry the JWT, and pass the Gateway role guards and service-level ownership/state checks.
