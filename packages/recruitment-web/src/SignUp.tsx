import React, { useState } from "react";

interface SignUpProps {
  onSignInClick: () => void;
}

export default function SignUp({ onSignInClick }: SignUpProps) {
  // --- State quản lý Form ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [selectedRole, setSelectedRole] = useState("hr_manager");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTOS, setAgreeTOS] = useState(false);

  // --- State ẩn/hiện mật khẩu ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    console.log("Xử lý đăng ký tài khoản:", {
      fullName,
      email,
      orgCode,
      selectedRole,
      password,
      agreeTOS,
    });
  };

  return (
    <div className="bg-[#FAF8F5] text-[#57534E] font-['IBM_Plex_Sans'] antialiased min-h-screen">
      <main className="flex min-h-screen max-w-[1440px] mx-auto overflow-hidden shadow-2xl">
        
        {/* CỘT TRÁI: Thương hiệu & Tính năng hệ thống */}
        <section className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-8 overflow-hidden bg-[#008378]">
          {/* Background Decorations */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          ></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#89f5e7] opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#0D9488] opacity-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <span className="material-symbols-outlined text-white bg-white/20 p-2 rounded-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                dataset
              </span>
              <span className="text-2xl font-bold text-white tracking-tight">RecruitFlow RMS</span>
            </div>
            
            <div className="max-w-xl">
              <h1 className="text-3xl text-white mb-6 font-semibold leading-tight">
                Join Your Organization's Recruitment Workflow
              </h1>
              <p className="text-lg text-white/90 mb-12">
                Create your account to manage hiring requests, track approvals, and coordinate recruitment plans in one central enterprise workspace.
              </p>
              
              <div className="space-y-8">
                {/* Feature 1 */}
                <div className="flex items-start gap-4 group">
                  <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[#0D9488]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      dashboard
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm text-white font-semibold">Role-based dashboards</h3>
                    <p className="text-sm text-white/80">Tailored interfaces for HR, managers, and interviewers.</p>
                  </div>
                </div>
                
                {/* Feature 2 */}
                <div className="flex items-start gap-4 group">
                  <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[#0D9488]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      timeline
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm text-white font-semibold">Real-time status tracking</h3>
                    <p className="text-sm text-white/80">Monitor every candidate and approval stage instantly.</p>
                  </div>
                </div>
                
                {/* Feature 3 */}
                <div className="flex items-start gap-4 group">
                  <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[#0D9488]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      account_tree
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm text-white font-semibold">Structured approval workflow</h3>
                    <p className="text-sm text-white/80">Standardized paths for rapid, compliant hiring decisions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 pt-12 border-t border-white/10">
            <p className="text-xs text-white/70 uppercase tracking-widest mb-6 font-medium">
              Trusted by enterprise HR teams
            </p>
            <div className="flex items-center gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img alt="Client Logos" class="h-10 object-contain" src="https://lh3.googleusercontent.com/aida/ADBb0ui9Hq3VTe5SIAd02NuIEnSTJnxPi__iOv_vCPtQKkTuLOOKe3Ff3KCfJCOANIabjzw8iXRtlps747KgvpWSn_R30kmUSJOkuW5OSy6zVFAW-0pBTknT4mbxZdCEbLGuc0l1ajnPPc75BCfkPoWruxQ0nuqESGatqOp7Lca7gzDc4fQI9bohFU18l3ubaQtnQ4rb59vLCEEQ_Oq_5BP5Og6NWnHX2sybrvXUbwlWVQSFnbjIGkPKREfiqno"/>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: Form Đăng Ký */}
        <section className="w-full lg:w-[45%] bg-white flex flex-col p-6 overflow-y-auto">
          {/* Nút chuyển sang Đăng nhập */}
          <div className="flex justify-end mb-12">
            <p className="text-sm text-[#57534E]">
              Already have an account?{" "}
              <button 
                onClick={onSignInClick}
                className="text-[#0D9488] font-semibold hover:underline transition-all active:scale-95"
              >
                Sign in
              </button>
            </p>
          </div>
          
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-2xl text-[#1C1917] font-semibold mb-2">Create Account</h2>
              <p className="text-base text-[#57534E]">Fill in your details to get started with RecruitFlow</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name */}
              <div>
                <label className="block text-sm text-[#3d4947] font-medium mb-1.5" htmlFor="full_name">
                  Full Name
                </label>
                <input 
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[rgba(214,206,196,0.6)] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all placeholder:text-[#bcc9c6]" 
                  id="full_name" 
                  type="text" 
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-[#3d4947] font-medium mb-1.5" htmlFor="email">
                  Work Email
                </label>
                <input 
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[rgba(214,206,196,0.6)] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all placeholder:text-[#bcc9c6]" 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Org Code */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-sm text-[#3d4947] font-medium" htmlFor="org_code">
                    Organization Code
                  </label>
                  <span className="material-symbols-outlined text-[16px] text-[#6d7a77] cursor-help" title="Contact your HR administrator for your team's code">
                    info
                  </span>
                </div>
                <input 
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[rgba(214,206,196,0.6)] rounded-lg font-['IBM_Plex_Mono'] focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all placeholder:text-[#bcc9c6]" 
                  id="org_code" 
                  type="text" 
                  placeholder="ORG-0000"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                />
              </div>

              {/* Role Selector */}
              <div>
                <span className="block text-sm text-[#3d4947] font-medium mb-3">Select Your Role</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "dept_head", label: "Department Head" },
                    { id: "hr_manager", label: "HR Manager" },
                    { id: "interviewer", label: "Interviewer" },
                    { id: "candidate", label: "Candidate" }
                  ].map((role) => (
                    <label key={role.id} className="cursor-pointer select-none">
                      <input 
                        className="hidden peer" 
                        name="role" 
                        type="radio" 
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={() => setSelectedRole(role.id)}
                      />
                      <div className="px-4 py-3 text-center rounded-lg border border-[rgba(214,206,196,0.6)] bg-[#FAF8F5] text-[#625d5b] hover:bg-[#f0f5f2] peer-checked:bg-[#0D9488] peer-checked:text-white peer-checked:border-[#0D9488] transition-all text-xs font-medium">
                        {role.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm text-[#3d4947] font-medium mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[rgba(214,206,196,0.6)] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all" 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 top-[38px] text-[#6d7a77] hover:text-[#0D9488] transition-colors" 
                    onClick={() => setShowPassword(!showPassword)} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                
                <div className="relative">
                  <label className="block text-sm text-[#3d4947] font-medium mb-1.5" htmlFor="confirm_password">
                    Confirm Password
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[rgba(214,206,196,0.6)] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all" 
                    id="confirm_password" 
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 top-[38px] text-[#6d7a77] hover:text-[#0D9488] transition-colors" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showConfirmPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              {/* TOS */}
              <div className="flex items-start gap-3">
                <input 
                  className="mt-1 w-4 h-4 text-[#0D9488] bg-[#FAF8F5] border-[rgba(214,206,196,0.6)] rounded focus:ring-[#0D9488]" 
                  id="tos" 
                  type="checkbox"
                  required
                  checked={agreeTOS}
                  onChange={(e) => setAgreeTOS(e.target.checked)}
                />
                <label className="text-xs text-[#57534E]" htmlFor="tos">
                  I agree to the <a className="text-[#0D9488] underline" href="#tos">Terms of Service</a> and <a class="text-[#0D9488] underline" href="#privacy">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit */}
              <button 
                className="w-full py-4 bg-[#0D9488] text-white font-semibold rounded-lg hover:bg-[#00685f] active:scale-[0.98] transition-all shadow-md" 
                type="submit"
              >
                Create Account
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-2">
                <div className="flex-grow border-t border-[rgba(214,206,196,0.6)]"></div>
                <span className="px-4 text-xs font-medium text-[#bcc9c6] bg-white">or</span>
                <div className="flex-grow border-t border-[rgba(214,206,196,0.6)]"></div>
              </div>

              {/* SSO */}
              <button className="w-full py-4 flex items-center justify-center gap-3 border border-[#0D9488] text-[#0D9488] font-semibold rounded-lg hover:bg-[#0D9488]/5 active:scale-[0.98] transition-all" type="button">
                <span className="material-symbols-outlined">key</span>
                Sign in with SSO
              </button>
            </form>
            
            <footer className="mt-12 text-center">
              <p className="text-xs text-[#57534E] opacity-70">
                Need help? <a className="text-[#0D9488] hover:underline" href="#help">Contact your HR administrator</a>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}