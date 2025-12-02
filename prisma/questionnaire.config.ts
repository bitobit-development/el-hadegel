// Prisma config for questionnaire database
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "questionnaire.schema.prisma",
  migrations: {
    path: "questionnaire-migrations",
  },
  datasource: {
    url: env("DATABASE_URL_QUESTIONNAIRE"),
  },
});
