import { next } from "@vercel/functions";
export const config = { matcher: "/:path*" };

const COOKIE = "sn_auth";
async function tokenFor(pw) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("seoul-november:" + pw));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function getCookie(req, name) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : "";
}

export default async function middleware(request) {
  const pw = process.env.SITE_PASSWORD || "";
  if (!pw) return new Response("SITE_PASSWORD fehlt", { status: 500 });
  const token = await tokenFor(pw);
  const url = new URL(request.url);

  // login form submit
  if (url.pathname === "/__login" && request.method === "POST") {
    let given = "";
    try { const f = await request.formData(); given = String(f.get("pw") || ""); } catch (e) {}
    if (given === pw) {
      return new Response(null, { status: 303, headers: {
        "Location": "/",
        "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 120}`
      }});
    }
    return new Response(null, { status: 303, headers: { "Location": "/?zugang=verweigert" } });
  }

  if (url.pathname === "/__logout") {
    return new Response(null, { status: 303, headers: { "Location": "/?abgemeldet=1", "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`, "Cache-Control": "no-store" } });
  }
  if (getCookie(request, COOKIE) === token) return next();


  if (url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ error: "Nicht eingeloggt" }), { status: 401, headers: { "Content-Type": "application/json" } });
  return new Response(page(url.searchParams.has("zugang"), url.searchParams.has("abgemeldet")), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function page(err, out) { return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>seoul, november · Zugang</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Space+Mono:wght@400;700&display=swap">
<style>
:root{--n:#FF3E8A;--c:#3BE6D6;--y:#FCEE0A;--bg:#0a0818;--ink:#F4F1FF;--mu:#ABA5CF}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font:400 14px/1.5 "Space Mono",ui-monospace,monospace;overflow:hidden}
body::before{content:"";position:fixed;inset:0;background:radial-gradient(60% 50% at 20% 30%,rgba(255,62,138,.22),transparent 70%),radial-gradient(60% 50% at 85% 70%,rgba(59,230,214,.16),transparent 70%);pointer-events:none}
body::after{content:"";position:fixed;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 1px,transparent 1px 3px);pointer-events:none;z-index:5}
canvas{position:fixed;inset:0;width:100%;height:100%;opacity:.35}
.floor{position:fixed;left:-50%;right:-50%;bottom:0;height:34vh;transform:perspective(220px) rotateX(60deg);transform-origin:bottom;background:linear-gradient(rgba(255,62,138,.7) 1px,transparent 1px) 0 0/100% 26px,linear-gradient(90deg,rgba(59,230,214,.5) 1px,transparent 1px) 0 0/46px 100%;opacity:.55;animation:fl 2.6s linear infinite}
@keyframes fl{to{background-position:0 26px,0 0}}
main{position:relative;z-index:2;min-height:100%;display:flex;align-items:center;justify-content:center;padding:90px max(18px,env(safe-area-inset-left)) 24px}
.term{width:min(440px,100%);padding:26px 22px 22px;background:rgba(17,15,39,.82);border:1px solid rgba(59,230,214,.5);clip-path:polygon(0 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%);box-shadow:0 0 40px rgba(59,230,214,.15),inset 0 0 30px rgba(59,230,214,.06);backdrop-filter:blur(6px);position:relative}
.term::before{content:"";position:absolute;inset:8px;pointer-events:none;background:linear-gradient(var(--y),var(--y)) left top/22px 2px no-repeat,linear-gradient(var(--y),var(--y)) left top/2px 22px no-repeat,linear-gradient(var(--n),var(--n)) right bottom/22px 2px no-repeat,linear-gradient(var(--n),var(--n)) right bottom/2px 22px no-repeat}
.k{font-size:10px;letter-spacing:.2em;color:var(--mu)}
.k b{color:var(--c);font-weight:400}
h1{margin:10px 0 2px;font:400 clamp(58px,18vw,92px)/.9 "Black Han Sans",sans-serif;color:transparent;-webkit-text-stroke:2px var(--n);text-shadow:0 0 18px rgba(255,62,138,.6),0 0 46px rgba(255,62,138,.3);position:relative;animation:fk 5s infinite}
h1::before,h1::after{content:"서울";position:absolute;inset:0;-webkit-text-stroke:0;opacity:0}
h1::before{color:var(--c);animation:g1 4s infinite steps(1)}h1::after{color:var(--n);animation:g1 4s .1s infinite steps(1)}
@keyframes g1{0%,91%,100%{opacity:0;transform:none}92%{opacity:.8;transform:translate(-5px);clip-path:inset(15% 0 55% 0)}94%{opacity:.8;transform:translate(5px);clip-path:inset(60% 0 10% 0)}96%{opacity:0}}
@keyframes fk{0%,94%,100%{opacity:1}95%{opacity:.5}96%{opacity:1}}
.t{font:700 15px "Space Mono";letter-spacing:.26em;color:var(--y);text-shadow:0 0 10px rgba(252,238,10,.6);margin-bottom:18px}
.lines p{margin:0;color:var(--c);font-size:12px;opacity:0;animation:ln .01s forwards}
.lines p:nth-child(1){animation-delay:.3s}.lines p:nth-child(2){animation-delay:.8s}.lines p:nth-child(3){animation-delay:1.3s}
@keyframes ln{to{opacity:1}}
.lines p span{color:var(--n)}
form{margin-top:18px;display:flex;flex-direction:column;gap:10px}
label{font-size:10px;letter-spacing:.2em;color:var(--mu)}
.in{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,62,138,.6);background:rgba(10,8,24,.8);padding:0 12px;box-shadow:inset 0 0 18px rgba(255,62,138,.12)}
.in span{color:var(--n);font-weight:700}
input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--ink);font:700 20px "Space Mono";letter-spacing:.3em;padding:12px 0;caret-color:var(--y)}
.in:focus-within{border-color:var(--y);box-shadow:0 0 0 1px var(--y),0 0 22px rgba(252,238,10,.3)}
button{cursor:pointer;border:0;padding:14px;font:700 13px "Space Mono";letter-spacing:.22em;color:#110F27;background:var(--y);clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%);box-shadow:0 0 22px rgba(252,238,10,.45);transition:transform .1s}
button:hover{background:var(--c)}button:active{transform:scale(.98)}
.err{display:${err ? "block" : "none"};margin-top:12px;padding:8px 10px;border:1px solid #ff2a4a;color:#ff5470;font-size:12px;letter-spacing:.14em;background:rgba(255,42,74,.08);animation:sh .45s 1}
@keyframes sh{0%,100%{transform:none}20%{transform:translateX(-8px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}
.bye{margin-top:12px;padding:8px 10px;border:1px solid var(--c);color:var(--c);font-size:12px;letter-spacing:.14em;background:rgba(59,230,214,.08)}
.ft{margin-top:16px;font-size:9px;letter-spacing:.18em;color:rgba(171,165,207,.55);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.cur{display:inline-block;width:8px;height:14px;background:var(--c);vertical-align:-2px;animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}
body.ok .term{animation:okk .7s forwards}@keyframes okk{0%{filter:none}30%{filter:brightness(2) hue-rotate(90deg)}100%{transform:scale(1.04);opacity:0;filter:blur(4px)}}

.orbw{position:relative;width:120px;height:120px;margin:-86px auto 6px;z-index:3}
.orb{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 35% 30%,#e9fbff 0 4%,rgba(159,243,255,.9) 6%,transparent 18%),radial-gradient(circle at 50% 55%,#2f8cff,#1438a8 60%,#0a1550 100%);box-shadow:0 0 30px #3BB8FF,0 0 80px rgba(59,184,255,.6),inset 0 -12px 30px rgba(0,0,40,.6),inset 0 8px 24px rgba(159,243,255,.35)}
.orb::before{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg,transparent,rgba(159,243,255,.35),transparent 30%,rgba(90,140,255,.4) 55%,transparent 70%,rgba(159,243,255,.3));filter:blur(8px);mix-blend-mode:screen;animation:sw 9s linear infinite}
.orb::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 30% 26%,rgba(255,255,255,.95) 0 3%,transparent 9%)}
@keyframes sw{to{transform:rotate(360deg)}}
.glowf{position:absolute;left:50%;top:84%;width:340px;height:60px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(59,184,255,.9),transparent) center 50%/100% 2px no-repeat,linear-gradient(transparent,rgba(59,184,255,.9),transparent) 50% center/2px 100% no-repeat,radial-gradient(closest-side,rgba(59,184,255,.45),transparent);filter:blur(.5px) drop-shadow(0 0 8px #3BB8FF);pointer-events:none;animation:pl 3.6s ease-in-out infinite}
@keyframes pl{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style></head><body>
<canvas id="r" aria-hidden="true"></canvas><div class="floor" aria-hidden="true"></div>
<main><div style="width:min(440px,100%)"><div class="orbw" aria-hidden="true"><div class="glowf"></div><div class="orb"></div></div><section class="term" aria-label="Zugang">
<div class="k">SYS://SEOUL.NOV · <b>SECURE NODE</b> · 37.57N 126.98E</div>
<h1 aria-hidden="true">서울</h1>
<div class="t">SEOUL, NOVEMBER.</div>
<div class="lines" aria-hidden="true"><p>&gt; VERBINDUNG ZU SEOUL.NET HERGESTELLT</p><p>&gt; TEAM: MICHI + CHRISTOPH · <span>2 SPIELER</span></p><p>&gt; IDENTITÄT BESTÄTIGEN <i class="cur"></i></p></div>
<form method="post" action="/__login" onsubmit="document.body.classList.add('ok')">
<label for="pw">ZUGANGSCODE</label>
<div class="in"><span>&gt;</span><input id="pw" name="pw" type="password" autocomplete="current-password" autofocus required aria-label="Passwort"></div>
<button type="submit">ZUGANG ANFORDERN ▸</button>
</form>
<div class="bye" role="status" style="display:${out ? "block" : "none"}">⏻ ABGEMELDET · SESSION BEENDET. BIS BALD, CHOOM.</div>
<div class="err" role="alert">✕ ZUGANG VERWEIGERT · CODE FALSCH. NOCHMAL, CHOOM.</div>
<div class="ft"><span>WAKE UP, SAMURAI.</span><span>BUILT, NOT TALKED ABOUT.</span></div>
</section></div></main>
<script>
(function(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const c=document.getElementById("r"),g=c.getContext("2d");let W,H,cols,dr;const ch="서울종로을지로福岡アイウエオカキクケコ0110".split("");
function s(){W=c.width=innerWidth;H=c.height=innerHeight;cols=Math.ceil(W/18);dr=Array.from({length:cols},()=>Math.random()*-40)}s();addEventListener("resize",s);
let l=0;(function f(t){requestAnimationFrame(f);if(t-l<90)return;l=t;g.fillStyle="rgba(10,8,24,.18)";g.fillRect(0,0,W,H);g.font="15px 'Black Han Sans',sans-serif";
for(let i=0;i<cols;i++){const y=dr[i]*18;g.fillStyle=i%5?"rgba(255,62,138,.55)":"rgba(59,230,214,.7)";g.fillText(ch[(Math.random()*ch.length)|0],i*18,y);if(y>H&&Math.random()>.97)dr[i]=Math.random()*-10;dr[i]+=.4}})(0);})();
if(location.search)history.replaceState(null,"","/");
</script></body></html>`; }
