# Deployment Guide for Pig Farm Management System

This guide explains how to deploy the application to your Debian server (`srv1259384`).

## Prerequisites

- Access to the server via SSH.
- Docker and Docker Compose installed on the server (it seems you already have Docker running).

## Steps

### 1. Copy Files to Server

You need to copy the project files to your server. You can use `scp` (Secure Copy) from your local machine.

Open your PowerShell or Command Prompt and run (replace `D:\work\blt` with your actual project path if different):

```powershell
# Run this on your LOCAL Windows machine
scp -r D:\work\blt root@72.60.192.252:/root/farmpigs
```

*Note: This might take a while depending on your internet speed. If `node_modules` is large, you might want to delete it locally before copying, or use `rsync` if available.*

### 2. Connect to Server

```bash
ssh root@72.60.192.252
```

### 3. Deploy the Application

On the server, navigate to the folder and run Docker Compose:

```bash
cd /root/farmpigs

# Build and start the containers in the background
docker compose up -d --build
```

### 4. Run Database Migrations

After the containers are up, you need to create the database tables:

```bash
# Execute migration inside the running app container
docker compose exec app npx prisma migrate deploy
```

### 5. Access the Application

Your application should now be running at:
http://72.60.192.252:3000

## Troubleshooting

- **Check logs:** `docker compose logs -f`
- **Restart:** `docker compose down` then `docker compose up -d`
- **Rebuild:** `docker compose up -d --build` (use this if you change code)
