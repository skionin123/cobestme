# Deploy CoBest with GitHub and Railway

## 1. Push the project to GitHub

If this local folder is not yet a Git repository, run these commands from the folder containing `package.json`:

```bash
git init
git branch -M main
git remote add origin https://github.com/skionin123/cobestme.git
git add .
git commit -m "Launch CoBest client-facing platform"
git push -u origin main
```

If Git says `remote origin already exists`, run `git remote -v` and then `git push -u origin main`.

## 2. Railway

Create a Railway project from the GitHub repository. The included `railway.toml` uses the app build and start scripts.

## 3. Domain

Test the Railway URL first. Then connect `app.cobest.me` for the application. Keep `cobest.me` for the public product website when you split the public site and app.

## 4. Before charging customers

Connect and test production authentication, a persistent database, payment subscriptions, checkout, transactional email, backups, and error monitoring.
