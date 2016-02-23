require("lib/Scintilla.js");

var emmet = require("./emmet/emmet");
// var utils = require('./emmet/lib/utils/common');
// var editorUtils = require('./emmet/lib/utils/editor');
// var tabStops = require('emmet/assets/tabStops');

emmet.loadSystemSnippets();
emmet.loadCIU();

// User settings
var settings = new Settings(Editor.pluginConfigDir + "/emmet.settings.js");
var preference = readFile(Editor.pluginConfigDir + "/emmet.preference.json");
var snippets = readFile(Editor.pluginConfigDir + "/emmet.snippets.json");
var keyMap = readFile(Editor.pluginConfigDir + "/emmet.keymap.json");

if (preference) {
	emmet.loadPreferences(preference);
}

if (snippets) {
	emmet.loadSnippets(snippets);
}

try {
	keyMap = JSON.parse(keyMap);
} catch (err) {
	alert("Invalid keymap!");
	keyMap = {};
}

var zen_editor = (function(){
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

	/**
	 * Returns whitrespace padding of string
	 * @param {String} str String line
	 * @return {String}
	 */
	function getStringPadding(str) {
		return (str.match(/^(\s+)/) || [''])[0];
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

	/**
	 * Handle tab-stops (like $1 or ${1:label}) inside text: find first tab-stop,
	 * marks it as selection, remove the rest. If tab-stop wasn't found, search
	 * for caret placeholder and use it as selection
	 * @param {String} text
	 * @return {Array} Array with new text and selection indexes (['...', -1,-1]
	 * if there's no selection)
	 */
	 /*
	function handleTabStops(text) {
		var selection_len = 0,
			caret_placeholder = zen_coding.getCaretPlaceholder(),
			caret_pos = text.indexOf(caret_placeholder),
			placeholders = {};

		// find caret position
		if (caret_pos != -1) {
			text = text.split(caret_placeholder).join('');
		} else {
			caret_pos = text.length;
		}

		text = zen_coding.processTextBeforePaste(text,
			function(ch){ return ch; },
			function(i, num, val) {
				if (val) placeholders[num] = val;

				if (i < caret_pos) {
					caret_pos = i;
					if (val)
						selection_len = val.length;
				}

				return placeholders[num] || '';
			});

		return [text, caret_pos, caret_pos + selection_len];
	}
*/

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

			// var doc = this.editor.document;
			// start = this._posFromIndex(start);
			// end = this._posFromIndex(end);

			// var oldValue = doc.getRange(start, end);

			replaceRange(value, start, end);

			this.createSelection(firstTabStop.start, firstTabStop.end);
			// this._saveSelection(utils.splitByLines(value).length - utils.splitByLines(oldValue).length);
			// return value;


			/*
			var content = this.getContent(),
				caret_pos = this.getCaretPos(),
				caret_placeholder = zen_coding.getCaretPlaceholder(),
				has_start = typeof(start) !== 'undefined',
				has_end = typeof(end) !== 'undefined';

			// indent new value
			if (!no_indent)
				value = zen_coding.padString(value, getStringPadding(this.getCurrentLine()));

			// find new caret position
			var tabstop_res = handleTabStops(value);
			value = tabstop_res[0];

			start = start || 0;
			if (tabstop_res[1] !== -1) {
				tabstop_res[1] += start;
				tabstop_res[2] += start;
			} else {
				tabstop_res[1] = tabstop_res[2] = value.length + start;
			}

			try {
				if (!has_start && !has_end) {
	                start = 0;
	                end = content.length;
	            } else if (!has_end) {
	                end = start;
	            }

	            this.createSelection(start, end);
	            context.selection = value;
				this.createSelection(tabstop_res[1], tabstop_res[2]);
			} catch(e){}
			*/
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

			// if (!zen_coding.getResourceManager().hasSyntax(syntax))
				// syntax = 'html';

			if (syntax == 'html') {
				// get the context tag
				var result = emmet.htmlMatcher.tag(this.getContent(), caret_pos);
				if (result && result.open.name == "style") {
					if (result.open.range.end <= caret_pos && result.close.range.start >= caret_pos) {
						syntax = "css";
					}
				}
				/*
				if (pair && pair[0] && pair[0].type == 'tag' && pair[0].name.toLowerCase() == 'style') {
					// check that we're actually inside the tag
					if (pair[0].end <= caret_pos && pair[1].start >= caret_pos)
						syntax = 'css';
				}
				*/
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
			// return zen_coding.getVariable('profile') || 'xhtml';
			return null;
		},

		/**
		 * Ask user to enter something
		 * @param {String} title Dialog title
		 * @return {String} Entered data
		 * @since 0.65
		 */
		// FIXME: WTF a synchronized api in javascript?
		prompt: function(title) {
			return '';
		},

		/**
		 * Returns current selection
		 * @return {String}
		 * @since 0.65
		 */
		getSelection: function() {
			var sel = this.getSelectionRange();
			if (sel) {
				try {
					return this.getContent().substring(sel.start, sel.end);
				} catch(e) {}
			}

			return '';
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
/**
 * Zen Coding manager that runs actions
 * @param {String} action_name Action to call
 * @return {Boolean} Returns 'true' if action ran successfully
 */
function runAction(action_name) {
	zen_editor.setContext(Editor.currentView);
	if (action_name == 'wrap_with_abbreviation') {
		Dialog.prompt('Enter Abbreviation',"", function(abbr){
			if (abbr)
				emmet.run(action_name, zen_editor, abbr);
		});
	} else {
		return emmet.run(action_name, zen_editor);
	}
}

var zc_menu = Editor.addMenu("Emmet");

/**
 * Adds new Zen Coding menu item
 * @param {String} name Menu item name
 * @param {String} action Zen Coding action to call
 * @param {String} keystroke Keyboard shorcut for this item
 */
 /*
function addMenuItem(name, action, keystroke) {
	var menu_obj = {
		text: name + (keystroke ? '\t' + keystroke : ''),
		cmd: function() {
			zc_manager(action);
		},
		ctrl: false,
		alt: false,
		shift: false
	};

	if (keystroke) {
		var keys = keystroke.split('+');
		for (var i = 0, il = keys.length; i < il; i++) {
			var key = keys[i].toLowerCase();
			switch (key) {
				case 'shift':
				case 'alt':
				case 'ctrl':
					menu_obj[key] = true;
					break;
				default:
					menu_obj.key = key;
			}
		}

		addHotKey(menu_obj);
	}

	zc_menu.addItem(menu_obj);
}
*/

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

constructMenu(zc_menu, emmet.actions.getMenu());

function registHotkey() {
	emmet.actions.getList().forEach(function(action){
		var userHotkey = keyMap[action.name];
		if (!userHotkey) {
			return;
		}
		var keys = userHotkey.split("+");
		var cfg = {
			cmd: function() {
				runAction(action.name);
			};
		}
		var i;
		for (i = 0; i < keys.length; i++) {
			var token = keys[i].toLowerCase();
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

registHotkey();

/*
// init engine
addMenuItem('Expand Abbreviation', 'expand_abbreviation', '\t');
addMenuItem('Wrap with Abbreviation', 'wrap_with_abbreviation', 'Ctrl+Shift+A');
addMenuItem('Balance Tag', 'match_pair_outward', 'Ctrl+Shift+D');
addMenuItem('Next Edit Point', 'next_edit_point', 'Ctrl+Alt+]');
addMenuItem('Previous Edit Point', 'prev_edit_point', 'Ctrl+Alt+[');
addMenuItem('Go to Matching Pair', 'matching_pair', 'Ctrl+Alt+L');
addMenuItem('Merge Lines', 'merge_lines', 'Ctrl+Alt+M');
addMenuItem('Toggle Comment', 'toggle_comment', 'Alt+/');
addMenuItem('Split/Join Tag', 'split_join_tag', 'Ctrl+\'');
addMenuItem('Remove Tag', 'remove_tag', 'Ctrl+Shift+\'');

// v0.7
addMenuItem('Evaluate Math Expression', 'evaluate_math_expression', 'Ctrl+Y');

// don't know how up & down key codes should be written so I commented out this section
//addMenuItem('Increment number by 1', 'increment_number_by_1', 'Ctrl+Up');
//addMenuItem('Decrement number by 1', 'decrement_number_by_1', 'Ctrl+down');
//addMenuItem('Increment number by 0.1', 'increment_number_by_01', 'Alt+UP');
//addMenuItem('Decrement number by 0.1', 'decrement_number_by_01', 'Alt+DOWN');
//addMenuItem('Increment number by 10', 'increment_number_by_10', 'Ctrl+Alt+UP');
//addMenuItem('Decrement number by 10', 'decrement_number_by_10', 'Ctrl+Alt+DOWN');

addMenuItem('Select Next Item', 'select_next_item', 'Ctrl+.');
addMenuItem('Select Previous Item', 'select_previous_item', 'Ctrl+,');
addMenuItem('Reflect CSS Value', 'reflect_css_value', 'Ctrl+Shift+B');
*/
