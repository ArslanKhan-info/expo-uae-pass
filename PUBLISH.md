# Publishing Guide for expo-uae-pass

This guide will help you publish the `expo-uae-pass` package to npm.

## Prerequisites

1. **npm account**: Create an account at https://www.npmjs.com if you don't have one
2. **Login to npm**: Run `npm login` and enter your credentials
3. **Verify login**: Run `npm whoami` to confirm you're logged in

## Pre-Publishing Checklist

- [x] Package renamed to `expo-uae-pass`
- [x] All documentation updated with new package name
- [x] Author information added
- [x] LICENSE updated to 2026
- [x] TypeScript builds successfully
- [x] All source files compiled to `lib/` directory
- [ ] Update repository URL in package.json (replace `yourusername` with your GitHub username)
- [ ] Create GitHub repository and push code
- [ ] Test package locally (optional but recommended)

## Steps to Publish

### 1. Update Repository URL

In `package.json`, replace `yourusername` with your actual GitHub username:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/expo-uae-pass"
},
"homepage": "https://github.com/YOUR_USERNAME/expo-uae-pass#readme",
"bugs": {
  "url": "https://github.com/YOUR_USERNAME/expo-uae-pass/issues"
}
```

### 2. Create GitHub Repository (Recommended)

```bash
# Initialize git if not already done
git init

# Create .gitignore if needed (already exists)

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/expo-uae-pass.git
git add .
git commit -m "Initial commit: expo-uae-pass v1.0.0"
git push -u origin main
```

### 3. Test Package Locally (Optional)

Test the package in another project before publishing:

```bash
# In this directory
npm pack

# This creates expo-uae-pass-1.0.0.tgz
# In your test project:
npm install /path/to/expo-uae-pass-1.0.0.tgz
```

### 4. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

This should include:
- `lib/` - Compiled JavaScript and TypeScript definitions
- `expo-plugin/` - Expo config plugin
- `README.md` - Documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

### 5. Build the Package

```bash
npm run build
```

This compiles TypeScript and ensures everything is ready.

### 6. Publish to npm

```bash
# For first time publish
npm publish

# If you need to make changes and republish (increment version first!)
npm version patch  # 1.0.0 -> 1.0.1
npm publish
```

### 7. Verify Publication

After publishing, verify at:
- https://www.npmjs.com/package/expo-uae-pass
- Test installation: `npm install expo-uae-pass`

## Version Management

Use semantic versioning:

```bash
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features, backward compatible)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)
```

## Troubleshooting

### Package name already taken
If `expo-uae-pass` is already taken, you can:
- Use a scoped package: `@yourusername/expo-uae-pass`
- Choose another name: `expo-uaepass`, `react-native-uaepass`, etc.

To use a scoped package:
```json
{
  "name": "@yourusername/expo-uae-pass"
}
```

Then publish with:
```bash
npm publish --access public
```

### Build errors
Make sure all peer dependencies are in devDependencies for type checking.

### Permission errors
Run `npm login` again to refresh credentials.

## Post-Publishing

1. **Tag the release on GitHub**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create a GitHub release** with changelog

3. **Update documentation** if needed

4. **Share your package**:
   - Tweet about it
   - Post on Reddit (r/reactnative, r/expo)
   - Share in UAE developer communities

## Important Notes

- Never publish with `node_modules/` or source TypeScript files (handled by .npmignore)
- Always test the built `lib/` files work correctly
- Keep README.md up to date with installation and usage instructions
- Respond to issues and PRs on GitHub
- Keep dependencies updated

## Files Included in Published Package

According to `package.json` "files" field:
```
expo-uae-pass/
├── lib/                    # Compiled JavaScript + TypeScript definitions
│   ├── components/
│   ├── config/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── index.js/d.ts
├── expo-plugin/            # Expo config plugin
│   └── withUAEPassModule.js
├── README.md               # Documentation
├── LICENSE                 # MIT license
└── package.json           # Package metadata
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/YOUR_USERNAME/expo-uae-pass/issues
- npm page: https://www.npmjs.com/package/expo-uae-pass

