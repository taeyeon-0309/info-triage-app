import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SourcePlatform } from "@prisma/client";

loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for seed");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_TEST_USER_EMAIL ?? "test-user@example.com";

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Test User" },
    create: {
      email,
      name: "Test User",
      preference: {
        create: {
          readingGoal: "跟踪 AI 产品和增长相关高价值信息",
          preferredLanguage: "zh-CN",
          maxDailyMustRead: 5,
          maxDailySkim: 10,
        },
      },
    },
  });

  await prisma.topic.upsert({
    where: { userId_name: { userId: user.id, name: "AI 产品" } },
    update: { isActive: true, priority: 90 },
    create: {
      userId: user.id,
      name: "AI 产品",
      description: "关注模型能力、应用场景与产品化",
      priority: 90,
      isActive: true,
    },
  });

  await prisma.source.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: "Manual Submission",
      },
    },
    update: {},
    create: {
      userId: user.id,
      name: "Manual Submission",
      platform: SourcePlatform.MANUAL,
      qualityScore: 50,
      isBlocked: false,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
