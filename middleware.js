import { next } from "@vercel/functions";
export const config = { matcher: "/:path*" };
export default function middleware(request) {
  const pw = process.env.SITE_PASSWORD || "";
  const h = request.headers.get("authorization") || "";
  if (h.startsWith("Basic ")) {
    try {
      const [, pass] = atob(h.slice(6)).split(/:(.*)/s);
      if (pw && pass === pw) return next();
    } catch (e) {}
  }
  return new Response("Bitte einloggen. Benutzername egal, Passwort wie besprochen.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="seoul, november", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" }
  });
}
