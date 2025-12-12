# 🚀 School SAS - Production Deployment Guide

## 📋 Overview

This guide covers deploying School SAS to production on various cloud platforms. The system consists of:
- **Frontend:** Next.js application (port 3000)
- **Backend Services:** Node.js microservices (ports 3002, 3005, 4000, 5002)
- **Database:** MySQL 8.0
- **Vector DB:** Qdrant (for AI features)
- **Cache:** Redis (optional)

---

## 🎯 Deployment Architecture Options

### **Option 1: Full Cloud (Recommended)**
- Frontend: Vercel
- Backend Services: Railway/Render
- Database: PlanetScale/AWS RDS
- Vector DB: Qdrant Cloud
- Best for: Production with high traffic

### **Option 2: Hybrid**
- Frontend: Vercel
- Backend + DB: Single VPS (DigitalOcean/Linode)
- Best for: Medium traffic, cost-effective

### **Option 3: All-in-One VPS**
- Everything on single server (AWS EC2/DigitalOcean)
- Best for: Small schools, budget-friendly

---

## 🌐 Option 1: Full Cloud Deployment

### **Step 1: Deploy Frontend to Vercel**

#### **1.1 Prepare Frontend**
```bash
cd apps/frontend-next

# Ensure .env.local has production values
# Create vercel.json if needed
```

#### **1.2 Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### **1.3 Configure Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:
```env
# Database
DATABASE_HOST=your-planetscale-host.psdb.cloud
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=sas
DATABASE_PORT=3306

# API URLs
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_RAZORPAY_URL=https://your-razorpay.railway.app
NEXT_PUBLIC_RAG_URL=https://your-rag.railway.app

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_key
```

---

### **Step 2: Deploy Database to PlanetScale**

#### **2.1 Create PlanetScale Database**
```bash
# Install PlanetScale CLI
brew install planetscale/tap/pscale  # Mac
# or download from planetscale.com

# Login
pscale auth login

# Create database
pscale database create sas --region us-east

# Create branch
pscale branch create sas main
```

#### **2.2 Import Schema**
```bash
# Connect to database
pscale connect sas main --port 3309

# In another terminal, import schema
mysql -h 127.0.0.1 -P 3309 -u root < sql/schema.sql
```

#### **2.3 Get Connection String**
```bash
# Create password
pscale password create sas main production

# Copy connection details for use in services
```

**Alternative: AWS RDS MySQL**
```bash
# Create RDS instance via AWS Console
# Choose MySQL 8.0
# Instance type: db.t3.micro (free tier) or larger
# Enable public access for initial setup
# Import schema using MySQL Workbench or CLI
```

---

### **Step 3: Deploy Backend Services to Railway**

#### **3.1 Install Railway CLI**
```bash
npm i -g @railway/cli
railway login
```

#### **3.2 Deploy Razorpay Plugin**
```bash
cd razorpay_plugin

# Initialize Railway project
railway init

# Add environment variables
railway variables set DATABASE_HOST=your-db-host
railway variables set DATABASE_USER=your-db-user
railway variables set DATABASE_PASSWORD=your-db-password
railway variables set DATABASE_NAME=sas
railway variables set RAZORPAY_KEY_ID=rzp_live_xxxxx
railway variables set RAZORPAY_KEY_SECRET=your_secret
railway variables set PORT=5002

# Deploy
railway up

# Get public URL
railway domain
```

#### **3.3 Deploy RAG Chatbot Plugin**
```bash
cd ../rag_chatbot_plugin

# Initialize Railway project
railway init

# Add environment variables
railway variables set DATABASE_HOST=your-db-host
railway variables set DATABASE_USER=your-db-user
railway variables set DATABASE_PASSWORD=your-db-password
railway variables set DATABASE_NAME=sas
railway variables set GEMINI_API_KEY=your_gemini_key
railway variables set QDRANT_URL=https://your-qdrant-cloud.io
railway variables set QDRANT_API_KEY=your_qdrant_key
railway variables set PORT=4000

# Deploy
railway up
railway domain
```

#### **3.4 Deploy Other Services**
Repeat similar process for:
- Study Service (port 3002)
- Onboarding Service (port 3005)

---

### **Step 4: Deploy Qdrant Vector Database**

