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
			js: {
				files: ["src/*.js"],
				tasks: ["default"]
			},
			grunt: {
				files: ["Gruntfile.js"]
			}
		},
		eslint: {
			target: ["src/*.js"]
		},
		copy: {
			main: {
				files: {
					expand: true,
					cwd: "src",
					src: ["*.js"],
					dest: "dist"
				}
			},
			lib: {
				files: {
					expand: true,
					cwd: "lib/emmet/lib",
					src: ["**"],
					dest: "dist/emmet"
				}
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks("grunt-bump");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-eslint");

	// Default task(s).
	grunt.registerTask("default", ["eslint", "copy"]);

};
