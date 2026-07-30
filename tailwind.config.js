/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        muc: '#16264F',
        giay: '#FFFFFF',
        nen: '#F1F3F7',
        vien: '#D8DCE5',
        dat: '#1F6F54',
        luuy: '#B87503',
        canhbao: '#C8102E',
      },
      fontFamily: {
        giaodien: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        vanban: ['"Noto Serif"', 'Georgia', 'serif'],
        so: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Cỡ nhỏ nhất cho nội dung là 16px; nhãn phụ 14px chỉ dùng cho chú thích
        base: ['1rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
};