#### **4.1 Qdrant Cloud (Recommended)**
1. Go to [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create account
3. Create cluster (Free tier available)
4. Get API key and URL
5. Update RAG plugin environment variables

#### **4.2 Self-Hosted Qdrant (Alternative)**
```bash
# On Railway or any Docker host
docker run -p 6333:6333 qdrant/qdrant
```

---

### **Step 5: Deploy Python Embedding Server**

#### **5.1 Deploy to Railway**
```bash
cd rag_chatbot_plugin

# Create railway.toml
cat > railway.toml << EOF
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python embedding_server.py"
EOF

# Deploy
railway up
railway domain
```

#### **5.2 Update RAG Plugin Config**
Update `EMBEDDING_SERVER_URL` in RAG plugin environment variables.

---

## 🖥️ Option 2: VPS Deployment (DigitalOcean/AWS EC2)

### **Step 1: Create VPS**

#### **DigitalOcean Droplet**
```bash
# Create droplet via dashboard
# Ubuntu 22.04 LTS
# 2GB RAM minimum (4GB recommended)
# Enable backups
```

#### **AWS EC2**
```bash
# Launch t3.small or larger
# Ubuntu 22.04 LTS AMI
# Configure security groups (ports 80, 443, 22)
```

---

### **Step 2: Server Setup**

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Install Python
apt install -y python3 python3-pip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2
```

---

### **Step 3: Setup Database**

```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE sas;
CREATE USER 'sas_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u sas_app -p sas < /path/to/schema.sql
```

---

### **Step 4: Deploy Application**

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/school-sas.git
cd school-sas

# Install dependencies
npm install

# Build frontend
cd apps/frontend-next
npm run build
cd ../..

# Setup environment variables
cp .env.example .env
# Edit .env with production values

# Start services with PM2
pm2 start npm --name "frontend" -- run start --prefix apps/frontend-next
pm2 start npm --name "razorpay" -- run start --prefix razorpay_plugin
pm2 start npm --name "rag-chatbot" -- run start --prefix rag_chatbot_plugin

# Start Python embedding server
cd rag_chatbot_plugin
pm2 start embedding_server.py --interpreter python3 --name "embedding-server"
cd ..

# Save PM2 configuration
pm2 save
pm2 startup
```

---

### **Step 5: Setup Qdrant with Docker**

```bash
# Create docker-compose.yml for Qdrant
cd /var/www/school-sas
docker-compose -f rag_chatbot_plugin/docker-compose.yml up -d

# Verify Qdrant is running
curl http://localhost:6333/health
```

---

### **Step 6: Configure Nginx**

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/school-sas
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Razorpay Plugin
server {
    listen 80;
    server_name api-razorpay.yourdomain.com;

    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# RAG Chatbot Plugin
server {
    listen 80;
    server_name api-rag.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/school-sas /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

### **Step 7: Setup SSL with Let's Encrypt**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com
certbot --nginx -d api-razorpay.yourdomain.com
certbot --nginx -d api-rag.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

---

## 🔒 Security Checklist

### **Environment Variables**
- [ ] All API keys stored securely
- [ ] Database passwords are strong
- [ ] No secrets in code repository
- [ ] Production keys (not test keys)

### **Database Security**
- [ ] MySQL root password changed
- [ ] Application user has limited privileges
- [ ] Remote access restricted (if needed)
- [ ] Regular backups configured

### **Server Security**
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] Firewall configured (ufw)
- [ ] Fail2ban installed
- [ ] Regular security updates

### **Application Security**
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] Security headers configured

---

## 📊 Monitoring & Maintenance

### **Setup Monitoring**

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### **Database Backups**

```bash
# Create backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql"
mkdir -p $BACKUP_DIR

mysqldump -u sas_app -p'your_password' sas > $BACKUP_DIR/sas_$DATE.sql
gzip $BACKUP_DIR/sas_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

---

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/school-sas
            git pull origin main
            npm install
            cd apps/frontend-next
            npm run build
            cd ../..
            pm2 restart all
```

---

## 🌍 Domain & DNS Configuration

### **DNS Records**

```
Type    Name                Value                   TTL
A       @                   your-server-ip          3600
A       www                 your-server-ip          3600
CNAME   api-razorpay        your-server-ip          3600
CNAME   api-rag             your-server-ip          3600
```

For Vercel frontend:
```
Type    Name    Value                           TTL
CNAME   @       cname.vercel-dns.com           3600
CNAME   www     cname.vercel-dns.com           3600
```

---

## 💰 Cost Estimates

### **Option 1: Full Cloud**
- Vercel: $0 (Hobby) - $20/month (Pro)
- Railway: $5-20/month per service
- PlanetScale: $0 (Hobby) - $29/month (Scaler)
- Qdrant Cloud: $0 (Free tier) - $25/month
- **Total: $30-100/month**

### **Option 2: VPS**
- DigitalOcean Droplet (4GB): $24/month
- Domain: $10-15/year
- **Total: ~$25/month**

### **Option 3: AWS**
- EC2 t3.small: ~$15/month
- RDS db.t3.micro: ~$15/month
- Data transfer: ~$5/month
- **Total: ~$35/month**

---

## 🚨 Troubleshooting

### **Service Won't Start**
```bash
# Check logs
pm2 logs service-name

# Check port availability
netstat -tulpn | grep :3000

# Restart service
pm2 restart service-name
```

### **Database Connection Issues**
```bash
# Test MySQL connection
mysql -h localhost -u sas_app -p

# Check MySQL status
systemctl status mysql

# View MySQL logs
tail -f /var/log/mysql/error.log
```

### **Nginx Issues**
```bash
# Test configuration
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

---

## ✅ Post-Deployment Checklist

- [ ] All services running and accessible
- [ ] Database connected and populated
- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] DNS records configured
- [ ] Test all user flows (login, payments, AI)
- [ ] Razorpay webhooks configured
- [ ] Error tracking setup (Sentry recommended)

---

## 📞 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **PlanetScale Docs:** https://planetscale.com/docs
- **Qdrant Docs:** https://qdrant.tech/documentation
- **DigitalOcean Tutorials:** https://www.digitalocean.com/community/tutorials

---

**Your School SAS system is now production-ready! 🚀**
