import react from "@astrojs/react";
import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "solarized-dark",
    },
  },
  integrations: [react(), mdx()],
});
