import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function upsertEnvVar(envText: string, key: string, value: string) {
  const lineValue = value.includes('\n') ? `"${value.replace(/\n/g, '\\n')}"` : value;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(envText)) return envText.replace(re, `${key}=${lineValue}`);
  const suffix = envText.length && !envText.endsWith('\n') ? '\n' : '';
  return `${envText}${suffix}${key}=${lineValue}\n`;
}

function getEnvPath() {
  // project root .env (gitignored)
  return path.resolve(process.cwd(), '.env');
}

export function firebaseSetupPage(_req: Request, res: Response): void {
  const isDev = config.nodeEnv === 'development';
  if (!isDev) {
    res.status(404).send('Not found');
    return;
  }

  const hasProjectId = Boolean(config.firebase.projectId);
  const hasClientEmail = Boolean(config.firebase.clientEmail);
  const hasPrivateKey = Boolean(config.firebase.privateKey);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Firebase Setup (Backend)</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; color: #0f172a; }
      .card { max-width: 820px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; }
      h1 { margin: 0 0 6px; font-size: 20px; }
      p { margin: 6px 0 14px; color: #334155; }
      .status { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 12px 0 18px; }
      .pill { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
      .ok { color: #166534; background: #f0fdf4; border-color: #bbf7d0; }
      .bad { color: #7f1d1d; background: #fef2f2; border-color: #fecaca; }
      label { display:block; font-weight: 600; margin: 10px 0 6px; }
      input, textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; }
      textarea { min-height: 140px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      button { margin-top: 14px; padding: 10px 14px; border: 0; border-radius: 10px; background: #16a34a; color: white; font-weight: 700; cursor: pointer; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
      .note { font-size: 13px; color: #475569; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Firebase Setup (Backend)</h1>
      <p>Paste Firebase <b>service account</b> values here. This will update your local <code>.env</code> file (gitignored). Restart backend after saving.</p>

      <div class="status">
        <div class="pill ${hasProjectId ? 'ok' : 'bad'}">FIREBASE_PROJECT_ID: ${hasProjectId ? 'SET' : 'MISSING'}</div>
        <div class="pill ${hasClientEmail ? 'ok' : 'bad'}">FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? 'SET' : 'MISSING'}</div>
        <div class="pill ${hasPrivateKey ? 'ok' : 'bad'}">FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? 'SET' : 'MISSING'}</div>
      </div>

      <form method="post" action="/setup/firebase">
        <label>FIREBASE_PROJECT_ID</label>
        <input name="projectId" placeholder="your-firebase-project-id" />

        <label>FIREBASE_CLIENT_EMAIL</label>
        <input name="clientEmail" placeholder="your-service-account@project.iam.gserviceaccount.com" />

        <label>FIREBASE_PRIVATE_KEY</label>
        <textarea name="privateKey" placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"></textarea>

        <button type="submit">Save to .env</button>
      </form>

      <p class="note">
        Note: this page is available only in <b>development</b> mode. For production, set environment variables in your server/deployment.
      </p>
    </div>
  </body>
</html>`;

  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

export function saveFirebaseEnv(req: Request, res: Response): void {
  const isDev = config.nodeEnv === 'development';
  if (!isDev) {
    res.status(404).send('Not found');
    return;
  }

  const projectId = String(req.body?.projectId || '').trim();
  const clientEmail = String(req.body?.clientEmail || '').trim();
  const privateKey = String(req.body?.privateKey || '').trim();

  if (!projectId || !clientEmail || !privateKey) {
    res
      .status(400)
      .send(
        `Missing fields. Got projectId=${escapeHtml(projectId ? 'yes' : 'no')}, clientEmail=${escapeHtml(clientEmail ? 'yes' : 'no')}, privateKey=${escapeHtml(privateKey ? 'yes' : 'no')}`
      );
    return;
  }

  const envPath = getEnvPath();
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  let updated = existing;
  updated = upsertEnvVar(updated, 'FIREBASE_PROJECT_ID', projectId);
  updated = upsertEnvVar(updated, 'FIREBASE_CLIENT_EMAIL', clientEmail);
  updated = upsertEnvVar(updated, 'FIREBASE_PRIVATE_KEY', privateKey);

  fs.writeFileSync(envPath, updated, 'utf8');

  res
    .status(200)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .send(
      `Saved. Restart backend to apply. <a href="/setup/firebase">Back</a>`
    );
}

