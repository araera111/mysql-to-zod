import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import pandacss from "@pandacss/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://araera111.github.io/",
  base: "/mysql-to-zod",
  markdown: {
    shikiConfig: {
      theme: "solarized-dark",
    },
  },
  integrations: [react(), mdx(), pandacss()],
});
