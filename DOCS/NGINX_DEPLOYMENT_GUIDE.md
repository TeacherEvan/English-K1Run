# 🚀 nginx Deployment Guide - Kindergarten Race Game

## 📋 Table of Contents

- [Docker Deployment (Recommended)](#docker-deployment-recommended)
- [Manual nginx Setup](#manual-nginx-setup)
- [Cloud Deployment Options](#cloud-deployment-options)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🐳 Docker Deployment (Recommended)

### Quick Start

```bash
# Production deployment
docker-compose up -d kindergarten-race

# Access at: http://localhost:3000
```

### Development with Hot Reload

```bash
# Development mode
docker-compose --profile dev up kindergarten-race-dev

# Access at: http://localhost:5173
```

### Custom Port Configuration

```bash
# Change port in docker-compose.yml
services:
  kindergarten-race:
    ports:
      - "8080:80"  # Change 3000 to your preferred port
```

## 🔧 Manual nginx Setup

### Step 1: Build Application

```bash
npm run build
# Creates 'dist' folder with production files
```

### Step 2: nginx Installation

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install nginx
```

#### CentOS/RHEL

```bash
sudo yum install nginx
# or for newer versions
sudo dnf install nginx
```

#### Windows (with Chocolatey)

```bash
choco install nginx
```

### Step 3: nginx Configuration

Create `/etc/nginx/sites-available/kindergarten-race`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/kindergarten-race;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/x-font-ttf
        font/opentype
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self';" always;

    # Handle client-side routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Handle API requests (if you add backend later)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security: deny access to sensitive files
    location ~ /\.(ht|git|svn) {
        deny all;
    }

    # Deny access to config files
    location ~ \.(json|md|txt|yaml|yml)$ {
        deny all;
    }
}
```

### Step 4: Deploy Files

```bash
# Copy built files to nginx directory
sudo cp -r dist/* /var/www/kindergarten-race/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/kindergarten-race
sudo chmod -R 755 /var/www/kindergarten-race
```

### Step 5: Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/kindergarten-race /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## ☁️ Cloud Deployment Options

### 1. Netlify (Static Hosting)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

Create `_redirects` file in `dist` folder:

```
/*    /index.html   200
```

### 2. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Create `vercel.json`:

```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

### 3. AWS S3 + CloudFront

```bash
# Install AWS CLI
aws configure

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 4. DigitalOcean App Platform

Create `.do/app.yaml`:

```yaml
name: kindergarten-race
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  build_command: npm run build
  http_port: 80
  instance_count: 1
  instance_size_slug: basic-xxs
  static_sites:
  - name: static-site
    source_dir: /dist
    index_document: index.html
    error_document: index.html
```

## ⚡ Performance Optimization

### 1. Enable HTTP/2

Add to nginx config:

```nginx
listen 443 ssl http2;
listen [::]:443 ssl http2;
```

### 2. Add SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### 3. Optimize Build Size

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false // Disable in production
  }
})
```

### 4. Add Service Worker

Create `public/sw.js`:

```javascript
const CACHE_NAME = 'kindergarten-race-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Add your static assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

## 🔍 Troubleshooting

### Common Issues

#### 1. 404 on Page Refresh

**Problem**: Direct URLs return 404
**Solution**: Ensure `try_files $uri $uri/ /index.html;` is in nginx config

#### 2. Assets Not Loading

**Problem**: CSS/JS files return 404
**Solution**: Check file paths and nginx root directory

#### 3. MIME Type Errors

**Problem**: CSS files served as text/plain
**Solution**: Add to nginx config:

```nginx
location ~* \.css$ {
    add_header Content-Type text/css;
}
```

#### 4. Docker Issues

```bash
# Check container logs
docker logs kindergarten-race-game

# Restart container
docker-compose restart kindergarten-race

# Rebuild image
docker-compose build --no-cache kindergarten-race
```

### Health Checks

#### Test nginx Configuration

```bash
# Test config syntax
sudo nginx -t

# Check nginx status
sudo systemctl status nginx
```

#### Monitor Performance

```bash
# Check nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## 📊 Monitoring & Analytics

### 1. nginx Status Module

Add to nginx config:

```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

### 2. Google Analytics

Add to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🚀 Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "🏗️ Building application..."
npm run build

echo "🐳 Building Docker image..."
docker build -t kindergarten-race-game .

echo "🚀 Deploying with Docker Compose..."
docker-compose up -d kindergarten-race

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://localhost:3000"
```

Make executable and run:

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📝 Notes

- Your current setup is already optimized for production
- The nginx.conf file includes security headers and caching
- Docker configuration handles the entire deployment pipeline
- The build creates optimized assets in the `dist` folder
- Consider using a reverse proxy for multiple applications

## 🔗 Additional Resources

- [nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/)
