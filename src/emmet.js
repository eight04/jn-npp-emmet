/* global require WScript: true ActiveXObject FileStream System GlobalSettings */
/* global Editor emmet Scintilla alert */
/**
 *  jn-npp-emmet v$inline("../package.json|parse:version")
 *  
 *  Author: eight04 <eight04@gmail.com>
 *  Homepage: https://github.com/eight04/jn-npp-emmet
 */

require("lib/Scintilla.js");
require("lib/ECMA262.js");

require("includes/emmet/emmet-core.js");
require("includes/emmet/FileStream/FileStream.js");

(function(){

	// Fake WScript env
	if (typeof WScript == "undefined") {
		WScript = {
			CreateObject: function(name) {
				return new ActiveXObject(name);
			}
		};
	}
  
  // Some string utils
  if (typeof String.prototype.endsWith === "undefined") {
    // https://github.com/emmetio/emmet/blob/8fa340dc4c7d209c3e6836ab9fe2e42d23d2cd40/lib/resolver/css.js#L832
    String.prototype.endsWith = function(suffix) {
      return this.lastIndexOf(suffix, this.length - suffix.length) >= 0;
    };
  }

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
			},
			get: function(filename) {
				return fso.GetFile(filename);
			}
		};
	}();

	var io = function() {
		var stream = new ActiveXObject("ADODB.Stream");
		stream.Charset = "UTF-8";

		return {
			read: function(filename) {
				var result;
				stream.type = 2;
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
				var fs = new FileStream(filename),
					buff,
					result = "",
					i;

				if (size == null) {
					size = -1;
				}

				fs.open();
				fs.loadFromFile(filename);
				buff = fs.readToString(size);
				fs.close();

				for (i = 0; i < buff.length; i += 2) {
					result += String.fromCharCode(parseInt(buff.substr(i, 2), 16));
				}

				return result;
			}
		};
	}();

	var PLUGIN_DIR = (function(path){
		return path.parent(System.scriptFullName);
	})(path);

  var DIMENSION_PROPS = ["width", "height", "left", "top"];

  /**
   *  Create a dialog. options may contain following properties:
   *  
   *  * id: when specified, the position of the dialog would be saved to global config.
   *  * title: dialog title.
   *  * html: dialog innerHTML.
   *  * onresolve: resolve handler.
   *  * onreject: reject handler.
   */
  function createDialog(options) {
    var destroyed = false;
    
    var htmlDialog = System.createDialog({
      onbeforeclose: function() {
        // overwrite the behavior of top right "x" button
        if (!destroyed) {
          reject();
          return false;
        }
      }
    });
    
    htmlDialog.visible = false;
    htmlDialog.title = options.title;

    // restore position
    if (options.id) {
      DIMENSION_PROPS.forEach(function(prop) {
        htmlDialog[prop] =
          options.id && GlobalSettings.get("dialog." + options.id + "." + prop) ||
          options[prop] ||
          htmlDialog[prop];
      });
    }

    // Build interface
    var document = htmlDialog.document;

    document.write(options.html);
    document.close();

    document.forms[0].onsubmit = function() {
      resolve(document.getElementById("entry").value);
      return false;
    };

    document.getElementById("cancel").onclick = function() {
      reject();
    };

    document.onkeydown = function(e) {
      e = e || document.parentWindow.event;
      if (e.keyCode == 27) {
        reject();
      }
    };
    
    function show() {
      htmlDialog.visible = true;
      var autofocus = document.querySelector("[autofocus]");
      if (autofocus) {
        autofocus.focus();
      }
      if (options.onshow) {
        options.onshow(htmlDialog);
      }
    }
    
    function hide() {
      if (options.id) {
        DIMENSION_PROPS.forEach(function (prop) {
          GlobalSettings.set(
            "dialog." + options.id + "." + prop,
            htmlDialog[prop]
          );
        });
      }
      htmlDialog.visible = false;
    }
    
    function resolve(value) {
      hide();
      if (options.onresolve) {
        options.onresolve(value);
      }
    }
    
    function reject(value) {
      hide();
      if (options.onreject) {
        options.onreject(value);
      }
    }
    
    function destroy() {
      destroyed = true;
      htmlDialog.close();
    }
    
    return {
      show: show,
      hide: hide,
      resolve: resolve,
      reject: reject,
      destroy: destroy,
      isShown: function() {
        return htmlDialog.visible;
      }
    };
  }
  
  var emmetPrompt = (function() {
    var dialog, callback;
    return function(title, _callback) {
      if (!dialog) {
        dialog = createDialog({
          id: "emmet",
          title: title,
          width: 409,
          height: 112,
          html: io.read(PLUGIN_DIR + "/includes/emmet/prompt-template.html"),
          onresolve: function(value) {
            if (callback) {
              callback(value);
            }
          },
          onshow: function(htmlDialog) {
            htmlDialog.document.getElementById("entry").value = "";
          }
        });
      }
      if (dialog.isShown()) {
        dialog.reject();
      }
      callback = _callback;
      dialog.show();
    };
  })();
	
	function createMap(list) {
		var i, len, holder = {};
		for (i = 0, len = list.length; i < len; i++) {
			holder[list[i]] = true;
		}
		return holder;
	}

	// Default snippets and caniuse
	emmet.loadSystemSnippets(io.read(PLUGIN_DIR + "/includes/emmet/snippets.json"));
	emmet.loadCIU(io.read(PLUGIN_DIR + "/includes/emmet/caniuse.json"));

  // user data
  var userFileList = [
    {
      name: "preferences",
      mandatory: false
    },
    {
      name: "snippets",
      mandatory: false
    },
    {
      name: "syntaxProfiles",
      mandatory: false
    },
    {
      name: "keymap",
      mandatory: true
    },
    {
      name: "menu",
      mandatory: true,
      defaultValue: function() {
        return emmet.actions.getMenu();
      }
    },
    {
      name: "settings",
      mandatory: true
    },
  ];
  
  function readUserData() {
    var data = {};
    userFileList.forEach(function (file) {
      var userPath = Editor.pluginConfigDir + "/emmet." + file.name + ".json";
      var defaultPath = PLUGIN_DIR + "/includes/emmet/" + file.name + ".json";
      
      if (!path.exists(userPath)) {
        if (path.exists(defaultPath)) {
          path.copy(defaultPath, userPath);
        } else if (file.defaultValue) {
          io.write(userPath, JSON.stringify(file.defaultValue(), null, "\t"));
        }
      }
      
      try {
        data[file.name] = JSON.parse(io.read(userPath));
      } catch (err) {
        if (file.mandatory) {
          alert("Failed to read " + userPath + "\n" + String(err));
        }
      }
    });
    return data;
  }

	// User settings
  var userData = readUserData();
  emmet.loadUserData(userData);
  
  var settings = userData.settings || {};
  
	if (settings.enableTabExpensionUnder) {
		settings.enableTabExpensionUnder = createMap(settings.enableTabExpensionUnder);
	}
	
	function commandInsertTab() {
		Editor.runMenuCmd(42008);
	}

	// Create emmet editor
	var emmetEditor = (function(){
		var context,
			cacheContent,
			reverse = false;

		var whiteSpace = {
			" ": true,
			"\t": true,
			"\r": true,
			"\n": true
		};

		// Returns true if using tab character
		function useTabChar() {
			return (new Scintilla(context.handle)).Call("SCI_GETUSETABS", 0, 0);
		}

		// Returns tab width (or space length)
		function tabWidth() {
			return (new Scintilla(context.handle)).Call("SCI_GETTABWIDTH", 0, 0);
		}
		
		function scrollIntoView() {
			return (new Scintilla(context.handle)).Call("SCI_SCROLLCARET", 0, 0);
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
			var byteAnchor = context.byteAnchor,
				bytePos = context.bytePos;

			context.anchor = start;
			context.pos = end;
			
			if (value == "\t") {
				commandInsertTab();
			} else {
				context.selection = value;
			}

			context.byteAnchor = byteAnchor;
			context.bytePos = bytePos;

			cacheContent = null;
		}

		return {
			/**
			 * Setup underlying editor context. You should call this method
			 * <code>before</code> using any Zen Coding action.
			 * @param {Object} context
			 */
			setContext: function(ctx) {
				context = ctx;
				cacheContent = null;
				reverse = false;
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
				var start = context.anchor,
					end = context.pos;

				if (start > end) {
					reverse = true;
					var t = start;
					start = end;
					end = t;
				}

				return {
					start: start,
					end: end
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
				if (!end) {
					end = start;
				}
				if (reverse) {
					var t = start;
					start = end;
					end = t;
				}
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
				context.anchor = pos;
				context.pos = pos;
				scrollIntoView();
			},

			/**
			 * Returns content of current line
			 * @return {String}
			 */
			getCurrentLine: function() {
				return context.lines.get(context.line).text;
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
				if (end === undefined) {
					end = start === undefined ? this.getContent().length : start;
				}
				if (start === undefined) {
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
				if (cacheContent == null) {
					cacheContent = context.text || '';
				}
				return cacheContent;
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
					syntax = path.ext(this.getFilePath());
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
			},

			// Check if the selection is collapsed
			shouldExpand: function() {
				// collapsed
				if (context.bytePos != context.byteAnchor) {
					return false;
				}
				
				// on whitespace
				context.bytePos--;
				var ch = context.selection;
				context.bytePos++;
				if (whiteSpace[ch]) {
					return false;
				}
				
				// invalid lang
				if (settings.enableTabExpensionByFileType) {
					if (settings.enableTabExpensionUnder) {
						var lang = Editor.langs[Editor.currentView.lang];
						if (lang && settings.enableTabExpensionUnder[lang.toLowerCase()]) {
							return true;
						}
					}
					return false;
				}
				return true;
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
				if (typeof size == "function") {
					callback = size;
					size = null;
				}
				var bin = io.readBin(path, size);
				if (callback) {
					callback(bin == "", bin);
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
			locateFile: function(editorFile, fileName, done) {
				var folder = path.parent(editorFile),
					result;
				while (folder) {
					result = path.join(folder, fileName);
					if (path.exists(result)) {
            done(result);
						return;
					}
					folder = path.parent(folder);
				}
        done('');
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
				var m = (file || '').match(/\.([\w-]+)$/);
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
			emmetPrompt("Enter Abbreviation", function(abbr) {
        if (abbr) {
          emmet.htmlMatcher.cache(true);
          emmet.run(action_name, emmetEditor, abbr);
          emmet.htmlMatcher.cache(false);
        }
      });
		} else if (action_name == "expand_abbreviation_with_tab") {
			// Emmet's indentation style doesn't match notepad++'s.
			if (emmetEditor.shouldExpand()) {
				emmet.htmlMatcher.cache(true);
				emmet.run(action_name, emmetEditor);
				emmet.htmlMatcher.cache(false);
			} else {
				commandInsertTab();
			}
		} else {
			emmet.htmlMatcher.cache(true);
			emmet.run(action_name, emmetEditor);
			emmet.htmlMatcher.cache(false);
		}
	}

	// Construct menu helper
	function constructMenu(menu, list) {
    var keyMap = userData.keymap;
		list.forEach(function(item){
			var label = item.label || item.name;
			if (item.type == "submenu") {
				var subMenu = menu.addMenu({
					text: label
				});
				constructMenu(subMenu, item.items);
			} else if (item.type == "separator") {
				menu.addSeparator();
			} else {
				menu.addItem({
					text: label + (keyMap[item.name] ? "\t" + keyMap[item.name] : ""),
					cmd: function(){
						runAction(item.name);
					}
				});
			}
		});
	}

  if (userData.menu && userData.menu.length) {
    constructMenu(Editor.addMenu("Emmet"), userData.menu);
  }

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
  if (userData.keymap) {
    emmet.actions.getList().forEach(function(action){
      var userHotkey = userData.keymap[action.name];
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
  }
})();
