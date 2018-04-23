/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const neodoc = require("neodoc");

const args = neodoc.run(`Link the dist folder to Notepad++ plugin folder. You should execute this script under Admin privilege.

Usage: link-to-plugin [--clear]

Options:
  -c, --clear  Clear the link.`);

// find notepad++
const nppDir = (() => {
  const dirs = [
    "C:\\Program Files\\Notepad++",
    "C:\\Program Files (x86)\\Notepad++"
  ];
  for (const dir of dirs) {
    try {
      fs.accessSync(dir + "/notepad++.exe");
      return dir;
    } catch (err) {
      // pass
    }
  }
  throw new Error("Can't find notepad++.exe");
})();
const includesDir = `${nppDir}/plugins/jN/includes`;
const appName = require("./package.json").name.replace(/^jn-npp-/, "");
const files = [
  [`dist/${appName}.js`, `${includesDir}/${appName}.js`, "file"],
  [`dist/${appName}`, `${includesDir}/${appName}`, "dir"]
];

function unlink(file) {
  try {
    fs.unlinkSync(file);
    console.log(`Unlink "${file}"`);
  } catch (err) {
    if (err.code != "ENOENT") {
      throw err;
    }
  }
}

function link(from, to, type) {
  from = path.resolve(from);
  to = path.resolve(to);
  fs.symlinkSync(from, to, type);
  console.log(`Link from "${from}" to "${to}"`);
}

for (const [, to] of files) {
  unlink(to);
}
if (!args["--clear"]) {
  for (const args of files) {
    link(...args);
  }
}
