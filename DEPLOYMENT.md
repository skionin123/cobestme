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

## 5. Test link (try changes before they go live)

A second Railway service can run a branch of this repository so changes can be tried before they are merged into `main`.

- Give the test service the same `SUPABASE_URL` and `SUPABASE_ANON_KEY` as the live service (Railway reference variables such as `${{cobestme.SUPABASE_URL}}` keep them in step).
- Also set `COBEST_TEST_DEPLOYMENT=1` on the test service **only**.
- Do not copy `COBEST_INTERNAL_SECRET` or any payment keys: payments and plan changes then stay switched off on the test link.

The test link uses the same accounts and data as the live website. With `COBEST_TEST_DEPLOYMENT=1` the server refuses to publish or unpublish a shop that was created on the live website, so testing cannot change what real visitors see. Shops created on the test link (or named "Test …") publish normally. Everything else — products, orders, drafts — is the real data of the signed-in account, so use a test shop for experiments.

Delete the test service in Railway when it is no longer needed.
