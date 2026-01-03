# Quick Start: Upload to GitHub

Follow these steps to upload your project to GitHub:

## Step 1: Initialize Git (if not already done)

Open PowerShell or Terminal in your project folder and run:

```bash
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: Expense Tracker application"
```

## Step 4: Create GitHub Repository

1. Go to https://github.com and sign in
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Enter repository name (e.g., "expense-tracker")
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

## Step 5: Connect and Push

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 6: Deploy to Render (Free Hosting)

1. Go to https://render.com and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub and select your repository
4. Configure:
   - **Name**: expense-tracker
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
5. Add Environment Variable:
   - **Key**: `SECRET_KEY`
   - **Value**: Run this to generate: `python -c "import secrets; print(secrets.token_hex(32))"`
6. Click **"Create Web Service"**
7. Wait 5-10 minutes
8. Your app will be live! 🎉

## Generate Secret Key

Run this command to generate a secure secret key:

**Windows PowerShell:**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**Mac/Linux:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and use it as your `SECRET_KEY` in Render.

