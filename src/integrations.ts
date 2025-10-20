import axios from "axios";

const env = process.env;

async function safePost(url: string, payload: any, label: string) {
  try {
    await axios.post(url, payload, { timeout: 4000 });
  } catch (err) {
    console.error(`⚠️ ${label} webhook failed:`, err.message);
  }
}

export async function sendSlackNotification(email) {
  if (!env.SLACK_WEBHOOK_URL) return;
  const message = {
    text: `📩 *New Interested Email*\n• *Subject:* ${email.subject}\n• *From:* ${email.from}\n• *Date:* ${email.date || "Unknown"}`
  };
  await safePost(env.SLACK_WEBHOOK_URL, message, "Slack");
}

export async function sendGenericWebhook(email) {
  if (!env.WEBHOOK_SITE_URL) return;
  const payload = {
    event: "InterestedLead",
    timestamp: new Date().toISOString(),
    data: email
  };
  await safePost(env.WEBHOOK_SITE_URL, payload, "Generic");
}
