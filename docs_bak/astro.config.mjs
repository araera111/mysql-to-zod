import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import pandacss from "@pandacss/astro";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "solarized-dark",
    },
  },
  integrations: [react(), mdx(), pandacss(), pagefind()],
});
