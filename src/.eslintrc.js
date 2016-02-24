module.export = {
	"env": {
		"node": true,
		browser: true
	},
	"rules": {
		"no-use-before-define": [2, "nofunc"],
		"semi": [2, "always"],
		"dot-notation": [2, {"allowKeywords": false}]
	},
	"extends": [
		"eslint:recommended"
	],
	"globals": {
		"Dialog": false,
		Editor: false,
		readFile: false,
		Scintilla: false
	}
};
