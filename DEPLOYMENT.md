# Deployment Guide

This guide will help you deploy your Expense Tracker application to free hosting platforms.

## Prerequisites

- A GitHub account
- Git installed on your computer

## Step 1: Upload to GitHub

### 1.1 Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Expense Tracker application"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it (e.g., "expense-tracker")
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 2: Deploy to Free Hosting

### Option 1: Render (Recommended - Easiest)

**Render** offers free hosting with automatic deployments from GitHub.

1. Go to [render.com](https://render.com) and sign up (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub account and select your repository
4. Configure:
   - **Name**: expense-tracker (or any name)
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
5. Add Environment Variable:
   - **Key**: `SECRET_KEY`
   - **Value**: Generate a random string (you can use: `python -c "import secrets; print(secrets.token_hex(32))"`)
6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment
8. Your app will be live at: `https://your-app-name.onrender.com`

**Note**: Free tier on Render spins down after 15 minutes of inactivity. First request may take 30-60 seconds.

### Option 2: Railway

**Railway** offers free hosting with $5 credit monthly.

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python and deploy
5. Add Environment Variable:
   - **Key**: `SECRET_KEY`
   - **Value**: Generate a random string
6. Your app will be live automatically

### Option 3: PythonAnywhere

**PythonAnywhere** offers free hosting for Python web apps.

1. Go to [pythonanywhere.com](https://www.pythonanywhere.com) and sign up
2. Go to "Files" tab and upload your project files
3. Go to "Web" tab → "Add a new web app"
4. Choose Flask and Python version
5. Set the path to your `app.py`
6. Add environment variable `SECRET_KEY` in "Web" → "Environment variables"
7. Reload the web app

### Option 4: Fly.io

**Fly.io** offers free tier with generous limits.

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. In your project directory: `fly launch`
4. Follow prompts and deploy
5. Add secret: `fly secrets set SECRET_KEY=your-secret-key`

## Step 3: Generate Secret Key

For production, generate a secure secret key:

**On Windows (PowerShell):**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**On Mac/Linux:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and use it as your `SECRET_KEY` environment variable.

## Important Notes

1. **Database**: SQLite database will be created automatically on first run
2. **Data Persistence**: On free tiers, database may reset. Consider upgrading for production
3. **HTTPS**: All platforms provide HTTPS by default
4. **Custom Domain**: Most platforms allow custom domains (may require paid plan)

## Troubleshooting

### App not starting
- Check build logs in your hosting platform
- Ensure `requirements.txt` has all dependencies
- Verify `Procfile` is correct

### Database errors
- Database file is created automatically
- Ensure write permissions on hosting platform

### Secret key issues
- Make sure `SECRET_KEY` environment variable is set
- Use a strong, random secret key

## Next Steps

After deployment:
1. Test all features (signup, login, add expenses, etc.)
2. Share your app URL with users
3. Monitor usage and consider upgrading if needed

