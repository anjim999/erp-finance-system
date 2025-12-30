import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      global: 'window',
    },

    server: {
      port: 5173,
      strictPort: true,
      hmr: false,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },


    resolve: {
      dedupe: ["react", "react-dom", "react-icons", "date-fns", "react-router-dom", "react-toastify", "socket.io-client"],
      alias: {
        "react-icons": path.resolve(__dirname, "node_modules/react-icons"),
        "date-fns": path.resolve(__dirname, "node_modules/date-fns"),
        "react-router-dom": path.resolve(__dirname, "node_modules/react-router-dom"),
        "react-toastify": path.resolve(__dirname, "node_modules/react-toastify"),
        "socket.io-client": path.resolve(__dirname, "node_modules/socket.io-client")
      }
    },

    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            charts: ["recharts"]
          }
        }
      }
    }
  };
});
