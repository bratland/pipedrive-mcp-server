import type { VercelRequest, VercelResponse } from "@vercel/node";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://pipedrive-mcp-five.vercel.app";

const landingPage = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pipedrive MCP Server</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem}
.card{background:#171717;border:1px solid #262626;border-radius:12px;padding:2.5rem;max-width:540px;width:100%}
h1{font-size:1.25rem;font-weight:600;margin-bottom:.25rem}
.sub{color:#a3a3a3;font-size:.875rem;margin-bottom:2rem}
label{display:block;font-size:.8125rem;font-weight:500;color:#a3a3a3;margin-bottom:.375rem}
input{width:100%;padding:.625rem .75rem;background:#0a0a0a;border:1px solid #333;border-radius:8px;color:#e5e5e5;font-size:.875rem;font-family:ui-monospace,monospace;outline:none;transition:border-color .15s}
input:focus{border-color:#3b82f6}
button{width:100%;padding:.625rem;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;margin-top:1rem;transition:background .15s}
button:hover{background:#2563eb}
.output{display:none;margin-top:1.5rem}
.output.show{display:block}
.field{margin-bottom:1rem}
.field-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:.375rem}
.copy{background:none;border:none;color:#3b82f6;font-size:.75rem;cursor:pointer;padding:0;margin:0;width:auto;font-weight:400}
.copy:hover{color:#60a5fa;background:none}
.copy.done{color:#22c55e}
pre{background:#0a0a0a;border:1px solid #262626;border-radius:8px;padding:.75rem;font-size:.8125rem;font-family:ui-monospace,monospace;overflow-x:auto;white-space:pre;line-height:1.5;color:#d4d4d4}
.tag{display:inline-block;background:#1e3a5f;color:#93c5fd;font-size:.6875rem;font-weight:500;padding:.125rem .5rem;border-radius:99px;margin-left:.5rem}
.info{color:#737373;font-size:.75rem;margin-top:1.5rem;line-height:1.5}
</style>
</head>
<body>
<div class="card">
  <h1>Pipedrive MCP Server <span class="tag">187 tools</span></h1>
  <p class="sub">Klistra in din Pipedrive API-token for att generera en personlig MCP-anslutnings-URL.</p>
  <div>
    <label for="key">Din Pipedrive API-token</label>
    <input type="password" id="key" placeholder="Hamta fran Pipedrive > Settings > Personal preferences > API" autocomplete="off">
  </div>
  <button onclick="generate()">Generera URL</button>
  <div class="output" id="output">
    <div class="field">
      <div class="field-label">
        <label>MCP URL</label>
        <button class="copy" onclick="copyText('url-val',this)">Kopiera</button>
      </div>
      <pre id="url-val"></pre>
    </div>
    <div class="field">
      <div class="field-label">
        <label>Claude Desktop / Code config</label>
        <button class="copy" onclick="copyText('config-val',this)">Kopiera</button>
      </div>
      <pre id="config-val"></pre>
    </div>
  </div>
  <p class="info">Din API-token bakas in i URL:en. Dela aldrig URL:en med andra - den ger tillgang till ditt Pipedrive-konto.</p>
</div>
<script>
const BASE="${baseUrl}";
function generate(){
  const k=document.getElementById("key").value.trim();
  if(!k)return;
  const url=BASE+"/api/mcp/"+encodeURIComponent(k);
  document.getElementById("url-val").textContent=url;
  document.getElementById("config-val").textContent=JSON.stringify({"mcpServers":{"pipedrive":{"type":"streamable-http","url":url}}},null,2);
  document.getElementById("output").classList.add("show");
}
function copyText(id,btn){
  navigator.clipboard.writeText(document.getElementById(id).textContent);
  btn.textContent="Kopierad!";btn.classList.add("done");
  setTimeout(()=>{btn.textContent="Kopiera";btn.classList.remove("done")},1500);
}
document.getElementById("key").addEventListener("keydown",e=>{if(e.key==="Enter")generate()});
</script>
</body>
</html>`;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(landingPage);
}
