// Prisma Configuration for Questionnaire Database (Separate from Main Database)
// This ensures complete isolation between the main database and questionnaire database
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/questionnaire.schema.prisma",
  migrations: {
    path: "prisma/migrations-questionnaire",
  },
  datasource: {
    url: env("DATABASE_URL_QUESTIONNAIRE"),
  },
});
