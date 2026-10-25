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
  // PWA-Dateien und Kämpferbilder für die Login-Seite ohne Login
  if (url.pathname === "/manifest.webmanifest" || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/kaempfer/")) return next();

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
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink);font:400 14px/1.5 "Space Mono",ui-monospace,monospace;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;background:radial-gradient(60% 50% at 20% 30%,rgba(255,62,138,.22),transparent 70%),radial-gradient(60% 50% at 85% 70%,rgba(59,230,214,.16),transparent 70%);pointer-events:none}
body::after{content:"";position:fixed;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 1px,transparent 1px 3px);pointer-events:none;z-index:5}
canvas{position:fixed;inset:0;width:100%;height:100%;opacity:.35}
.floor{position:fixed;left:-50%;right:-50%;bottom:0;height:34vh;transform:perspective(220px) rotateX(60deg);transform-origin:bottom;background:linear-gradient(rgba(255,62,138,.7) 1px,transparent 1px) 0 0/100% 26px,linear-gradient(90deg,rgba(59,230,214,.5) 1px,transparent 1px) 0 0/46px 100%;opacity:.55;animation:fl 2.6s linear infinite}
@keyframes fl{to{background-position:0 26px,0 0}}
main{position:relative;z-index:2;min-height:100vh;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:90px max(18px,env(safe-area-inset-left)) 24px}
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
.in .eye{flex:none;width:40px;height:40px;padding:0;background:none;box-shadow:none;clip-path:none;color:var(--mu);font-size:16px;letter-spacing:0}
.in .eye[aria-pressed="true"]{color:var(--y)}.in .eye:hover{background:none;color:var(--c)}
@media (max-width:520px){
  main{padding:70px 16px calc(20px + env(safe-area-inset-bottom))}
  .orbw{width:84px;height:84px;margin:-58px auto 4px}.glowf{width:240px;height:44px}
  .term{padding:22px 16px 18px}
  .k .geo{display:none}
  h1{font-size:clamp(52px,17vw,80px);margin-top:8px}
  .t{font-size:13px;letter-spacing:.22em;margin-bottom:12px}
  .lines p{font-size:11.5px;line-height:1.6}
  form{margin-top:14px}
  input{font-size:18px;padding:11px 0}
  button[type=submit]{padding:15px 10px;font-size:12.5px;letter-spacing:.18em}
  .bye,.err{font-size:11px;letter-spacing:.1em;line-height:1.5}
  .ft{flex-direction:column;align-items:center;gap:2px;text-align:center;margin-top:14px}
}
@media (max-height:640px){.orbw{display:none}main{padding-top:24px}h1{font-size:54px}}

