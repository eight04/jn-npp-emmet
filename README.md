jN-npp-emmet
============
Add emmet to notepad++.

Apparently, current Emmet plugin for Notepad++ is extreme slow on big file ([emmetio/npp#2](https://github.com/emmetio/npp/issues/2)). This version is much faster although I don't know where is the problem :|

Install
-------
1. Install [jn-npp-plugin](https://github.com/sieukrem/jn-npp-plugin).
2. Currently there is a bug in jN, you can simply [patch it](#fix-startjs).
3. Put everything in `dist` into `plugins\jN\includes`.
4. Keymap is located at `C:\Users\*\AppData\Roaming\Notepad++\plugins\config\emmet.keymap.json`

Todos
-----
* Make license compatible with jN's zen_coding script.

Fix start.js
------------
There is something wrong in `plugins\jN\start.js` ([sieukrem/jn-npp-plugin#22](https://github.com/sieukrem/jn-npp-plugin/issues/22))

You can fix it by replacing (line 146)
```
	if (fso.FileExists(file))
		file = file;
	else if (fso.FileExists(file + ".js"))
		file = file + ".js"
```
with
```
	if (fso.FileExists("plugins\\jN\\" + file))
		file = "plugins\\jN\\" + file;
	else if (fso.FileExists("plugins\\jN\\" + file + ".js"))
		file = "plugins\\jN\\" + file + ".js"
```
