import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
function figmaAsset() {
  return {
    name: 'figma-asset',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) return path.resolve(process.cwd(), 'src/assets', id.slice('figma:asset/'.length));
      return null;
    },
  };
}
export default defineConfig({
  plugins: [react(), tailwindcss(), figmaAsset()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 4000,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // vendorها را در chunkِ جدا بگذار تا بین دیپلوی‌ها کش شوند و لودِ اولیه موازی/سبک‌تر شود.
        manualChunks(id: string) {
          // فقط react/motion را جدا کن (این‌ها به‌هرحال eagerاند و بینِ دیپلوی‌ها کش می‌شوند).
          // بقیهٔ node_modules را دستی chunk نمی‌کنیم تا rollup خودش با احترام به importِ پویا تقسیم کند
          // و dependهای مخصوصِ پنلِ lazy در همان chunkِ lazy بمانند (لودِ اولیه سبک بماند).
          if (id.includes('node_modules')) {
            if (/[\\/](motion|framer-motion)[\\/]/.test(id)) return 'vendor-motion';
            if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          }
        },
      },
    },
  },
});
