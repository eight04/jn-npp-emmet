var emmet = require("./emmet/emmet");

var zen_editor = (function(){
	var context = null;
	
	/**
	 * Returns whitrespace padding of string
	 * @param {String} str String line
	 * @return {String}
	 */
	function getStringPadding(str) {
		return (str.match(/^(\s+)/) || [''])[0];
	}
	
	/**
	 * Handle tab-stops (like $1 or ${1:label}) inside text: find first tab-stop,
	 * marks it as selection, remove the rest. If tab-stop wasn't found, search
	 * for caret placeholder and use it as selection
	 * @param {String} text
	 * @return {Array} Array with new text and selection indexes (['...', -1,-1] 
	 * if there's no selection)
	 */
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
		replaceContent: function(value, start, end, no_indent) {
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
				
			if (!zen_coding.getResourceManager().hasSyntax(syntax))
				syntax = 'html';
			
			if (syntax == 'html') {
				// get the context tag
				var pair = zen_coding.html_matcher.getTags(this.getContent(), caret_pos);
				if (pair && pair[0] && pair[0].type == 'tag' && pair[0].name.toLowerCase() == 'style') {
					// check that we're actually inside the tag
					if (pair[0].end <= caret_pos && pair[1].start >= caret_pos)
						syntax = 'css';
				}
			}
			
			return syntax;
		},
		
		/**
		 * Returns current output profile name (@see zen_coding#setupProfile)
		 * @return {String}
		 */
		getProfileName: function() {
			return zen_coding.getVariable('profile') || 'xhtml';
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
function zc_manager(action_name) {
	zen_editor.setContext(Editor.currentView);
	if (action_name == 'wrap_with_abbreviation') {
		Dialog.prompt('Enter Abbreviation',"", function(abbr){
			if (abbr)
				zen_coding.runAction(action_name, zen_editor, abbr);
		});
	} else {
		return zen_coding.runAction(action_name, zen_editor);
	}
}

var zc_menu = Editor.addMenu("Zen Coding");

/**
 * Adds new Zen Coding menu item
 * @param {String} name Menu item name
 * @param {String} action Zen Coding action to call
 * @param {String} keystroke Keyboard shorcut for this item
 */
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