.duel{position:relative;z-index:3;display:flex;align-items:flex-end;justify-content:center;margin:0 0 -30px;pointer-events:none}
.fc{margin:0;flex:0 1 44%;max-width:176px;aspect-ratio:4/5;position:relative;filter:drop-shadow(5px 6px 0 #000) drop-shadow(0 0 18px rgba(230,0,18,.35))}
.fc img{position:relative;z-index:1;display:block;width:100%;height:100%;object-fit:cover;clip-path:polygon(3% 0,100% 3%,97% 100%,0 97%)}
.fc::before{content:"";position:absolute;inset:0;background:#fff;clip-path:polygon(3% 0,100% 3%,97% 100%,0 97%);transform:scale(1.05)}
.fc::after{content:"";position:absolute;inset:0;z-index:-1;background:#E60012;clip-path:polygon(3% 0,100% 3%,97% 100%,0 97%)}
.fc.l{transform:rotate(-7deg) translateY(8px);animation:inl 1.1s cubic-bezier(.2,.8,.2,1) both,bob 4.5s 1.2s ease-in-out infinite alternate}
.fc.r{transform:rotate(6deg);animation:inr 1.1s .15s cubic-bezier(.2,.8,.2,1) both,bob 4.5s 1.6s ease-in-out infinite alternate-reverse}
.fc.l::after{transform:translate(-9px,9px) rotate(-3deg)}.fc.r::after{transform:translate(9px,9px) rotate(3deg)}
@keyframes inl{from{opacity:0;transform:translateX(-70%) rotate(-16deg)}to{opacity:1;transform:rotate(-7deg) translateY(8px)}}
@keyframes inr{from{opacity:0;transform:translateX(70%) rotate(15deg)}to{opacity:1;transform:rotate(6deg)}}
@keyframes bob{to{translate:0 -5px}}
.duel .orbw{flex:none;width:76px;height:76px;margin:0 -20px 46px;z-index:4}
.duel .glowf{width:190px;height:40px}
.vs{position:absolute;left:50%;bottom:60px;z-index:5;transform:translateX(-50%) rotate(-8deg);font:400 38px/1 "Black Han Sans",sans-serif;color:var(--y);-webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:3px 3px 0 #000,0 0 18px rgba(252,238,10,.6);animation:vsin .5s .9s cubic-bezier(.3,1.6,.5,1) both}
@keyframes vsin{from{opacity:0;transform:translateX(-50%) rotate(-8deg) scale(2.4)}}
.duel+.term{padding-top:58px}
body.ok .fc.l{animation:outl .6s forwards}body.ok .fc.r{animation:outr .6s forwards}body.ok .vs{animation:outv .4s forwards}
@keyframes outl{to{opacity:0;transform:translateX(-90%) rotate(-20deg)}}@keyframes outr{to{opacity:0;transform:translateX(90%) rotate(20deg)}}@keyframes outv{to{opacity:0;transform:translateX(-50%) scale(2)}}
@media (max-width:520px){main{padding-top:max(24px,env(safe-area-inset-top))}.fc{max-width:150px}.duel .orbw{width:62px;height:62px;margin:0 -18px 40px}.vs{font-size:32px;bottom:50px}.duel .glowf{width:150px}}
@media (max-height:640px){.fc{max-width:112px}.vs{bottom:20px;font-size:28px}.duel{margin-bottom:-22px}.duel .orbw{display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style></head><body>
<canvas id="r" aria-hidden="true"></canvas><div class="floor" aria-hidden="true"></div>
<main><div style="width:min(440px,100%)"><div class="duel" aria-hidden="true"><figure class="fc l"><img src="/kaempfer/kaempfer-christoph.jpg" alt="" width="480" height="600"></figure><div class="orbw"><div class="glowf"></div><div class="orb"></div></div><figure class="fc r"><img src="/kaempfer/kaempfer-michi.jpg" alt="" width="480" height="600"></figure><b class="vs">VS</b></div><section class="term" aria-label="Zugang">
<div class="k">SYS://SEOUL.NOV · <b>SECURE NODE</b><span class="geo"> · 37.57N 126.98E</span></div>
<h1 aria-hidden="true">서울</h1>
<div class="t">SEOUL, NOVEMBER.</div>
<div class="lines" aria-hidden="true"><p>&gt; VERBINDUNG ZU SEOUL.NET HERGESTELLT</p><p>&gt; TEAM: MICHI + CHRISTOPH · <span>2 SPIELER</span></p><p>&gt; IDENTITÄT BESTÄTIGEN <i class="cur"></i></p></div>
<form method="post" action="/__login" onsubmit="document.body.classList.add('ok')">
<label for="pw">ZUGANGSCODE</label>
<div class="in"><span>&gt;</span><input id="pw" name="pw" type="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" required aria-label="Passwort"><button type="button" class="eye" id="eye" aria-label="Code anzeigen" aria-pressed="false">◉</button></div>
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
(function(){const i=document.getElementById("pw"),e=document.getElementById("eye");if(matchMedia("(pointer:fine)").matches)i.focus();
e.addEventListener("click",()=>{const s=i.type==="password";i.type=s?"text":"password";e.setAttribute("aria-pressed",String(s));e.setAttribute("aria-label",s?"Code verbergen":"Code anzeigen");i.focus();});
i.addEventListener("focus",()=>{if(innerWidth<600)setTimeout(()=>i.scrollIntoView({block:"center",behavior:"smooth"}),300);});})();
</script></body></html>`; }
