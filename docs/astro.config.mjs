import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "mysql-to-zod",
      social: {
        github: "https://github.com/araera111/mysql-to-zod",
      },
      sidebar: [
        {
          label: "Start Here",
          items: [{ label: "Getting Started", link: "/" }],
        },
        {
          label: "Options",
          autogenerate: { directory: "options" },
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
