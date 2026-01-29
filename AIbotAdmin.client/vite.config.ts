import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import child_process from "child_process";
import { env } from "process";
import packageJson from "./package.json";
//import { dynamicBase } from './src/plugins/dynamic-base';
import { dynamicBase } from "vite-plugin-dynamic-base";

const baseFolder = env.APPDATA !== undefined && env.APPDATA !== "" ? `${env.APPDATA}/ASP.NET/https` : `${env.HOME}/.aspnet/https`;

const certificateName = "AIbotAdmin.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
  fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
  if (0 !== child_process.spawnSync("dotnet", ["dev-certs", "https", "--export-path", certFilePath, "--format", "Pem", "--no-password"], { stdio: "inherit" }).status) {
    throw new Error("Could not create certificate.");
  }
}

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` : env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(";")[0] : "https://localhost:7052";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/__dynamic_base__/" : undefined,
  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
    "import.meta.env.SITE_TITLE": JSON.stringify("文書管理依頼システム"),
  },
  plugins: [
    react(),
    tailwindcss(),
    dynamicBase({
      // dynamic public path var string, default window.__dynamic_base__
      publicPath: "window.__dynamic_base__",
      // dynamic load resources on index.html, default false. maybe change default true
      transformIndexHtml: true,
      // provide conversion configuration parameters. by 1.1.0
      // transformIndexHtmlConfig: { insertBodyAfter: false }
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  server: {
    proxy: {
      "^/api": {
        target,
        secure: false,
      },
      "^/graphql": {
        target,
        secure: false,
      },
    },
    port: parseInt(env.DEV_SERVER_PORT || "60906"),
    https: {
      key: fs.readFileSync(keyFilePath),
      cert: fs.readFileSync(certFilePath),
    },
  },
});
