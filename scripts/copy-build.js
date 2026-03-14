/**
 * Copy frontend build (frontend/dist) to backend/public for production deploy.
 * Run from repo root: node scripts/copy-build.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'frontend', 'dist');
const dest = path.join(root, 'backend', 'public');

if (!fs.existsSync(src)) {
    console.error('Frontend build not found. Run: cd frontend && npm run build');
    process.exit(1);
}

if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
}

function copyRecursive(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(src, dest);
console.log('Copied frontend/dist to backend/public');
