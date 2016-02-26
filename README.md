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

Config
------
All config files are placed in the config directory: `%appdata%\Notepad++\plugins\config`.

### emmet.keymap.json

```
{
	// The order of key combination doesn't matter
	"encode_decode_data_url": "Ctrl+Shift+I",
	"prev_edit_point": "Ctrl+Alt+Left",
	"next_edit_point": "Ctrl+Alt+Right",
	...
	// Disable the action with `null`. You can still execute it with emmet menu.
	"insert_formatted_line_break_only": null,
	"insert_formatted_line_break": null,
	"balance_inward": "Ctrl+Shift+D",
	...
}
```

### emmet.menu.json

```
[
	{
		"type": "action",	// action, submenu, separator
		"name": "expand_abbreviation",	// the name of the action
		"label": "Expand Abbreviation"	// if the item is lack of .label, it will use .name as fallback.
	},
	{
		"type": "separator"
	},
	{
		"type": "action",
		"name": "encode_decode_data_url",
		"label": "Encode\\Decode data:URL image"
	},
	...
	{
		"name": "Numbers",
		"type": "submenu",
		"items": [	// the items in the submenu.
			{
				"type": "action",
				"name": "evaluate_math_expression",
				"label": "Evaluate Math Expression"
			},
			{
				"type": "action",
				"name": "increment_number_by_1",
				"label": "Increment number by 1"
			},
			...
		]
	},
	...
]
```

FileStream.js
-------------
http://hp.vector.co.jp/authors/VA033015/fsjs.html

I randomly found this with Google.

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
