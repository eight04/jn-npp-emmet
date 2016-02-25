REM Run me under administrative privileges
mklink "C:\Program Files (x86)\Notepad++\plugins\jN\includes\emmet.js" "%~dp0dist\emmet.js"
mklink /D "C:\Program Files (x86)\Notepad++\plugins\jN\includes\emmet\" "%~dp0dist\emmet"
mklink /D "C:\Program Files (x86)\Notepad++\plugins\jN\includes\dialog\" "%~dp0dist\dialog"
mklink /D "C:\Program Files (x86)\Notepad++\plugins\jN\includes\FileStream\" "%~dp0dist\FileStream"
pause
