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
  const [candidates] = useState<Candidate[]>([
    { id: 1, name: "Sarah Jenkins", role: "Senior Architect", status: "Approved" },
    { id: 2, name: "Michael Chen", role: "Product Lead", status: "Pending" },
    { id: 3, name: "Elena Rodriguez", role: "UI Designer", status: "Draft" },
    { id: 4, name: "David Okafor", role: "Backend Dev", status: "Pending" },
  ]);

  const sectionsRef = useRef<HTMLDivElement[]>([]);

  // Intersection Observer cho hiệu ứng scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, { threshold: 0.1 });

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  // Helper để lấy màu trạng thái
  const getStatusStyle = (status: Candidate["status"]) => {
    switch (status) {
      case "Approved": return { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-600" };
      case "Pending": return { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-600" };
      case "Draft": return { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-600" };
      default: return { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-600" };
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C1917] font-sans antialiased min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#D6CEC4]/60 fixed top-0 w-full z-50">
        <nav className="flex justify-between items-center w-full px-8 max-w-[1440px] mx-auto h-16">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold text-[#00685F]">RMS</span>
            <div className="hidden md:flex gap-6">
              {['Features', 'How It Works', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-[#57534E] text-sm font-medium hover:text-[#0D9488]">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onSignInClick} className="text-sm font-medium text-[#57534E] hover:text-[#0D9488]">Sign In</button>
            <button className="bg-[#0D9488] text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-[#00685F] transition-all">Get Started</button>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section ref={addToRefs} className="max-w-[1440px] mx-auto px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16 transition-all duration-700 opacity-0 translate-y-8">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-[#1C1917] mb-6 leading-tight">Streamline Your Recruitment Workflow</h1>
            <p className="text-lg text-[#57534E] mb-10">Automate approvals, plan execution, and candidate screening seamlessly.</p>
            <button className="bg-[#0D9488] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#00685F] transition-all">Start Free Trial</button>
          </div>
          
          <div className="flex-1 w-full bg-white border border-[#D6CEC4]/60 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Approval Queue</h3>
            <div className="space-y-3">
              {candidates.map((c) => {
                const style = getStatusStyle(c.status);
                return (
                  <div key={c.id} className="grid grid-cols-3 items-center py-3 border-b last:border-0 border-[#eaefed]">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm text-[#57534E]">{c.role}</span>
                    <div className="flex justify-end">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                        <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                        <span className="text-xs font-bold">{c.status}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Thêm các section How It Works, Features... tương tự như cấu trúc bạn đã có */}
        {/* ... */}
      </main>
    </div>
  );
}