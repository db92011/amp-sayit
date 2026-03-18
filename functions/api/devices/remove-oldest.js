import { corsHeaders, json, options } from "../../_lib/response.js";
import { removeOldestSeat } from "../../_lib/sayit-plan.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost({ request, env }) {
  let payload = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const email = normalizeEmail(payload?.email || request.headers.get("x-sayit-email"));
  if (!email) {
    return json(
      {
        ok: false,
        message: "Email is required."
      },
      {
        status: 400,
        headers: corsHeaders()
      }
    );
  }

  try {
    const result = await removeOldestSeat(env?.SAYIT_DB, email);
    return json(result, {
      status: result.ok ? 200 : 400,
      headers: corsHeaders()
    });
  } catch (error) {
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to remove oldest device."
      },
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}
