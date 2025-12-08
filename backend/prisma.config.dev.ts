import path from "path";
import type { PrismaConfig } from "prisma/config";
import dotenv from 'dotenv';
dotenv.config();

export default {
    schema: path.join("prisma", "schema.prisma"),
    migrations: {
        path: path.join("prisma", "migrations"),
        seed: "tsx ./prisma/seed.ts"
    }
} satisfies PrismaConfig;
