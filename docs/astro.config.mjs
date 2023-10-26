import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import pandacss from "@pandacss/astro";
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "solarized-dark"
    }
  },
  integrations: [react(), mdx(), pandacss()],
  output: "server",
  adapter: cloudflare()
});