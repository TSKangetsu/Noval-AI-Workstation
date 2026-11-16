@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo [1/2] Typechecking and building single-file bundle with Vite...
pushd web
call npm run build
if errorlevel 1 (
  popd
  goto :fail
)
popd

echo [2/2] Copying web\dist\index.html to NovelAI_Workbench.html...
copy /Y "web\dist\index.html" "NovelAI_Workbench.html" >nul
if errorlevel 1 goto :fail

echo Done! Standalone bundle ready: %cd%\NovelAI_Workbench.html
exit /b 0

:fail
echo Build failed with errorlevel %errorlevel%.
exit /b 1
