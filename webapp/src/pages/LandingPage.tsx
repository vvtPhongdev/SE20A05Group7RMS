import React from 'react';
import { Link } from 'react-router-dom';

const approvalRows = [
  { name: 'Sarah Jenkins', role: 'Senior Architect', status: 'Approved', tone: 'bg-[#059669]', text: 'text-[#047857]' },
  { name: 'Michael Chen', role: 'Product Lead', status: 'Pending', tone: 'bg-[#0891b2]', text: 'text-[#0e7490]' },
  { name: 'Elena Rodriguez', role: 'UI Designer', status: 'Draft', tone: 'bg-[#78716c]', text: 'text-[#57534e]' },
  { name: 'David Okafor', role: 'Backend Dev', status: 'Pending', tone: 'bg-[#0891b2]', text: 'text-[#0e7490]' },
];

const steps = [
  { title: 'Submit Request', description: 'Department Head creates recruitment request', icon: 'clipboard' },
  { title: 'Create Plan', description: 'HR Manager builds structured plan', icon: 'calendar' },
  { title: 'Search Candidates', description: 'Semantic CV matching', icon: 'search' },
  { title: 'Approve Hire', description: 'Admin makes final decision', icon: 'check' },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'How It Works', 'Security'],
  Company: ['About Us', 'Careers', 'Contact', 'Legal'],
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    clipboard: <path d="M9 5h6M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 0H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />,
    calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    brain: <path d="M9 7a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6 3 3 0 0 0 5 2.2M15 7a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6 3 3 0 0 1-5 2.2M9 7a3 3 0 0 1 6 0m-6 0v12m6-12v12" />,
    schedule: <path d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-workflow-ivory text-deep-charcoal">
      <header className="fixed top-0 z-30 w-full border-b border-border-warm bg-clean-surface/95 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link className="text-2xl font-bold tracking-tight text-deep-charcoal" to="/">
              RMS
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <a className="border-b-2 border-teal-command pb-1 text-sm font-medium text-teal-command" href="#features">
                Features
              </a>
              <a className="text-sm font-medium text-slate-ink transition hover:text-teal-command" href="#workflow">
                How It Works
              </a>
              <a className="text-sm font-medium text-slate-ink transition hover:text-teal-command" href="#pricing">
                Pricing
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link className="hidden px-3 py-2 text-sm font-medium text-slate-ink transition hover:text-teal-command sm:inline-flex" to="/login">
              Sign In
            </Link>
            <Link
              className="rounded-lg bg-teal-command px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-[#0f766e] active:translate-y-0 active:scale-[0.98]"
              to="/signup"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_1.05fr] lg:py-24">
          <div className="max-w-xl text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-teal-command">Recruitment operations</p>
            <h1 className="text-[40px] font-semibold leading-[1.05] tracking-tight text-deep-charcoal sm:text-[54px]">
              Streamline your entire recruitment workflow
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-ink">
              From department request to final hiring decision. Automate approvals, plan execution, and candidate screening.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg bg-teal-command px-7 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-[#0f766e] active:translate-y-0 active:scale-[0.98]"
                to="/signup"
              >
                Start Free Trial
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border-warm bg-white px-7 text-sm font-semibold text-deep-charcoal transition hover:-translate-y-[1px] hover:border-[#b9aea2] active:translate-y-0 active:scale-[0.98]"
                href="#workflow"
              >
                View Workflow
              </a>
            </div>
          </div>

          <div className="w-full">
            <div className="relative overflow-hidden rounded-xl border border-border-warm bg-clean-surface p-4 shadow-[0_24px_70px_-50px_rgba(28,25,23,0.55)] sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-deep-charcoal">Approval Queue</h2>
                  <p className="mt-1 text-sm text-slate-ink">Requests sorted by action priority</p>
                </div>
                <Icon className="h-5 w-5 text-slate-ink" name="filter" />
              </div>
              <div className="space-y-2">
                {approvalRows.map((row, index) => (
                  <div
                    className="grid grid-cols-[1fr_auto] gap-4 rounded-lg border-b border-[#ece7df] px-3 py-3 transition hover:bg-[#f0f5f2] sm:grid-cols-[1fr_1fr_auto]"
                    key={row.name}
                    style={{ animation: `fadeIn 480ms ease ${index * 80}ms both` }}
                  >
                    <span className="text-sm font-semibold text-deep-charcoal">{row.name}</span>
                    <span className="hidden text-sm text-slate-ink sm:inline">{row.role}</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#bcc9c6] bg-[#e4e9e7] px-3 py-1">
                      <span className={`h-2 w-2 rounded-full ${row.tone}`} />
                      <span className={`text-xs font-semibold ${row.text}`}>{row.status}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-teal-command/10 blur-3xl" />
            </div>
          </div>
        </section>

        <section className="bg-[#f5f3f0] py-20" id="workflow">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <h2 className="mb-14 text-left text-3xl font-semibold tracking-tight text-deep-charcoal sm:text-center">How It Works</h2>
            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="absolute left-6 top-6 hidden h-px w-[calc(100%-48px)] border-t border-dashed border-[#bcc9c6] md:block" />
              {steps.map((step) => (
                <div className="relative flex flex-col items-start md:items-center md:text-center" key={step.title}>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-teal-command bg-clean-surface text-teal-command shadow-sm">
                    <Icon name={step.icon} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-deep-charcoal">{step.title}</h3>
                  <p className="max-w-[18rem] text-sm leading-6 text-slate-ink">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8" id="features">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-xl border border-border-warm bg-clean-surface p-8 lg:col-span-8 lg:p-10">
              <div className="relative z-10 max-w-xl">
                <h2 className="mb-4 text-3xl font-semibold tracking-tight text-deep-charcoal">Plan-Locked Execution</h2>
                <p className="text-lg leading-8 text-slate-ink">
                  Structured workflow enforcement ensures every hire follows the predefined regulatory and organizational roadmap without deviations.
                </p>
              </div>
              <div className="mt-10 grid min-h-64 gap-3 rounded-lg bg-[#f0f5f2] p-4 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3 rounded-lg border border-[#d6cec4] bg-white p-4">
                  {['Request approved', 'Campaign generated', 'Screening assigned', 'Interview panel ready'].map((item, index) => (
                    <div className="flex items-center gap-3" key={item}>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-command text-xs font-semibold text-white">{index + 1}</span>
                      <span className="text-sm font-medium text-deep-charcoal">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-[#d6cec4] bg-[#faf8f5] p-4">
                  <p className="text-sm font-semibold text-deep-charcoal">Execution guardrails</p>
                  <div className="mt-6 space-y-4">
                    <div className="h-2 w-11/12 rounded-full bg-teal-command" />
                    <div className="h-2 w-8/12 rounded-full bg-[#c8c6c4]" />
                    <div className="h-2 w-10/12 rounded-full bg-[#c8c6c4]" />
                    <div className="h-20 rounded-lg border border-dashed border-[#bcc9c6]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              {[
                ['Semantic CV Search', 'Go beyond keywords. RMS understands experience and skills to find strong technical and culture matches.', 'brain'],
                ['Interview Scheduling', 'Automated calendar coordination removes back-and-forth and keeps interview panels aligned.', 'schedule'],
              ].map(([title, description, icon]) => (
                <div className="flex-1 rounded-xl border border-border-warm bg-clean-surface p-8 transition hover:-translate-y-[2px] hover:shadow-[0_18px_50px_-42px_rgba(28,25,23,0.6)]" key={title}>
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-command/10 text-teal-command">
                    <Icon name={icon} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-deep-charcoal">{title}</h3>
                  <p className="text-sm leading-6 text-slate-ink">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8" id="pricing">
          <div className="relative overflow-hidden rounded-xl bg-deep-charcoal p-8 text-left text-workflow-ivory sm:p-12 lg:text-center">
            <div className="relative z-10">
              <h2 className="mb-5 text-3xl font-semibold tracking-tight">Ready to transform your hiring?</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[#c8c6c4]">
                Give every team a clear hiring path with request approvals, campaign planning, candidate screening, and final decisions in one place.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link className="inline-flex h-12 items-center justify-center rounded-lg bg-teal-command px-7 text-sm font-semibold text-white transition hover:bg-[#0f766e] active:scale-[0.98]" to="/signup">
                  Get Started Now
                </Link>
                <Link className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-7 text-sm font-semibold text-workflow-ivory transition hover:bg-white/10 active:scale-[0.98]" to="/signup">
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-deep-charcoal text-workflow-ivory">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 py-12 sm:px-8 md:grid-cols-3">
          <div>
            <span className="text-xl font-semibold">RMS</span>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#c8c6c4]">
              The enterprise standard for high-frequency recruitment workflow management. Built for stability, clarity, and performance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h3 className="mb-5 text-sm font-semibold">{group}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a className="text-sm text-[#c8c6c4] transition hover:text-white" href="#">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 border-t border-white/10 px-5 py-8 text-sm text-[#c8c6c4] sm:px-8 md:flex-row">
          <span>(c) 2026 RMS Recruitment Management System. All rights reserved.</span>
          <div className="flex gap-6">
            <a className="hover:text-white" href="#">Privacy Policy</a>
            <a className="hover:text-white" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
