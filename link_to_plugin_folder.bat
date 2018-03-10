REM Run me under administrative privileges
mklink "C:\Program Files (x86)\Notepad++\plugins\jN\includes\emmet.js" "%~dp0dist\emmet.js"
mklink /D "C:\Program Files (x86)\Notepad++\plugins\jN\includes\emmet\" "%~dp0dist\emmet"
pause
