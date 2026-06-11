# 3. Tech Stack

## Architecture: API Gateway + Microservices

```
recruitment-rms/
├── services/                         # BACKEND (NestJS microservices)
│   ├── gateway/                      # API Gateway — HTTP entry, CORS, Swagger, auth, routing
│   ├── identity/                     # Auth + Users + Organizations + Departments (TCP :3010)
│   ├── recruiting/                   # RecruitmentRequests + Plans + Interviews + Results (TCP :3011)
│   ├── profiles/                     # Candidate Profiles + Documents + CV Vectors (TCP :3012)
│   ├── notification/                 # Email notifications, interview invites, offer/rejection letters (TCP :3013)
│   └── worker/                       # BullMQ async job processor (CV parsing, embedding generation)
│
├── webapp/                           # FRONTEND — React (Vite) SPA
│   └── src/                          # Recruitment workflow management UI
│
├── packages/                         # SHARED LIBRARIES
│   ├── contracts/                    # Shared TypeScript DTOs, enums, Zod schemas
│   ├── ui/                           # Shared UI component library (Radix UI primitives)
│   ├── config/                       # Shared ESLint, TypeScript configs
│   ├── database/                     # Prisma schema, migrations, repositories
│   ├── queue/                        # BullMQ job definitions
│   └── ai/                           # Vector search utilities, embedding helpers
└── turbo.json                        # Turborepo pipeline config
```

**Request flow:**

```
webapp :3000 → gateway :3001 → TCP → identity :3010
                                    → recruiting :3011
                                    → profiles :3012
                                    → notification :3013
                              → BullMQ → worker
```

## Frontend Stack (`webapp/`)

| Layer             | Technology                   | Why                                                                     |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------- |
| **Framework**     | React 19 (Vite 6)            | Instant HMR, simple static deployment, no SSR complexity                |
| **Routing**       | React Router v7              | Role-based SPA navigation                                               |
| **UI Components** | Radix UI                     | Accessible primitives, CSS variable theming                             |
| **Styling**       | Tailwind CSS + CSS Variables | Tailwind utilities for layout/spacing + CSS variable tokens for theming |
| **Data Tables**   | TanStack Table               | Headless, sortable, filterable tables for tracking & reporting          |
| **Calendar**      | FullCalendar / custom        | Interview scheduling with drag & drop                                   |
| **State**         | React Query (TanStack)       | Server state management, caching, optimistic updates                    |

## Backend Stack (`services/`)

| Layer               | Technology           | Why                                                                  |
| ------------------- | -------------------- | -------------------------------------------------------------------- |
| **API Gateway**     | NestJS HTTP app      | Single entry point — CORS, Swagger, auth validation, request routing |
| **Microservices**   | NestJS TCP transport | Domain-isolated services with typed message patterns                 |
| **Database**        | PostgreSQL + JSONB   | Relational integrity + flexible metadata                             |
| **Vector Search**   | pgvector             | Semantic CV similarity search without external service               |
| **Queue**           | Redis + BullMQ       | Async CV parsing, embedding generation                               |
| **Auth**            | JWT + refresh tokens | Stateless auth with role-based guards                                |
| **File Processing** | pdf-parse, mammoth   | CV text extraction from PDF and DOCX                                 |
| **Email**           | Nodemailer / SMTP    | Interview invitations, offer letters, rejection emails               |

## Design System

Design tokens defined in `packages/ui/src/styles/tokens.css`.

| Token Category  | CSS Variable Prefix                  | Key Values                                                          |
| --------------- | ------------------------------------ | ------------------------------------------------------------------- |
| **Backgrounds** | `--wr-bg-*`                          | `#faf8f5` (ivory page) → `#fefdfb` (surface) → `#f5f2ed` (elevated) |
| **Text**        | `--wr-text-*`                        | `#1c1c28` (primary) → `#5c5c6e` (secondary) → `#8a8a9a` (muted)     |
| **Accent**      | `--wr-accent-*`                      | `#2b7a8e` (blue-teal primary) with hover/active states              |
| **Semantic**    | `--wr-success/warning/error/neutral` | Each with bg + text + border variants                               |
| **Status**      | `--wr-status-*`                      | Colors mapped to request/interview/plan status states               |
| **Typography**  | `--wr-font-*`                        | IBM Plex Sans (UI) + IBM Plex Mono (data/code)                      |
| **Spacing**     | `--wr-space-*`                       | 8px base unit, 4px compact sub-unit (0–64px)                        |
| **Elevation**   | `--wr-shadow-*`                      | sm → md → lg → overlay (restrained, low-intensity)                  |
| **Radius**      | `--wr-radius-*`                      | 4px → 6px → 8px → 12px → 9999px                                     |

### UI Primitives (`packages/ui/src/primitives/`)

| Component        | Built on                      | Features                                                 |
| ---------------- | ----------------------------- | -------------------------------------------------------- |
| **Button**       | @radix-ui/react-slot          | 4 variants (primary/secondary/ghost/danger), 3 sizes     |
| **Input**        | native                        | Error state, disabled state, focus ring                  |
| **Textarea**     | native                        | Vertical resize, error state                             |
| **Select**       | @radix-ui/react-select        | Themed dropdown with keyboard navigation                 |
| **Badge**        | custom                        | Semantic color variants via CSS variables                |
| **StatusBadge**  | custom                        | Request/interview status-specific styling                |
| **Tooltip**      | @radix-ui/react-tooltip       | Dark tooltip with arrow, configurable position           |
| **Dialog**       | @radix-ui/react-dialog        | Modal + Drawer (side panel) variants                     |
| **Tabs**         | @radix-ui/react-tabs          | Active border accent styling                             |
| **DropdownMenu** | @radix-ui/react-dropdown-menu | Items, separators, labels                                |
| **Separator**    | @radix-ui/react-separator     | Horizontal/vertical                                      |
| **ScrollArea**   | @radix-ui/react-scroll-area   | Custom themed scrollbars                                 |
| **Toast**        | @radix-ui/react-toast         | 4 variants (default/success/warning/error), auto-dismiss |

---
