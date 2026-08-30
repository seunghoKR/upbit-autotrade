const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FTP_HOST = '115.68.168.243';
const FTP_USER = 'nuriohtrade';
const FTP_PASS = 'seungho0409#';
const REMOTE_ROOT = '/public_html';

const LOCAL_BASE = process.cwd();
const DIST_DIR = path.resolve(LOCAL_BASE, 'dashboard', 'dist');
const PHP_DIR = path.resolve(LOCAL_BASE, 'php');

function uploadFileWithCurl(localPath, remoteRelativePath) {
  const remoteUrl = `ftp://${encodeURIComponent(FTP_USER)}:${encodeURIComponent(FTP_PASS)}@${FTP_HOST}${REMOTE_ROOT}/${remoteRelativePath.replace(/\\/g, '/')}`;
  console.log(`⬆️ Uploading: ${remoteRelativePath}`);
  try {
    execSync(`curl -s --ftp-create-dirs -T "${localPath}" "${remoteUrl}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to upload ${localPath}:`, err.message);
  }
}

function uploadDirectory(dir, baseDir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      uploadDirectory(fullPath, baseDir);
    } else {
      const relPath = path.relative(baseDir, fullPath);
      uploadFileWithCurl(fullPath, relPath);
    }
  }
}

async function main() {
  console.log('🚀 Starting FTP Deployment to iwinv hosting server...');

  // 1. Upload .htaccess
  const htaccessContent = `<IfModule mod_headers.c>
    # HTML, JS, JSON 캐시 방지 (항상 최신 버전 보장)
    <FilesMatch "\\.(html|htm|json)$">
        Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
    </FilesMatch>
    <FilesMatch "^sw\\.js$">
        Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
    </FilesMatch>
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # 1. API 라우팅
    RewriteRule ^api/(.*)$ api/index.php [QSA,L]
    RewriteRule ^api$ api/index.php [QSA,L]

    # 2. 존재하는 파일/디렉토리 제공
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # 3. SPA 프론트엔드 라우팅
    RewriteRule ^ index.html [L]
</IfModule>
`;
  const htaccessLocal = path.join(LOCAL_BASE, '.htaccess');
  fs.writeFileSync(htaccessLocal, htaccessContent, 'utf-8');
  uploadFileWithCurl(htaccessLocal, '.htaccess');

  // 2. Upload Frontend Dist
  console.log('\n📦 Uploading Frontend Build (dashboard/dist)...');
  uploadDirectory(DIST_DIR, DIST_DIR);

  // 3. Upload PHP Backend
  console.log('\n🐘 Uploading PHP Backend files...');
  const apiIndex = path.join(PHP_DIR, 'api', 'index.php');
  if (fs.existsSync(apiIndex)) {
    uploadFileWithCurl(apiIndex, 'api/index.php');
    uploadFileWithCurl(apiIndex, 'php/api/index.php');
  }

  const dbConfig = path.join(PHP_DIR, 'config', 'database.php');
  if (fs.existsSync(dbConfig)) {
    uploadFileWithCurl(dbConfig, 'config/database.php');
    uploadFileWithCurl(dbConfig, 'php/config/database.php');
  }

  const migrateFile = path.join(PHP_DIR, 'migrate.php');
  if (fs.existsSync(migrateFile)) {
    uploadFileWithCurl(migrateFile, 'migrate.php');
  }

  console.log('\n🎉 Deployment to http://nuriohtrade.iwinv.net completed successfully!');
}

main();
