export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function corsHeaders(origin = "*") {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-sayit-device, x-sayit-email",
    "access-control-max-age": "86400"
  };
}

export function options(origin = "*") {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}
