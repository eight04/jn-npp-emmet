// bundle emmet-core.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import re from "rollup-plugin-re";

const file = "dist/emmet/emmet-core.js";
const plugins = [
  re({
    include: "**/emmet/lib/**/*",
    patterns: [{
      transform(code, id) {
        const match = code.match(/(?:^|\n)define\(function\(require, exports, module\) {([\s\S]+)}\);\s*$/);
        if (match) {
          return match[1]
            .replace(/^\treturn\s+/m, "module.exports = ")
            .replace(/\\\d{3}/g, match => {
              const octal = parseInt(match.slice(1), 8);
              return `\\x${octal.toString(16)}`;
            });
        }
      }
    }]
  }),
  resolve(),
  commonjs()
];

export default {
	input: 'bundle/emmet-core.js',
	output: {
    file,
    format: 'iife',
    name: 'emmet',
    sourcemap: false
  },
	plugins
};
