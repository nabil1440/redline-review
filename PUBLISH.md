# Publishing redline-review to npm

Follow these steps in order. Takes about 10 minutes.

---

## 1 — Create the GitHub repo

1. Go to https://github.com/new
2. Name it `redline-review`
3. Set visibility to **Public**
4. Do NOT check "Initialize with README" — you already have one
5. Click **Create repository**

Then push your local repo:

```bash
cd /Users/nabil/Desktop/redline-review
git remote add origin https://github.com/mousumaisa/redline-review.git
git push -u origin develop
```

Set `develop` as the default branch in GitHub → Settings → Branches → Default branch.

---

## 2 — Create an npm account

1. Go to https://www.npmjs.com/signup
2. Choose a username, enter your email, set a password
3. **Verify your email** — check your inbox and click the link. You cannot publish without this.

---

## 3 — Enable 2FA on your npm account

npm requires 2FA to publish. Without it, `npm publish` will fail.

1. Log in at npmjs.com → click your avatar → Account Settings
2. Find **Two-Factor Authentication** → click Enable
3. Select **Auth and Writes**
4. Scan the QR code with an authenticator app (1Password, Authy, Google Authenticator)
5. Enter the 6-digit code to confirm
6. **Save your recovery codes** somewhere safe

---

## 4 — Log in via the CLI

```bash
npm login
```

Enter your npm username, password, and the OTP from your authenticator app. Verify it worked:

```bash
npm whoami
# → your-username
```

---

## 5 — Dry run (sanity check)

```bash
cd /Users/nabil/Desktop/redline-review
npm pack --dry-run
```

Confirm:
- `src/` is NOT in the file list (good — excluded by `.npmignore`)
- `dist/`, `rules/`, `prompts/`, `adapters/`, `bin/`, `README.md` are all present
- Version is `1.0.0`

---

## 6 — Publish

```bash
npm publish --access public
```

Enter your OTP when prompted. A successful publish looks like:

```
npm notice Publishing to https://registry.npmjs.org/
+ redline-review@1.0.0
```

---

## 7 — Verify it's live

```bash
npm info redline-review
```

Or visit: https://www.npmjs.com/package/redline-review

Anyone can now install it with:

```bash
npm install -g redline-review
```

---

## Future releases

```bash
npm version patch   # 1.0.0 → 1.0.1  (bug fixes)
npm version minor   # 1.0.0 → 1.1.0  (new features)
npm version major   # 1.0.0 → 2.0.0  (breaking changes)

npm publish
```

`npm version` automatically creates a git commit and tag. Push it:

```bash
git push && git push --tags
```
