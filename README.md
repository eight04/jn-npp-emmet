jN-npp-emmet
============
Add emmet to notepad++.

Apparently, current Emmet plugin for Notepad++ is extreme slow on big file ([emmetio/npp#2](https://github.com/emmetio/npp/issues/2)). This version is much faster although I don't know where is the problem :|

Install
-------
1. Install [jn-npp-plugin](https://github.com/sieukrem/jn-npp-plugin).
2. Currently there is a bug in jN (prior to 2.1.181), you have to [fix it manually](https://github.com/sieukrem/jn-npp-plugin/issues/22).
3. Copy everything in `dist` into `plugins\jN\includes`.
4. Keymap is located at `%appdata%\Notepad++\plugins\config\emmet.keymap.json`

Todos
-----
* Make license compatible with jN's zen_coding script.

Changelog
=========
* 0.2.0 (Feb 26, 2016)
	- Add readBinary feature.
	- Temporary fix with read file API. `Update image size` should work now.
	- Add User defined menu. Lacated at `%appdata%\Notepad++\plugins\config\emmet.menu.json`
	- Rewrite the dialog module, which can remember the last position and size.
* 0.1.0
	- Initial release.
