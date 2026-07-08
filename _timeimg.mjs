import OpenAI from "openai";
import fs from "node:fs";
for (const line of fs.readFileSync(".env","utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); }
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const prompt = "A moody dark-fantasy portrait of a gaunt monk in grey robes, ringing a cracked bell at night, gothic ruined cathedral, painterly, dramatic lighting.";
async function run(label, params) {
  const t0 = Date.now();
  try {
    const res = await client.images.generate({ model: "gpt-image-2", prompt, size: "1024x1024", quality: "medium", ...params });
    const secs = ((Date.now()-t0)/1000).toFixed(1);
    console.log(`${label}: OK in ${secs}s | bytes=${(res.data?.[0]?.b64_json||"").length}`);
  } catch (e) {
    console.log(`${label}: ERROR after ${((Date.now()-t0)/1000).toFixed(1)}s: ${e.message}`);
  }
}
await run("gpt-image-2 medium + priority", { service_tier: "priority" });
await run("gpt-image-2 medium (no tier)", {});
