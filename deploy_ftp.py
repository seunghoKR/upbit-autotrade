import os
import sys
import ftplib
from pathlib import Path

FTP_HOST = '115.68.168.243'
FTP_USER = 'nuriohtrade'
FTP_PASS = 'seungho0409#'
REMOTE_ROOT = '/public_html'

LOCAL_BASE = Path(__file__).resolve().parent
DIST_DIR = LOCAL_BASE / 'dashboard' / 'dist'
PHP_DIR = LOCAL_BASE / 'php'

def make_dirs(ftp, remote_path):
    parts = [p for p in remote_path.replace('\\', '/').split('/') if p]
    current = ""
    for part in parts:
        current += "/" + part
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
                print(f"📁 Created remote dir: {current}")
            except Exception as e:
                pass

def upload_file(ftp, local_file, remote_file):
    remote_dir = '/'.join(remote_file.replace('\\', '/').split('/')[:-1])
    make_dirs(ftp, remote_dir)
    ftp.cwd(remote_dir)
    
    filename = Path(remote_file).name
    print(f"⬆️ Uploading: {filename} -> {remote_dir}")
    with open(local_file, 'rb') as f:
        ftp.storbinary(f'STOR {filename}', f)

def main():
    print("🚀 Connecting to FTP server...")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = 'utf-8'
    print(f"✅ Connected to {FTP_HOST} as {FTP_USER}")

    # 1. Upload .htaccess
    htaccess_content = """<IfModule mod_rewrite.c>
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
"""
    htaccess_local = LOCAL_BASE / '.htaccess'
    with open(htaccess_local, 'w', encoding='utf-8') as f:
        f.write(htaccess_content)
    upload_file(ftp, htaccess_local, f'{REMOTE_ROOT}/.htaccess')

    # 2. Upload dist files (Frontend)
    print(f"\n📦 Uploading Frontend build ({DIST_DIR})...")
    for root, dirs, files in os.walk(DIST_DIR):
        for file in files:
            local_path = Path(root) / file
            rel_path = local_path.relative_to(DIST_DIR)
            remote_path = f"{REMOTE_ROOT}/{rel_path.as_posix()}"
            upload_file(ftp, local_path, remote_path)

    # 3. Upload PHP files (Backend)
    print(f"\n🐘 Uploading PHP Backend files...")
    # api/index.php
    api_index = PHP_DIR / 'api' / 'index.php'
    if api_index.exists():
        upload_file(ftp, api_index, f"{REMOTE_ROOT}/api/index.php")
        upload_file(ftp, api_index, f"{REMOTE_ROOT}/php/api/index.php")

    # config/database.php
    db_config = PHP_DIR / 'config' / 'database.php'
    if db_config.exists():
        upload_file(ftp, db_config, f"{REMOTE_ROOT}/config/database.php")
        upload_file(ftp, db_config, f"{REMOTE_ROOT}/php/config/database.php")

    # migrate.php
    migrate_file = PHP_DIR / 'migrate.php'
    if migrate_file.exists():
        upload_file(ftp, migrate_file, f"{REMOTE_ROOT}/migrate.php")

    ftp.quit()
    print("\n🎉 All files uploaded successfully to /public_html on hosting server!")

if __name__ == '__main__':
    main()
