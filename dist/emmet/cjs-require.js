/* global Editor ActiveXObject readFile System */

/* global cjsRequireFactory: true */
cjsRequireFactory = typeof cjsRequireFactory != "undefined" ? cjsRequireFactory : function() {
  var PLUGIN_DIR = Editor.nppDir + "/Plugins/jN";
  var cache = {};
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  function factory(importer) {
    var importerDir = fso.GetFile(importer).ParentFolder.Path;
    function requireFunction(importee) {
      var file = fso.GetFile(resolvePath(importee)).Path;
      
      if (!cache[file]) {
        // prevent circular deps
        cache[file] = {exports: {}};
        
        // prepare env
        var _require = cjsRequireFactory.require;
        var _module = cjsRequireFactory.module;
        cjsRequireFactory.require = cjsRequireFactory(file);
        cjsRequireFactory.module = cache[file];
        
        try {
          // load module
          var content = readFile(file, "UTF-8");
          if (/\.json$/i.test(file)) {
            cjsRequireFactory.module.exports = JSON.parse(content);
          } else {
            System.addScript(
              "(function(require, module, exports) {" + content + "})(cjsRequireFactory.require, cjsRequireFactory.module, cjsRequireFactory.module.exports)",
              file
            );
          }
        } catch (err) {
          delete cache[file];
          throw err;
        } finally {
          // cache
          cjsRequireFactory.require = _require;
          cjsRequireFactory.module = _module;
        }
      }
      
      return cache[file].exports;
      
      function resolveExt(path) {
        if (fso.FileExists(path)) {
          return path;
        }
        if (fso.FileExists(path + ".js")) {
          return path + ".js";
        }
        if (fso.FileExists(path + "/index.js")) {
          return path + "/index.js";
        }
      }
      
      function resolvePath(path) {
        var resolved;
        if (path[0] == ".") {
          resolved = resolveExt(importerDir + "/" + path);
        } else if (/^(\w+:)?[\\/]/.test(path)) {
          resolved = resolveExt(path);
        } else {
          resolved = resolveExt(PLUGIN_DIR + "/" + path);
        }
        if (!resolved) {
          throw new Error("Can't resolve importee: " + path + "\nimporter: " + importer);
        }
        return resolved;
      }
    }
    requireFunction.cache = cache;
    return requireFunction;
  }
  return factory;
}();
