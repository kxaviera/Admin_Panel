# Admin Dashboard Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Backend API running and accessible
- Admin user created in the database

## Local Development

### 1. Install Dependencies

```bash
cd admin-dashboard
npm install
```

### 2. Configure Environment

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Pikkar Admin
```

### 3. Run Development Server

```bash
npm run dev
```

Access the dashboard at `http://localhost:3001`

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd admin-dashboard
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

4. **Custom Domain** (Optional):
   - Add your domain in Vercel dashboard
   - Update DNS records as instructed

### Option 2: Docker Deployment

1. **Create Dockerfile**:

```dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3001
ENV PORT 3001
CMD ["node", "server.js"]
```

2. **Build and Run**:
```bash
docker build -t pikkar-admin .
docker run -p 3001:3001 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 pikkar-admin
```

### Option 3: VPS/Cloud Server

1. **Build the Application**:
```bash
npm run build
```

2. **Install PM2**:
```bash
npm install -g pm2
```

3. **Create PM2 Ecosystem File** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'pikkar-admin',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.yourdomain.com/api/v1',
      NEXT_PUBLIC_SOCKET_URL: 'https://api.yourdomain.com'
    }
  }]
};
```

4. **Start with PM2**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **Setup Nginx** (Optional):

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 4: Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `.next`
3. **Environment Variables**: Set in Netlify dashboard

## Post-Deployment Checklist

- [ ] Verify API connection
- [ ] Test login functionality
- [ ] Check all dashboard pages load correctly
- [ ] Verify real-time updates work
- [ ] Test data fetching and mutations
- [ ] Confirm responsive design on mobile
- [ ] Setup SSL certificate (HTTPS)
- [ ] Configure CORS on backend for admin domain
- [ ] Test all CRUD operations
- [ ] Monitor error logs

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Pikkar Admin` |
| `NEXT_PUBLIC_APP_VERSION` | App version | `1.0.0` |

## Troubleshooting

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend
- Ensure backend is accessible from admin domain

### Authentication Failures
- Verify admin user exists in database
- Check JWT token configuration
- Ensure cookie/localStorage is not blocked

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

### Performance Issues
- Enable Next.js optimization features
- Configure CDN for static assets
- Implement Redis caching on backend
- Use compression middleware

## Monitoring & Maintenance

1. **Setup Monitoring**:
   - Use Vercel Analytics (if on Vercel)
   - Integrate Sentry for error tracking
   - Setup uptime monitoring

2. **Regular Updates**:
```bash
npm update
npm audit fix
```

3. **Backup Strategy**:
   - Version control with Git
   - Database backups
   - Environment variable backups

## Security Best Practices

- Always use HTTPS in production
- Keep dependencies updated
- Implement rate limiting on API
- Use strong admin passwords
- Enable two-factor authentication
- Regular security audits
- Monitor access logs

## Scaling

For high traffic:
- Use CDN for static assets
- Implement Redis caching
- Database read replicas
- Load balancing with multiple instances
- Consider serverless architecture

## Support

For deployment issues, contact the development team.

