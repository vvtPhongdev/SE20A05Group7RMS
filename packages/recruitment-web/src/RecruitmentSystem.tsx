import React, { useState, useEffect, useRef } from "react";

// --- Types & Interfaces ---
interface Candidate {
  id: number;
  name: string;
  role: string;
  status: "Approved" | "Pending" | "Draft";
}

interface RecruitmentSystemProps {
  onSignInClick: () => void;
}

export default function RecruitmentSystem({ onSignInClick }: RecruitmentSystemProps) {
  // --- State ---
  const [candidates] = useState<Candidate[]>([
    { id: 1, name: "Sarah Jenkins", role: "Senior Architect", status: "Approved" },
    { id: 2, name: "Michael Chen", role: "Product Lead", status: "Pending" },
    { id: 3, name: "Elena Rodriguez", role: "UI Designer", status: "Draft" },
    { id: 4, name: "David Okafor", role: "Backend Dev", status: "Pending" },
  ]);

  // --- Scroll Animation (Intersection Observer) ---
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observerOptions = { threshold: 0.1 };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  // --- Helper class for active status colors (Inline Tailwind HEX Codes) ---
  const getStatusColorClass = (status: Candidate["status"]) => {
    switch (status) {
      case "Approved": return "bg-[#059669] text-[#059669]";
      case "Pending": return "bg-[#0D9488] text-[#0D9488]";
      case "Draft": return "bg-[#78716C] text-[#78716C]";
      default: return "bg-[#57534E] text-[#57534E]";
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C1917] font-['IBM_Plex_Sans'] antialiased min-h-screen">
      {/* TopNavBar */}
      <header className="bg-white border-b border-[rgba(214,206,196,0.6)] fixed top-0 w-full z-50">
        <nav className="flex justify-between items-center w-full px-8 max-w-[1440px] mx-auto h-16">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold text-[#1C1917]">RMS</span>
            <div className="hidden md:flex items-center gap-6">
              <a className="text-[#0D9488] border-b-2 border-[#0D9488] pb-1 text-sm font-medium transition-colors active:opacity-80" href="#features">Features</a>
              <a className="text-[#57534E] text-sm font-medium hover:text-[#0D9488] transition-colors active:opacity-80" href="#how-it-works">How It Works</a>
              <a className="text-[#57534E] text-sm font-medium hover:text-[#0D9488] transition-colors active:opacity-80" href="#pricing">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onSignInClick}
              className="text-[#57534E] text-sm font-medium px-4 py-2 hover:text-[#0D9488] transition-colors active:opacity-80"
            >
              Sign In
            </button>
            <button className="bg-[#0D9488] text-white text-sm font-medium px-6 py-2 rounded-lg active:scale-95 active:opacity-90 transition-all focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2">
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section 
          ref={addToRefs} 
          className="max-w-[1440px] mx-auto px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16 transition-all duration-700 opacity-0 translate-y-8"
        >
          <div className="flex-1 text-left">
            <h1 className="text-3xl text-[#1C1917] mb-6 max-w-xl font-semibold leading-tight">
              Streamline Your Entire Recruitment Workflow
            </h1>
            <p className="text-lg text-[#57534E] mb-10 max-w-lg">
              From department request to final hiring decision. Automate approvals, plan execution, and candidate screening.
            </p>
            <button className="bg-[#0D9488] text-white px-8 py-4 rounded-lg active:scale-95 active:opacity-90 transition-all text-base font-bold focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2">
              Start Free Trial
            </button>
          </div>
          
          <div className="flex-1 w-full lg:w-auto">
            <div className="bg-white border border-[rgba(214,206,196,0.6)] rounded-xl shadow-sm p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl text-[#1C1917] font-semibold">Approval Queue</h3>
                <span className="material-symbols-outlined text-[#57534E]">filter_list</span>
              </div>
              
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <div 
                    key={candidate.id} 
                    className={`grid grid-cols-3 items-center py-3 hover:bg-[#f0f5f2] transition-colors rounded-lg px-2 ${
                      index !== candidates.length - 1 ? 'border-b border-[#eaefed]' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-[#1C1917]">{candidate.name}</span>
                    <span className="text-sm text-[#57534E]">{candidate.role}</span>
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e4e9e7] border border-[#bcc9c6]">
                        <span className={`w-2 h-2 rounded-full ${getStatusColorClass(candidate.status).split(' ')[0]}`}></span>
                        <span className={`text-xs font-medium ${getStatusColorClass(candidate.status).split(' ')[1]}`}>{candidate.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#0D9488]/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section 
          ref={addToRefs} 
          id="how-it-works"
          className="bg-[#F5F3F0] py-24 transition-all duration-700 opacity-0 translate-y-8"
        >
          <div className="max-w-[1440px] mx-auto px-8">
            <h2 className="text-2xl text-[#1C1917] text-center mb-16 font-semibold">How It Works</h2>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="hidden md:block absolute h-[2px] w-[calc(100%-48px)] left-[24px] top-[24px] z-0 border-t border-dashed border-[#bcc9c6]"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-[#0D9488] flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0D9488]">content_paste</span>
                </div>
                <h4 className="text-xl text-[#1C1917] mb-2 font-semibold">Submit Request</h4>
                <p className="text-sm text-[#57534E] px-4">Department Head creates recruitment request</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-[#0D9488] flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0D9488]">calendar_today</span>
                </div>
                <h4 className="text-xl text-[#1C1917] mb-2 font-semibold">Create Plan</h4>
                <p className="text-sm text-[#57534E] px-4">HR Manager builds structured plan</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-[#0D9488] flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0D9488]">search</span>
                </div>
                <h4 className="text-xl text-[#1C1917] mb-2 font-semibold">Search Candidates</h4>
                <p className="text-sm text-[#57534E] px-4">Semantic CV matching</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-[#0D9488] flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0D9488]">check_circle</span>
                </div>
                <h4 className="text-xl text-[#1C1917] mb-2 font-semibold">Approve Hire</h4>
                <p className="text-sm text-[#57534E] px-4">Admin makes final decision</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards (Asymmetric) */}
        <section 
          ref={addToRefs} 
          id="features"
          className="max-w-[1440px] mx-auto px-8 py-24 transition-all duration-700 opacity-0 translate-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-[rgba(214,206,196,0.6)] rounded-xl p-10 flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="text-3xl text-[#1C1917] mb-4 font-semibold">Plan-Locked Execution</h3>
                <p className="text-lg text-[#57534E] max-w-md">
                  Structured workflow enforcement that ensures every hire follows the predefined regulatory and organizational roadmap without deviations.
                </p>
              </div>
              <div className="mt-12 relative h-64 rounded-lg bg-[#f0f5f2] overflow-hidden">
                <img 
                  alt="Workflow Enforcement" 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPkzBUxRvde0kexdjvcTpxkTw_kIxwnvlMkyVmoXuMN6AggVlRjMU-ZLg7ky8nAqUGg3FdbETiOB1vXHPhTTwuv0yFTYwColVAf2-y2Ej5U_vvQNW4mzvEZteTZtCkOvwQXoCvddzzR6nCgoHpAolMw5E_Ra2-hyF-GWHx8Y7KvVewPYJcNGZjDRiQR09DcffdUdhXhRrIo0qhT_XnomcUOOf8dfcUZOs86M6hfmY-oGo4xLsODUotiqTyZ42b3PzJea9vhmuPCfg"
                />
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex-1 bg-white border border-[rgba(214,206,196,0.6)] rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-[#0D9488]/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#0D9488]">psychology</span>
                </div>
                <h4 className="text-xl text-[#1C1917] mb-2 font-semibold">Semantic CV Search</h4>
                <p className="text-sm text-[#57534E]">
                  Go beyond keywords. Our AI understands the context of experience and skills to find the perfect cultural and technical fit.
                </p>
              </div>
              <div className="flex-1 bg-white border border-[rgba(214,206,196,0.6)] rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-[#0D9488]/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#0D9488]">event_available</span>
                </div>
                <h4 className="text-xl text-[#1C1917] mb-2 font-semibold">Interview Scheduling</h4>
                <p className="text-sm text-[#57534E]">
                  Automated synchronization with calendars. Eliminate the back-and-forth and focus on evaluating talent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          ref={addToRefs} 
          className="max-w-[1440px] mx-auto px-8 py-24 mb-24 transition-all duration-700 opacity-0 translate-y-8"
        >
          <div className="bg-[#1C1917] rounded-xl p-12 text-center text-[#FAF8F5] relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl mb-6 font-semibold">Ready to transform your hiring?</h2>
              <p className="text-lg mb-10 text-[#c8c6c4] max-w-2xl mx-auto">
                Join hundreds of enterprises managing their recruitment lifecycle with precision and ease.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-[#0D9488] text-white text-sm font-medium px-8 py-4 rounded-lg active:scale-95 active:opacity-90 transition-all focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2">Get Started Now</button>
                <button className="border border-[#6d7a77] text-[#FAF8F5] text-sm font-medium px-8 py-4 rounded-lg hover:bg-white/10 transition-colors active:scale-95 active:opacity-90">Request Demo</button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00685f]/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1C1917]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 py-12 max-w-[1440px] mx-auto">
          <div className="flex flex-col gap-6">
            <span className="text-xl text-[#FAF8F5] font-semibold">RMS</span>
            <p className="text-sm text-[#c8c6c4]">
              The enterprise standard for high-frequency recruitment workflow management. Built for stability, clarity, and performance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:col-span-2">
            <div>
              <h5 className="text-sm font-medium text-[#FAF8F5] mb-6">Product</h5>
              <ul className="space-y-4">
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#features">Features</a></li>
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#pricing">Pricing</a></li>
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#how-it-works">How It Works</a></li>
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#security">Security</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-[#FAF8F5] mb-6">Company</h5>
              <ul className="space-y-4">
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#about">About Us</a></li>
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#careers">Careers</a></li>
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#contact">Contact</a></li>
                <li><a className="text-[#c8c6c4] hover:text-white transition-colors hover:translate-x-1 inline-block" href="#legal">Legal</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-8 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-[#c8c6c4]">© 2024 RMS Recruitment Management System. All rights reserved.</span>
            <div className="flex gap-6">
              <a className="text-sm text-[#c8c6c4] hover:text-white" href="#privacy">Privacy Policy</a>
              <a className="text-sm text-[#c8c6c4] hover:text-white" href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}