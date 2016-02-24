(function(){

	require("lib/Scintilla.js");
	require("lib/ECMA262.js");
	require("includes/emmet/emmet.js");

	var path = function(){
		var fso = new ActiveXObject("Scripting.FileSystemObject");

		return {
			join: function(base) {
				if (this.exists(base)) {
					base = this.parent(base);
				}
				var path = Array.prototype.join.call(arguments, "\\");
				return this.abs(path);
			},
			abs: function(path) {
				return fso.GetAbsolutePathName(path);
			},
			parent: function(path) {
				return fso.GetParentFolderName(path);
			},
			exists: function(path) {
				return fso.FileExists(path);
			},
			copy: function(src, dest){
				fso.CopyFile(src, dest);
			},
			ext: function(filename) {
				return fso.GetExtensionName(filename);
			}
		};
	}();

	var io = function() {
		var stream = new ActiveXObject("ADODB.Stream");
		stream.Charset = "UTF-8";

		return {
			read: function(filename) {
				var result;
				stream.Open();
				try {
					stream.LoadFromFile(filename);
					result = stream.ReadText();
				} catch (err) {
					result = "";
				}
				stream.Close();
				return result;
			},
			write: function(filename, value) {
				stream.Open();
				stream.WriteText(value),
				stream.SaveToFile(filename),
				stream.Close();
			},
			readBin: function(filename, size) {
				var result;
				stream.Open();
				try {
					stream.LoadFromFile(filename);
					result = stream.Read(size);
				} catch (err) {
					result = "";
				}
				stream.Close();
				return result;
			}
		};
	}();

	var PLUGIN_DIR = path.parent(System.scriptFullName);

	// Default snippets and caniuse
	emmet.loadSystemSnippets(io.read(PLUGIN_DIR + "/includes/emmet/snippets.json"));
	emmet.loadCIU(io.read(PLUGIN_DIR + "/includes/emmet/caniuse.json"));

	// Default keymap
	var userKeymap = Editor.pluginConfigDir + "/emmet.keymap.json",
		defaultKeymap = PLUGIN_DIR + "/includes/emmet/keymap.json";

	if (!path.exists(userKeymap)) {
		path.copy(defaultKeymap, userKeymap);
	}

	// User settings
	var preference = io.read(Editor.pluginConfigDir + "/emmet.preferences.json");
	var snippets = io.read(Editor.pluginConfigDir + "/emmet.snippets.json");
	var keyMap = io.read(Editor.pluginConfigDir + "/emmet.keymap.json");

	if (preference) {
		emmet.loadPreferences(preference);
	}

	if (snippets) {
		emmet.loadSnippets(snippets);
	}

	try {
		keyMap = JSON.parse(keyMap);
	} catch (err) {
		keyMap = {};
	}

	// Create emmet editor
	var emmetEditor = (function(){
		var context = null;

		// Returns true if using tab character
		function useTabChar() {
			return (new Scintilla(context.handle)).Call("SCI_GETUSETABS", 0, 0);
		}

		// Returns tab width (or space length)
		function tabWidth() {
			return (new Scintilla(context.handle)).Call("SCI_GETTABWIDTH", 0, 0);
		}

		/**
		 * Normalizes text before it goes to editor: replaces indentation
		 * and newlines with ones used in editor
		 * @param  {String} text   Text to normalize
		 * @param  {Editor} editor Brackets editor instance
		 * @return {String}
		 */
		function normalize(text) {
			var indentation = '\t';
			if (!useTabChar()) {
				indentation = '';
				var units = tabWidth();
				while (units--) {
					indentation += ' ';
				}
			}

			return emmet.utils.editor.normalize(text, {
				indentation: indentation,
				newline: '\n'
			});
		}

		// Replace document text with value between start and end.
		function replaceRange(value, start, end) {
			var anchor = context.anchor,
				pos = context.pos;

			context.anchor = start;
			context.pos = end;
			context.selection = value;
			context.anchor = anchor;
			context.pos = pos;
		}

		return {
			/**
			 * Setup underlying editor context. You should call this method
			 * <code>before</code> using any Zen Coding action.
			 * @param {Object} context
			 */
			setContext: function(ctx) {
				context = ctx;
			},

			/**
			 * Returns character indexes of selected text: object with <code>start</code>
			 * and <code>end</code> properties. If there's no selection, should return
			 * object with <code>start</code> and <code>end</code> properties referring
			 * to current caret position
			 * @return {Object}
			 * @example
			 * var selection = zen_editor.getSelectionRange();
			 * alert(selection.start + ', ' + selection.end);
			 */
			getSelectionRange: function() {
				var cachePos = context.pos;
				var cacheAnchor = context.anchor;
				return {
					start: Math.min(cacheAnchor, cachePos),
					end: Math.max(cacheAnchor, cachePos)
				};
			},

			/**
			 * Creates selection from <code>start</code> to <code>end</code> character
			 * indexes. If <code>end</code> is ommited, this method should place caret
			 * and <code>start</code> index
			 * @param {Number} start
			 * @param {Number} [end]
			 * @example
			 * zen_editor.createSelection(10, 40);
			 *
			 * //move caret to 15th character
			 * zen_editor.createSelection(15);
			 */
			createSelection: function(start, end) {
				context.anchor = start;
				context.pos = end;
			},

			/**
			 * Returns current line's start and end indexes as object with <code>start</code>
			 * and <code>end</code> properties
			 * @return {Object}
			 * @example
			 * var range = zen_editor.getCurrentLineRange();
			 * alert(range.start + ', ' + range.end);
			 */
			getCurrentLineRange: function() {
				var line = context.lines.get(context.lines.current);
				return {start: line.start, end: line.end};
			},

			/**
			 * Returns current caret position
			 * @return {Number|null}
			 */
			getCaretPos: function(){
				return context.pos;
			},

			/**
			 * Set new caret position
			 * @param {Number} pos Caret position
			 */
			setCaretPos: function(pos) {
				context.anchor = context.pos = pos;
			},

			/**
			 * Returns content of current line
			 * @return {String}
			 */
			getCurrentLine: function() {
				var range = this.getCurrentLineRange();
				return this.getContent().substring(range.start, range.end);
			},

			/**
			 * Replace editor's content or it's part (from <code>start</code> to
			 * <code>end</code> index). If <code>value</code> contains
			 * <code>caret_placeholder</code>, the editor will put caret into
			 * this position. If you skip <code>start</code> and <code>end</code>
			 * arguments, the whole target's content will be replaced with
			 * <code>value</code>.
			 *
			 * If you pass <code>start</code> argument only,
			 * the <code>value</code> will be placed at <code>start</code> string
			 * index of current content.
			 *
			 * If you pass <code>start</code> and <code>end</code> arguments,
			 * the corresponding substring of current target's content will be
			 * replaced with <code>value</code>.
			 * @param {String} value Content you want to paste
			 * @param {Number} [start] Start index of editor's content
			 * @param {Number} [end] End index of editor's content
			 */
			replaceContent: function(value, start, end, noIndent) {
				// https://github.com/emmetio/brackets-emmet/blob/master/editor.js
				if (typeof end == 'undefined') {
					end = (typeof start == 'undefined') ? this.getContent().length : start;
				}
				if (typeof start == 'undefined') {
					start = 0;
				}

				value = normalize(value);

				// indent new value
				if (!noIndent) {
					var pad = emmet.utils.common.getLinePaddingFromPosition(this.getContent(), start);
					value = emmet.utils.common.padString(value, pad);
				}

				// find new caret position
				var tabstopData = emmet.tabStops.extract(value, {
					escape: function(ch) {
						return ch;
					}
				});
				value = tabstopData.text;

				var firstTabStop = tabstopData.tabstops[0] || {start: value.length, end: value.length};
				firstTabStop.start += start;
				firstTabStop.end += start;

				replaceRange(value, start, end);

				this.createSelection(firstTabStop.start, firstTabStop.end);
			},

			/**
			 * Returns editor's content
			 * @return {String}
			 */
			getContent: function(){
				return context.text || '';
			},

			/**
			 * Returns current editor's syntax mode
			 * @return {String}
			 */
			getSyntax: function() {
				var syntax = (Editor.langs[context.lang] || '').toLowerCase(),
					caret_pos = this.getCaretPos();

				if (syntax == 'html') {
					// get the context tag
					var result = emmet.htmlMatcher.tag(this.getContent(), caret_pos);
					if (result && result.open.name == "style") {
						if (result.open.range.end <= caret_pos && result.close.range.start >= caret_pos) {
							syntax = "css";
						}
					}
				}

				if (!syntax) {
					filename = context.files[context.file];
					syntax = path.ext(filename);
				}

				return syntax;
			},

			/**
			 * Returns current output profile name (see profile module).
			 * In most cases, this method should return <code>null</code> and let
			 * Emmet guess best profile name for current syntax and user data.
			 * In case you’re using advanced editor with access to syntax scopes
			 * (like Sublime Text 2), you can return syntax name for current scope.
			 * For example, you may return `line` profile when editor caret is inside
			 * string of programming language.
			 *
			 * @return {String}
			 */
			getProfileName: function() {
				return null;
			},

			/**
			 * Ask user to enter something
			 * @param {String} title Dialog title
			 * @return {String} Entered data
			 * @since 0.65
			 */
			// FIXME: WTF a synchronized api in javascript?
			prompt: function(title) {	// eslint-disable-line
				return '';
			},

			/**
			 * Returns current selection
			 * @return {String}
			 * @since 0.65
			 */
			getSelection: function() {
				// var sel = this.getSelectionRange();
				// return this.getContent().substring(sel.start, sel.end);
				return context.selection;
			},

			/**
			 * Returns current editor's file path
			 * @return {String}
			 * @since 0.65
			 */
			getFilePath: function() {
				return context.files[context.file];
			}
		};
	})();

	var emmetFile = (function(){
		return {
			/**
			 * Read file content and return it
			 * @param {String} path File's relative or absolute path
			 * @param {Number} size Number of bytes to read, optional. If not specified,
			 * reads full file
			 * @param {Function} callback Callback function invoked when reading is
			 * completed
			 * @return {String}
			 */
			read: function(path, size, callback) {
				var bin = io.readBin(path, size);
				if (callback) {
					callback(bin);
				} else {
					return bin;
				}
			},

			/**
			 * Locate <code>file_name</code> file that relates to <code>editor_file</code>.
			 * File name may be absolute or relative path
			 *
			 * <b>Dealing with absolute path.</b>
			 * Many modern editors have a "project" support as information unit, but you
			 * should not rely on project path to find file with absolute path. First,
			 * it requires user to create a project before using this method (and this
			 * is not very convenient). Second, project path doesn't always points to
			 * to website's document root folder: it may point, for example, to an
			 * upper folder which contains server-side scripts.
			 *
			 * For better result, you should use the following algorithm in locating
			 * absolute resources:
			 * 1) Get parent folder for <code>editorFile</code> as a start point
			 * 2) Append required <code>fileName</code> to start point and test if
			 * file exists
			 * 3) If it doesn't exists, move start point one level up (to parent folder)
			 * and repeat step 2.
			 *
			 * @param {String} editorFile
			 * @param {String} fileName
			 * @return {String} Returns null if <code>fileName</code> cannot be located
			 */
			locateFile: function(editorFile, fileName) {
				var folder = path.parent(editorFile),
					result;
				while (folder) {
					result = path.join(folder, fileName);
					if (path.exists(result)) {
						return result;
					}
					folder = path.parent(folder);
				}
				return '';
			},

			/**
			 * Creates absolute path by concatenating <code>parent</code> and <code>file_name</code>.
			 * If <code>parent</code> points to file, its parent directory is used
			 * @param {String} parent
			 * @param {String} file_name
			 * @return {String}
			 */
			createPath: function(parent, fileName) {
				return path.join(parent, fileName);
			},

			/**
			 * Saves <code>content</code> as <code>file</code>
			 * @param {String} file File's absolute path
			 * @param {String} content File content
			 */
			save: function(file, content) {
				io.write(file, content);
			},

			/**
			 * Returns file extension in lower case
			 * @param {String} file
			 * @return {String}
			 */
			getExt: function(file) {
				var m = (file || '').match(/\.([\w\-]+)$/);
				return m ? m[1].toLowerCase() : '';
			}
		};
	})();

	emmet.file(emmetFile);

	/**
	 * Zen Coding manager that runs actions
	 * @param {String} action_name Action to call
	 * @return {Boolean} Returns 'true' if action ran successfully
	 */
	function runAction(action_name) {
		emmetEditor.setContext(Editor.currentView);
		if (action_name == 'wrap_with_abbreviation' || action_name == "update_tag") {
			Dialog.prompt('Enter Abbreviation',"", function(abbr){
				if (abbr)
					emmet.run(action_name, emmetEditor, abbr);
			});
		} else {
			return emmet.run(action_name, emmetEditor);
		}
	}

	// Construct menu helper
	function constructMenu(menu, list) {
		list.forEach(function(item){
			if (item.type == "submenu") {
				var subMenu = menu.addMenu({
					text: item.name
				});
				constructMenu(subMenu, item.items);
			} else {
				menu.addItem({
					text: item.label + (keyMap[item.name] ? "\t" + keyMap[item.name] : ""),
					cmd: function(){
						runAction(item.name);
					}
				});
			}
		});
	}

	constructMenu(Editor.addMenu("Emmet"), emmet.actions.getMenu());

	// Map key name to key code.
	// https://msdn.microsoft.com/en-us/library/dd375731%28v=VS.85%29.aspx
	var keycodeMap = {
		backspace: 0x8,
		tab: 0x9,
		enter: 0xD,
		pause: 0x13,
		caps: 0x14,
		esc: 0x1b,
		space: 0x20,
		pageup: 0x21,
		pgup: 0x21,
		pagedown: 0x22,
		pgdn: 0x22,
		end: 0x23,
		home: 0x24,
		left: 0x25,
		up: 0x26,
		right: 0x27,
		down: 0x28,
		printscreen: 0x2c,
		printscr: 0x2c,
		insert: 0x2d,
		ins: 0x2d,
		"delete": 0x2e,
		del: 0x2e,
		numpad0: 0x60,
		num0: 0x60,
		numpad1: 0x61,
		num1: 0x61,
		numpad2: 0x62,
		num2: 0x62,
		numpad3: 0x63,
		num3: 0x63,
		numpad4: 0x64,
		num4: 0x64,
		numpad5: 0x65,
		num5: 0x65,
		numpad6: 0x66,
		num6: 0x66,
		numpad7: 0x67,
		num7: 0x67,
		numpad8: 0x68,
		num8: 0x68,
		numpad9: 0x69,
		num9: 0x69,
		multiply: 0x6a,
		f1: 0x70,
		f2: 0x71,
		f3: 0x72,
		f4: 0x73,
		f5: 0x74,
		f6: 0x75,
		f7: 0x76,
		f8: 0x77,
		f9: 0x78,
		f10: 0x79,
		f11: 0x7a,
		f12: 0x7b,
		numlock: 0x90,
		scrolllock: 0x91
	};

	// Regist hotkeys.
	emmet.actions.getList().forEach(function(action){
		var userHotkey = keyMap[action.name];
		if (!userHotkey) {
			return;
		}
		var keys = userHotkey.split("+");
		var cfg = {
			cmd: function() {
				runAction(action.name);
			}
		};
		var i;
		for (i = 0; i < keys.length; i++) {
			var token = keys[i].toLowerCase().split(" ").join("");

			token = keycodeMap[token] || token;

			switch (token) {
				case "ctrl":
				case "shift":
				case "alt":
					cfg[token] = true;
					break;

				default:
					cfg.key = token;
					break;
			}
		}

		Editor.addHotKey(cfg);
	});
})();
