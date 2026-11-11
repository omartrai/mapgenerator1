import { createApiHandler } from "../server/router.js";

/**
 * Single Vercel Function behind every /api/* route (see vercel.json).
 * Uses the Web Request/Response signature on the Node.js runtime.
 */
const handle = createApiHandler({ env: process.env });

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
