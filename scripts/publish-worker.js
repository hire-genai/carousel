const http = require("http");

const LOCALHOST = "http://localhost:3000";
const POLL_INTERVAL = 30 * 1000; // 30 seconds

let isRunning = false;
let cycleCount = 0;

async function callCron() {
  if (isRunning) return;
  isRunning = true;
  cycleCount++;

  try {
    const response = await new Promise((resolve, reject) => {
      const url = new URL(LOCALHOST + "/api/cron/publish-scheduled");
      const req = http.request(
        url,
        { method: "POST" },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on("error", reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error("Request timeout")); });
      req.end();
    });

    const { status, body } = response;
    const time = new Date().toLocaleTimeString();

    if (status !== 200 || body.error) {
      console.error(`[${time}] #${cycleCount} Cron error (HTTP ${status}):`, body.error || body);
      return;
    }

    const parts = [];
    if (body.total > 0) parts.push(`published=${body.published} failed=${body.failed} total=${body.total}`);
    if (body.autoScheduled > 0) parts.push(`autoScheduled=${body.autoScheduled}`);

    if (parts.length > 0) {
      console.log(`[${time}] #${cycleCount} ${parts.join(" | ")}`);
    } else {
      console.log(`[${time}] #${cycleCount} idle`);
    }
  } catch (e) {
    const time = new Date().toLocaleTimeString();
    console.error(`[${time}] #${cycleCount} Connection error: ${e.message}`);
    console.error(`  Make sure 'npm run dev' is running on localhost:3000`);
  } finally {
    isRunning = false;
  }
}

console.log(`🚀 Publish worker started. Polling every ${POLL_INTERVAL / 1000}s...`);
console.log(`   Server: ${LOCALHOST}`);
console.log(`   Tip: Run 'npm run dev' in another terminal if not already running\n`);

setInterval(callCron, POLL_INTERVAL);
callCron(); // Run immediately on start
