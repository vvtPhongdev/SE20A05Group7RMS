export default function Header() {
  return (
    <header className="h-16 bg-[#FAF8F5] flex items-center justify-between px-8 border-b border-[#D6CEC4]/60">
      <h2 className="font-bold text-xl">Dashboard</h2>
      <div className="flex items-center gap-4">
        <div className="relative bg-white rounded-lg flex items-center px-3 py-1.5 w-64 border border-[#D6CEC4]">
          <span className="text-slate-400 mr-2">🔍</span>
          <input className="bg-transparent border-none outline-none text-sm w-full" placeholder="Quick Search..." />
        </div>
        <span className="text-xl cursor-pointer">🔔</span>
      </div>
    </header>
  );
}