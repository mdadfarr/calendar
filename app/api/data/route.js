import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const KEY = "daily_todo_data_v1";

function getRedis() {
  return new Redis({
    url: process.env.REDIS_KV_REST_API_URL,
    token: process.env.REDIS_KV_REST_API_TOKEN,
  });
}

export async function GET() {
  const redis = getRedis();
  const data = (await redis.get(KEY)) || {};
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const redis = getRedis();
  await redis.set(KEY, body);
  return Response.json({ ok: true });
}
