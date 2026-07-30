import { cpSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const goc = dirname(fileURLToPath(import.meta.url));

/**
 * Thư mục `data/` nằm ở gốc kho (theo cấu trúc trong CLAUDE.md) chứ không nằm
 * trong `public/`, nên phải chép sang `dist/` khi build để GitHub Pages phục vụ được.
 * Ở chế độ dev, máy chủ của Vite đã tự phục vụ file trong gốc dự án.
 */
function chepThuMucDuLieu(): Plugin {
  return {
    name: 'chep-thu-muc-du-lieu',
    apply: 'build',
    closeBundle() {
      const nguon = resolve(goc, 'data');
      if (!existsSync(nguon)) return;
      cpSync(nguon, resolve(goc, 'dist/data'), { recursive: true });
    },
  };
}

// GitHub Pages phục vụ kho tại https://<tài-khoản>.github.io/giamsat/
export default defineConfig({
  base: '/giamsat/',
  // Ứng dụng dùng HashRouter nên không cần máy chủ viết lại đường dẫn. Để chế độ
  // 'mpa' thì tệp không tồn tại trả về đúng mã 404 thay vì rơi về index.html —
  // nhờ vậy cơ chế lùi từ data/ sang data/mau/ chạy giống hệt trên GitHub Pages.
  appType: 'mpa',
  plugins: [react(), chepThuMucDuLieu()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
