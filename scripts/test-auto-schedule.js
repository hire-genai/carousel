/**
 * Test: Auto Schedule — Old Complete Posts Bug
 *
 * Verifies that carousels created BEFORE enabling Auto Schedule
 * are picked up correctly by the next cron cycle.
 *
 * Run: node scripts/test-auto-schedule.js
 * (Make sure DATABASE_URL is set in .env)
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── Same logic as the cron (copy-paste to test in isolation) ─────────────────

const WINDOWS = [
  [8 * 60, 11 * 60],
  [12 * 60, 15 * 60],
  [17 * 60, 20 * 60],
];

function generateSlotTimes(count, now) {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const times = [];
  let dayOffset = 0;
  while (times.length < count) {
    const dayWindows =
      dayOffset === 0
        ? WINDOWS.filter(([, end]) => nowMins < end)
        : [...WINDOWS];
    if (dayWindows.length === 0) { dayOffset++; continue; }
    for (const [start, end] of dayWindows) {
      if (times.length >= count) break;
      const from = dayOffset === 0 ? Math.max(start, nowMins + 5) : start;
      if (from >= end) continue;
      const mins = from + Math.floor(Math.random() * (end - from));
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      times.push(d);
    }
    dayOffset++;
  }
  return times.sort((a, b) => a - b);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// ── Test cases ───────────────────────────────────────────────────────────────

async function testOldCompleteCarouselGetsScheduled() {
  console.log("\n─────────────────────────────────────────────");
  console.log("TEST 1: Old complete carousel picked up after enabling Auto Schedule");
  console.log("─────────────────────────────────────────────");

  const email = `test_auto_${Date.now()}@test.com`;
  let userId;

  try {
    // Setup
    const user = await prisma.user.create({ data: { email, name: "Test User" } });
    userId = user.id;
    console.log(`  Created user: ${userId}`);

    // Step 1: Create a complete carousel (BEFORE enabling auto-schedule)
    const carousel = await prisma.carousel.create({
      data: {
        userId,
        title: "Old Complete Carousel",
        slides: JSON.stringify([{ headline: "Test", body: "Test", bullets: [] }]),
        status: "complete",
      },
    });
    console.log(`  Created complete carousel: ${carousel.id}`);

    // Step 2: Enable auto-schedule (AFTER the carousel was created)
    const config = await prisma.autoScheduleConfig.create({
      data: { userId, enabled: true, postsPerDay: 2 },
    });
    console.log(`  Enabled auto-schedule: postsPerDay=${config.postsPerDay}`);

    // Step 3: Run the eligibility query (exact copy from cron)
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [todayCarouselSlots, todayTextSlots] = await Promise.all([
      prisma.scheduledPost.count({
        where: {
          userId,
          isAutoScheduled: true,
          status: { in: ["scheduled", "posted"] },
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.textPost.count({
        where: {
          userId,
          isAutoScheduled: true,
          status: { in: ["scheduled", "posted"] },
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    const remaining = config.postsPerDay - todayCarouselSlots - todayTextSlots;
    console.log(`  todaySlots=${todayCarouselSlots + todayTextSlots} remaining=${remaining}`);

    assert(remaining > 0, `remaining=${remaining} > 0 (slots available)`);

    const eligibleCarousels = await prisma.carousel.findMany({
      where: {
        userId,
        status: "complete",
        scheduledPosts: {
          none: { isAutoScheduled: true, status: { in: ["scheduled", "posted"] } },
        },
      },
    });

    assert(
      eligibleCarousels.length === 1,
      `Query returns 1 eligible carousel (found ${eligibleCarousels.length})`
    );
    assert(
      eligibleCarousels[0]?.id === carousel.id,
      `Correct carousel found`
    );

    // Step 4: Simulate scheduling (with transaction fix)
    if (eligibleCarousels.length > 0) {
      const times = generateSlotTimes(1, now);
      await prisma.$transaction([
        prisma.scheduledPost.create({
          data: {
            carouselId: carousel.id,
            userId,
            scheduledAt: times[0],
            isAutoScheduled: true,
          },
        }),
        prisma.carousel.update({
          where: { id: carousel.id },
          data: { status: "scheduled" },
        }),
      ]);
      console.log(`  Scheduled for: ${times[0].toISOString()}`);
    }

    // Step 5: Verify outcome
    const scheduledPost = await prisma.scheduledPost.findFirst({
      where: { carouselId: carousel.id, isAutoScheduled: true },
    });
    const updatedCarousel = await prisma.carousel.findUnique({
      where: { id: carousel.id },
    });

    assert(!!scheduledPost, `ScheduledPost was created`);
    assert(scheduledPost?.status === "scheduled", `ScheduledPost status=scheduled`);
    assert(updatedCarousel?.status === "scheduled", `Carousel status updated to scheduled`);

    // Step 6: Verify no duplicate scheduling on next cron cycle
    const eligibleAfter = await prisma.carousel.findMany({
      where: {
        userId,
        status: "complete",
        scheduledPosts: {
          none: { isAutoScheduled: true, status: { in: ["scheduled", "posted"] } },
        },
      },
    });
    assert(
      eligibleAfter.length === 0,
      `No duplicate scheduling — carousel no longer eligible (found ${eligibleAfter.length})`
    );

  } finally {
    // Cleanup
    if (userId) {
      await prisma.scheduledPost.deleteMany({ where: { userId } });
      await prisma.carousel.deleteMany({ where: { userId } });
      await prisma.autoScheduleConfig.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  }
}

async function testFailedSlotsDoNotBlockQuota() {
  console.log("\n─────────────────────────────────────────────");
  console.log("TEST 2: Failed auto-scheduled posts do NOT eat daily quota");
  console.log("─────────────────────────────────────────────");

  const email = `test_auto2_${Date.now()}@test.com`;
  let userId;

  try {
    const user = await prisma.user.create({ data: { email, name: "Test User 2" } });
    userId = user.id;

    // Create 2 complete carousels
    const [c1, c2] = await Promise.all([
      prisma.carousel.create({
        data: {
          userId,
          title: "Carousel 1",
          slides: JSON.stringify([]),
          status: "complete",
        },
      }),
      prisma.carousel.create({
        data: {
          userId,
          title: "Carousel 2",
          slides: JSON.stringify([]),
          status: "complete",
        },
      }),
    ]);

    // Simulate: a FAILED auto-scheduled post for c1 (old bug: occupied the slot)
    const todaySlot = new Date();
    todaySlot.setHours(14, 0, 0, 0); // 2 PM today
    await prisma.scheduledPost.create({
      data: {
        carouselId: c1.id,
        userId,
        scheduledAt: todaySlot,
        isAutoScheduled: true,
        status: "failed",
      },
    });
    // c1's carousel status was (wrongly) not updated due to old bug — stays "complete"
    // This was the stuck state

    const config = await prisma.autoScheduleConfig.create({
      data: { userId, enabled: true, postsPerDay: 1 },
    });

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // OLD broken count (no status filter): would count the failed post → remaining=0
    const oldBrokenCount = await prisma.scheduledPost.count({
      where: {
        userId,
        isAutoScheduled: true,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // NEW fixed count (with status filter): failed post is excluded → remaining=1
    const newFixedCount = await prisma.scheduledPost.count({
      where: {
        userId,
        isAutoScheduled: true,
        status: { in: ["scheduled", "posted"] },
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const oldRemaining = config.postsPerDay - oldBrokenCount;
    const newRemaining = config.postsPerDay - newFixedCount;

    assert(
      oldBrokenCount === 1,
      `Old broken count includes failed post (got ${oldBrokenCount})`
    );
    assert(
      oldRemaining === 0,
      `Old broken remaining=0 (bug: would schedule nothing) (got ${oldRemaining})`
    );
    assert(
      newFixedCount === 0,
      `New fixed count excludes failed post (got ${newFixedCount})`
    );
    assert(
      newRemaining === 1,
      `New fixed remaining=1 (fix: allows scheduling) (got ${newRemaining})`
    );

    // c1 should still be eligible (failed post does not block, carousel still "complete")
    const eligible = await prisma.carousel.findMany({
      where: {
        userId,
        status: "complete",
        scheduledPosts: {
          none: { isAutoScheduled: true, status: { in: ["scheduled", "posted"] } },
        },
      },
    });
    assert(
      eligible.length === 2,
      `Both carousels eligible despite c1 having a failed ScheduledPost (found ${eligible.length})`
    );

  } finally {
    if (userId) {
      await prisma.scheduledPost.deleteMany({ where: { userId } });
      await prisma.carousel.deleteMany({ where: { userId } });
      await prisma.autoScheduleConfig.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  }
}

async function testTransactionAtomicity() {
  console.log("\n─────────────────────────────────────────────");
  console.log("TEST 3: Transaction prevents stuck carousel on partial failure");
  console.log("─────────────────────────────────────────────");

  const email = `test_auto3_${Date.now()}@test.com`;
  let userId;

  try {
    const user = await prisma.user.create({ data: { email, name: "Test User 3" } });
    userId = user.id;

    const carousel = await prisma.carousel.create({
      data: {
        userId,
        title: "Transaction Test Carousel",
        slides: JSON.stringify([]),
        status: "complete",
      },
    });

    const scheduledAt = new Date(Date.now() + 3600000);

    // Simulate successful transaction
    await prisma.$transaction([
      prisma.scheduledPost.create({
        data: { carouselId: carousel.id, userId, scheduledAt, isAutoScheduled: true },
      }),
      prisma.carousel.update({
        where: { id: carousel.id },
        data: { status: "scheduled" },
      }),
    ]);

    const sp = await prisma.scheduledPost.findFirst({ where: { carouselId: carousel.id } });
    const c = await prisma.carousel.findUnique({ where: { id: carousel.id } });

    assert(!!sp, `ScheduledPost created in transaction`);
    assert(c?.status === "scheduled", `Carousel status=scheduled (was: ${c?.status})`);

    // Simulate failed transaction — using an invalid carouselId
    try {
      await prisma.$transaction([
        prisma.scheduledPost.create({
          data: {
            carouselId: "nonexistent-id-xyz",
            userId,
            scheduledAt: new Date(Date.now() + 7200000),
            isAutoScheduled: true,
          },
        }),
        prisma.carousel.update({
          where: { id: carousel.id },
          data: { status: "complete" }, // should not happen
        }),
      ]);
    } catch {
      // expected failure
    }

    // Carousel should still be "scheduled" (transaction was rolled back)
    const cAfterFailedTx = await prisma.carousel.findUnique({ where: { id: carousel.id } });
    assert(
      cAfterFailedTx?.status === "scheduled",
      `Carousel status unchanged after failed transaction (status=${cAfterFailedTx?.status})`
    );

    const spCount = await prisma.scheduledPost.count({ where: { carouselId: carousel.id } });
    assert(spCount === 1, `Only 1 ScheduledPost exists (no orphans from failed tx) (found ${spCount})`);

  } finally {
    if (userId) {
      await prisma.scheduledPost.deleteMany({ where: { userId } });
      await prisma.carousel.deleteMany({ where: { userId } });
      await prisma.autoScheduleConfig.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  }
}

// ── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Auto Schedule Bug Test Suite ===");
  console.log(`DB: ${process.env.DATABASE_URL}`);

  try {
    await testOldCompleteCarouselGetsScheduled();
    await testFailedSlotsDoNotBlockQuota();
    await testTransactionAtomicity();
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("❌ Some tests FAILED — bugs present");
    process.exit(1);
  } else {
    console.log("✅ All tests PASSED — auto schedule working correctly");
  }
}

main().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
