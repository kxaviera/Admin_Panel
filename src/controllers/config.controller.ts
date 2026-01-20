import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

function upsertEnvVar(envText: string, key: string, value: string) {
  const lineValue = value.includes('\n') ? `"${value.replace(/\n/g, '\\n')}"` : value;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(envText)) return envText.replace(re, `${key}=${lineValue}`);
  const suffix = envText.length && !envText.endsWith('\n') ? '\n' : '';
  return `${envText}${suffix}${key}=${lineValue}\n`;
}

function getEnvPath() {
  return path.resolve(process.cwd(), '.env');
}

export const getFirebaseConfigStatus = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      nodeEnv: config.nodeEnv,
      firebase: {
        projectIdSet: Boolean(config.firebase.projectId),
        clientEmailSet: Boolean(config.firebase.clientEmail),
        privateKeySet: Boolean(config.firebase.privateKey),
      },
    },
  });
});

export const updateFirebaseConfig = asyncHandler(async (req: Request, res: Response) => {
  if (config.nodeEnv !== 'development') {
    throw new AppError('Firebase configuration update is only allowed in development', 403);
  }

  const projectId = String(req.body?.projectId || '').trim();
  const clientEmail = String(req.body?.clientEmail || '').trim();
  const privateKey = String(req.body?.privateKey || '').trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new AppError('projectId, clientEmail, and privateKey are required', 400);
  }

  const envPath = getEnvPath();
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  let updated = existing;
  updated = upsertEnvVar(updated, 'FIREBASE_PROJECT_ID', projectId);
  updated = upsertEnvVar(updated, 'FIREBASE_CLIENT_EMAIL', clientEmail);
  updated = upsertEnvVar(updated, 'FIREBASE_PRIVATE_KEY', privateKey);

  fs.writeFileSync(envPath, updated, 'utf8');

  res.status(200).json({
    status: 'success',
    message: 'Firebase env saved to .env. Restart backend to apply.',
  });
});

