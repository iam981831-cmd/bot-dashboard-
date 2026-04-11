import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { encrypt } from "../lib/encryption"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Running seed…")

  // Upsert admin user — safe to run on every startup
  const existingUser = await prisma.user.findFirst()
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "admin123",
      12
    )
    await prisma.user.create({
      data: { passwordHash: hashedPassword },
    })
    console.log("✅ Admin user created")
  } else {
    console.log("✅ Admin user already exists — skipping")
  }

  // Only seed demo bots if the database is empty
  const botCount = await prisma.bot.count()
  if (botCount > 0) {
    console.log(`✅ ${botCount} bots already exist — skipping demo seed`)
    return
  }

  console.log("🤖 Seeding demo bots…")

  const bot1 = await prisma.bot.create({
    data: {
      name: "Telegram Notifier",
      description: "Sends daily digest and alert notifications to the team channel on Telegram.",
      type: "Telegram",
      status: "Active",
      baseUrl: "https://api.telegram.org/bot123456/getMe",
      apiKeyEncrypted: encrypt("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"),
      tags: JSON.stringify(["notifications", "team", "alerts"]),
      notes: "Deployed on VPS at 192.168.1.10. Restart with: pm2 restart telegram-bot",
      pingInterval: 15,
      lastSeenAt: new Date(),
    },
  })

  const bot2 = await prisma.bot.create({
    data: {
      name: "Discord Moderator",
      description: "Auto-moderates the Discord server — handles user reports, spam filtering, and role assignments.",
      type: "Discord",
      status: "Active",
      baseUrl: "https://discord.com/api/v10/gateway",
      apiKeyEncrypted: encrypt("Bot MTExMzc3NDM5NzIxNTgzNzk2.GExampleToken"),
      tags: JSON.stringify(["moderation", "discord", "community"]),
      notes: "Token rotated monthly. Uses slash commands. Check #bot-logs in Discord.",
      pingInterval: 30,
      lastSeenAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  })

  const bot3 = await prisma.bot.create({
    data: {
      name: "WhatsApp Support Bot",
      description: "Handles tier-1 customer support queries via WhatsApp Business API with auto-replies.",
      type: "WhatsApp",
      status: "Maintenance",
      baseUrl: "https://graph.facebook.com/v18.0/me",
      apiKeyEncrypted: encrypt("EAAGm0ExampleMetaToken12345"),
      tags: JSON.stringify(["support", "customer-facing", "whatsapp"]),
      notes: "Scheduled maintenance until end of week. Contact @devops before restarting.",
      lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  })

  await prisma.activityLog.createMany({
    data: [
      { botId: bot1.id, message: "Bot deployed to production VPS", type: "success" },
      { botId: bot1.id, message: "Health check passed — all systems normal", type: "info" },
      { botId: bot1.id, message: "Rate limit hit during broadcast — added 2s delay", type: "warning" },
      { botId: bot2.id, message: "Discord API token refreshed and rotated", type: "info" },
      { botId: bot2.id, message: "New slash command /report added", type: "success" },
      { botId: bot3.id, message: "Scheduled maintenance window started", type: "warning" },
      { botId: bot3.id, message: "Webhook URL updated to new endpoint", type: "info" },
    ],
  })

  await prisma.pingLog.createMany({
    data: [
      { botId: bot1.id, responseTime: 145, statusCode: 200, success: true },
      { botId: bot1.id, responseTime: 132, statusCode: 200, success: true },
      { botId: bot1.id, responseTime: 201, statusCode: 200, success: true },
      { botId: bot2.id, responseTime: 88, statusCode: 200, success: true },
      { botId: bot2.id, responseTime: 99, statusCode: 200, success: true },
      { botId: bot3.id, responseTime: null, statusCode: 503, success: false, error: "Service unavailable" },
    ],
  })

  console.log("✅ Demo bots, activity logs, and ping history created")
  console.log(`🔑 Admin password: ${process.env.ADMIN_PASSWORD || "admin123"}`)
  console.log("🚀 Ready!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
