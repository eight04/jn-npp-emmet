/* global module */

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		bump: {
			options: {
				files: ["package.json", "bower.json"],
				updateConfigs: ["pkg"],
				commitFiles: ["package.json", "bower.json"],
				pushTo: "origin"
			}
		},
		watch: {
			src: {
				files: ["src/**/*"],
				tasks: ["eslint", "copy"]
			},
			grunt: {
				files: ["Gruntfile.js"]
			}
		},
		eslint: {
			target: ["src/*.js"]
		},
		copy: {
			src: {
				expand: true,
				cwd: "src",
				src: ["**", "!emmet/emmet.js"],
				dest: "dist"
			},
			assets: {
				expand: true,
				cwd: "lib/emmet/lib",
				src: ["*.json"],
				dest: "dist/emmet"
			},
			lib: {
				expand: true,
				cwd: "lib",
				src: ["**", "!emmet/**"],
				dest: "dist"
			}
		},
		browserify: {
			emmet: {
				files: {
					"dist/emmet/emmet.js": ["src/emmet/emmet.js"]
				}
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks("grunt-bump");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks('grunt-browserify');

	// Default task(s).
	grunt.registerTask("default", ["eslint", "browserify", "copy"]);

};
