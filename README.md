jN-npp-emmet
============
Add Emmet to Notepad++.

Apparently, current Emmet plugin for Notepad++ is extreme slow on big file ([emmetio/npp#2](https://github.com/emmetio/npp/issues/2)). This version is much faster although I don't know where is the problem :|

Installation
------------
1. Install [jn-npp-plugin](https://github.com/sieukrem/jn-npp-plugin).
2. Copy everything in `dist` into `plugins\jN\includes`.
3. Restart Notepad++, or just start it if it is already closed.
4. Keymap and other settings would be generated to `%appdata%\Notepad++\plugins\config\`. After changing the settings, restart Nodepad++ to take effect.

Config
------
All config files are placed in the config directory: `%appdata%\Notepad++\plugins\config`.

### emmet.keymap.json

```js
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

```js
[
  {
    "type": "action", // action, submenu, separator
    "name": "expand_abbreviation",  // the name of the action
    "label": "Expand Abbreviation"  // if the item is lack of .label, it will use .name as fallback.
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
    "items": [  // the items in the submenu.
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

### emmet.settings.json

```js
{
  // setting to false will make tab working in all file types
  "enableTabExpensionByFileType": true,
  // "txt", "php", "c", "cpp", "cs", "objc", "java", "rc", "html", "xml", "makefile", "pascal", "batch", "ini", "nfo", "user", "asp", "sql", "vb", "js", "css", "perl", "python", "lua", "tex", "fortran", "bash", "flash", "nsis", "tcl", "lisp", "scheme", "asm", "diff", "props", "ps", "ruby", "smalltalk", "vhdl", "kix", "au3", "caml", "ada", "verilog", "matlab", "haskell", "inno", "searchresult", "cmake", "yaml", "cobol", "gui4cli", "d", "powershell", "r", "jsp", "coffeescript", "json", "javascript", "external"
  "enableTabExpensionUnder": ["html", "css"]
}
```

### Emmet customization

[Emmet allows you to change its behavior through 3 JSON files](https://docs.emmet.io/customization/): `snippets.json`, `preferences.json`, and `syntaxProfiles.json`. In jn-npp-emmet, they would be read from the config folder with filename prefix `emmet.` i.e. `emmet.snippets.json`, `emmet.preferences.json`, and `emmet.syntaxProfiles.json`.

FileStream.js
-------------
~~http://hp.vector.co.jp/authors/VA033015/fsjs.html~~ (offline)

http://ftp.vector.co.jp/46/91/2590/fsjs1081221.zip

I randomly found this with Google.

Todos
-----
* Make license compatible with jN's zen_coding script.

Speed test
----------
`test.html`: L4533, L4680, L4
* better-matcher: 115, 688, 31
* zen-coding: 105, 679, 26
* quick-match: 67, 20, 34
* quick-match-2: 72, 27, 26

Changelog
=========
* 1.2.2 (Apr 9, 2018)
  - Update emmet. Fix infinite recursion bug.
  - Fix: close autocomplete dialog after execution.
  - Fix: TypeError when calling `endsWith`.
  - Add: load syntaxProfiles. Switch to `emmet.loadUserData`.
  - Change: the hotkey of Balance (outward). <kbd>Ctrl</kbd> + <kbd>D</kbd> -> <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>D</kbd>.
* 1.2.0 (Mar 10, 2018)
  - Update eslint to v4.18.2.
  - Change: dist folder structure. Libraries are put inside `dist/emmet` subfolder.
  - Add info header to `dist/emmet.js`.
  - Fix: file related actions doesn't work.
  - Fix: dialog service.
* 1.1.2 (Nov 30, 2017)
  - Update emmet to v1.6.3.
  - Fix: single open tag is not handled correctly.
* 1.1.1 (Dec 23, 2016)
  - Update emmet to v1.6.1.
  - Fix: scrollbar doesn't scroll when setting caret pos.
* 1.1.0 (Jul 9, 2016)
  - Update emmet to v1.6.0.
  - Drop Grunt.
  - Drop submodule, use npm to manage dependencies.
* 1.0.1 (Apr 12, 2016)
  - Fix infinite loop bug. [#7](https://github.com/eight04/jn-npp-emmet/issues/7)
* 1.0.0 (Apr 3, 2016)
  - Use [eight04/emmet@dev-quick-match-2](https://github.com/eight04/emmet/tree/dev-quick-match-2).
  - Drop MenuCmds.js (#6)
  - Use notepad++ command for tab insertion.
  - Use cache to speed up action.
  - Fix dialog bug in Windows 10.
  - Add option: disable tab expension if not working with HTML or CSS files.
* 0.2.0 (Feb 26, 2016)
  - Add readBinary feature.
  - Temporary fix with read file API. `Update image size` should work now.
  - Add User defined menu. Lacated at `%appdata%\Notepad++\plugins\config\emmet.menu.json`
  - Rewrite the dialog module, which can remember the last position and size.
* 0.1.0
  - Initial release.
