import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Build-time security check plugin
const securityCheckPlugin = () => ({
  name: 'security-check',
  buildEnd() {
    // Verify no Vision API key in environment variables
    const dangerousKeys = [
      'VITE_GOOGLE_CLOUD_VISION_API_KEY',
      'GOOGLE_CLOUD_VISION_API_KEY'
    ];
    
    for (const key of dangerousKeys) {
      if (process.env[key]) {
        throw new Error(
          `SECURITY ERROR: ${key} found in build environment! ` +
          `This key must only be used server-side in edge functions.`
        );
      }
    }
    
    console.log('✓ Security check passed: No Vision API keys in client bundle');
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    securityCheckPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
