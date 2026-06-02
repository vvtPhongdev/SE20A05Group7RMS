/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Thiết lập bảng màu chính xác theo Design System của bạn
        "workflow-ivory": "#FAF8F5",   // Nền Ivory ấm
        "deep-charcoal": "#1C1917",    // Chữ tiêu đề / Màu nền Footer
        "slate-ink": "#57534E",        // Chữ nội dung (Slate)
        "teal-command": "#0D9488",     // Màu Accent duy nhất (Teal)
        "clean-surface": "#FFFFFF",    // Nền trắng của Card và Header
        "border-warm": "rgba(214, 206, 196, 0.6)", // Viền ấm 1px
        
        // Màu sắc bổ trợ cho các Badge trạng thái trong hàng đợi
        "approved": "#059669",
        "pending": "#0D9488",
        "draft": "#78716C",
        "surface-container": "#eaefed",
        "surface-container-low": "#f0f5f2",
        "surface-container-high": "#e4e9e7",
      },
      spacing: {
        "max-container": "1440px",    // Độ rộng chuẩn Desktop 1440px
        "margin-lg": "32px",
        "margin-md": "24px",
        "margin-sm": "16px",
        "gutter": "24px",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'], // Chỉ định font IBM Plex Sans toàn trang
      },
    },
  },
  plugins: [],
}