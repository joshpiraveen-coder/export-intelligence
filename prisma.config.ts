import { defineConfig, env } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
