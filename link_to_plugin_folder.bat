REM Run me under administrative privileges
pushd %~dp0

mklink "C:\Program Files (x86)\Notepad++\plugins\jN\includes\emmet.js" "dist\emmet.js"
mklink /D "C:\Program Files (x86)\Notepad++\plugins\jN\includes\emmet\" "dist\emmet"
mklink /D "C:\Program Files (x86)\Notepad++\plugins\jN\includes\dialog\" "dist\dialog"

popd
