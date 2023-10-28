import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "mysql-to-zod",
      logo: { src: "./src/assets/logo.png" },
      favicon: "./src/assets/logo.png",
      locales: {
        root: {
          label: "日本語",
          lang: "ja",
        },
        en: {
          label: "English",
        },
      },
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
          items: [
            { label: "Config", link: "/options/config" },
            { label: "DBConnection", link: "/options/db-connection" },
            { label: "TableNames", link: "/options/table-names" },
            { label: "Output", link: "/options/output" },
            { label: "Comments", link: "/options/comments" },
            { label: "Type", link: "/options/type" },
            { label: "Schema", link: "/options/schema" },
            { label: "Sync", link: "/options/sync" },
          ],
        },
      ],
    }),
  ],
});
