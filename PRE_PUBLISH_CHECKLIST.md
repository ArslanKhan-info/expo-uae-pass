# ✅ Pre-Publishing Checklist for expo-uae-pass

Use this checklist before publishing to npm.

## 🔍 Code & Build

- [x] Package renamed to `expo-uae-pass`
- [x] TypeScript compiles without errors (`npm run build`)
- [x] `lib/` directory contains all compiled files
- [x] All type definitions (`.d.ts`) generated
- [x] No linting errors
- [x] Source code uses correct imports

## 📝 Documentation

- [x] README.md updated with new package name
- [x] Installation instructions accurate
- [x] Usage examples work correctly
- [x] API documentation complete
- [x] EXAMPLE_USAGE.tsx updated
- [x] All code snippets reference `expo-uae-pass`

## 📦 Package Configuration

- [x] `package.json` name: `expo-uae-pass`
- [x] Version set to `1.0.0`
- [x] Author name added: `Arslan Khan`
- [x] License: MIT
- [ ] **TODO**: Update repository URL (replace `yourusername`)
- [x] Homepage and bugs URL configured
- [x] Keywords optimized for npm search
- [x] Peer dependencies listed
- [x] Dev dependencies complete
- [x] `files` field specifies what to publish
- [x] Build scripts configured

## 🔒 Legal & Licensing

- [x] LICENSE file exists
- [x] Copyright year: 2026
- [x] Copyright holder: Arslan Khan
- [x] MIT License text complete

## 🗂️ Files & Structure

- [x] `.npmignore` configured correctly
- [x] `node_modules/` ignored
- [x] `src/` ignored (only `lib/` published)
- [x] `EXAMPLE_USAGE.tsx` ignored
- [x] `.gitignore` configured
- [x] Expo plugin included in package

## 🧪 Testing

- [ ] **RECOMMENDED**: Test package locally with `npm pack`
- [ ] **RECOMMENDED**: Install `.tgz` in test project
- [ ] **RECOMMENDED**: Verify imports work
- [ ] **RECOMMENDED**: Test authentication flow
- [ ] **RECOMMENDED**: Test on both iOS and Android

## 🌐 Repository Setup

- [ ] **TODO**: Create GitHub repository
- [ ] **TODO**: Push code to GitHub
- [ ] **TODO**: Add repository description
- [ ] **TODO**: Add topics/tags on GitHub
- [ ] **TODO**: Enable issues on GitHub

## 📊 npm Setup

- [ ] **TODO**: Have npm account (https://www.npmjs.com)
- [ ] **TODO**: Run `npm login`
- [ ] **TODO**: Verify with `npm whoami`
- [ ] **TODO**: Check package name availability

## 🎯 Final Verification

Run these commands before publishing:

```bash
# 1. Clean build
rm -rf lib node_modules
npm install --legacy-peer-deps
npm run build

# 2. Verify package contents
npm pack --dry-run

# 3. Check for issues
npm run build  # Should complete without errors

# 4. (Optional) Create local test
npm pack
# Install expo-uae-pass-1.0.0.tgz in test project
```

## ⚠️ Critical Before Publishing

1. **Update package.json**:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR_GITHUB_USERNAME/expo-uae-pass"
   }
   ```

2. **Create and push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: expo-uae-pass v1.0.0"
   git remote add origin https://github.com/YOUR_USERNAME/expo-uae-pass.git
   git push -u origin main
   ```

3. **Verify you're logged in to npm**:
   ```bash
   npm whoami
   ```

4. **Check package name is available**:
   ```bash
   npm search expo-uae-pass
   ```
   If taken, consider: `@yourusername/expo-uae-pass`

## 🚀 Publishing Commands

```bash
# First time publish
npm publish

# If using scoped package
npm publish --access public
```

## ✅ Post-Publishing

After successful publish:

- [ ] Verify on npm: https://www.npmjs.com/package/expo-uae-pass
- [ ] Test install: `npm install expo-uae-pass`
- [ ] Create GitHub release with tag `v1.0.0`
- [ ] Update GitHub with description and topics
- [ ] Share on social media
- [ ] Post in UAE developer communities
- [ ] Consider posting on:
  - Reddit: r/reactnative, r/expo
  - Twitter/X
  - LinkedIn
  - Dev.to or Medium (write article)

## 📞 Support Setup

- [ ] Enable GitHub Issues
- [ ] Add CONTRIBUTING.md (optional)
- [ ] Add CODE_OF_CONDUCT.md (optional)
- [ ] Set up GitHub notifications
- [ ] Plan for maintenance and updates

## 🎉 You're Ready When...

All items marked with [x] are complete, and you've:
1. Updated repository URL
2. Created GitHub repository
3. Logged into npm
4. Verified package builds successfully

---

**Last Updated**: January 13, 2026  
**Package Version**: 1.0.0  
**Status**: Ready (pending GitHub setup)

See **PUBLISH.md** for detailed publishing instructions.

