import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const KEY = "daily_todo_data_v1";

function getRedis() {
  return Redis.fromEnv();
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
