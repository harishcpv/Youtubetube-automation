@echo off
echo =======================================================
echo Pushing Youtubetube automation to GitHub: harishcpv
echo =======================================================

git remote set-url origin https://github.com/harishcpv/Youtubetube-automation.git
git branch -M main
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Successfully pushed to https://github.com/harishcpv/Youtubetube-automation
) else (
    echo [NOTICE] If the repository does not exist yet on GitHub:
    echo 1. Go to https://github.com/new
    echo 2. Set Repository Name to: Youtubetube-automation
    echo 3. Keep it Public or Private, and leave "Initialize with README" UNCHECKED
    echo 4. Click "Create repository"
    echo 5. Re-run this script!
)
pause
