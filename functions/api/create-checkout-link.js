import { corsHeaders, json, options } from "../_lib/response.js";
import { createHostedCheckoutSession, hasStripeBillingConfig } from "../_lib/stripe.js";

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

  try {
    if (!hasStripeBillingConfig(env)) {
      return json(
        {
          ok: false,
          error: "SayIt! Pro checkout is not configured in this environment yet."
        },
        {
          status: 503,
          headers: corsHeaders()
        }
      );
    }

    const session = await createHostedCheckoutSession(env, payload);
    return json(
      {
        ok: true,
        ...session
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to create checkout link."
      },
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}
