const jsLibs_Class = (() => { 'use strict';


class JSLibs
{

    get Require()
    { let self = this;
        return Require;
    }


    constructor()
    { let self = this;
        self._packages = {};
    }

    exists(packageName)
    {
        return packageName in self._packages;
    }

    exportModule(packageName, modulePath, moduleInitFn)
    { let self = this;
        if (!(packageName in self._packages))
            self._packages[packageName] = new Package(self, packageName);

        self._packages[packageName].addModule(modulePath, moduleInitFn);
    }

    importModule(packageName, modulePath)
    { let self = this;
        if (!(packageName in self._packages)) {
            throw new Error('Package `' + packageName + '` does not exist.');
        }

        return self._packages[packageName].importModule(modulePath);
    }

    require(packageName)
    { let self = this;
        let module = self.importModule(packageName, 'index');
        if (module === Module.DoesNotExist) {
            throw new Error('Module `' + packageName + '` (`' +
                    packageName + ':' + 'index' +
                    '`) does not exist.');
        }

        return module;
    }


    _parsePackagePath(package_path)
    { let self = this;
        return package_path;
    }

}


class Module
{

    get instanceModule()
    { let self = this;
        if (self._instanceModule === null) {
            let require = new Require(self._package.jsLibs, self._package.name,
                    self._path);
            self._instanceModule = {
                exports: {}, // Module.ExportNotImplemented,
            };

            self._initFn(require.fn, self._instanceModule, self._instanceModule.exports);

            if (self._instanceModule.exports === Module.ExportNotImplemented) {
                console.log(self._instanceModule);
                throw new Error('No `exports` found in module `' +
                        self._package.name + '/' + self._path + '`.');
            }
        }

        return self._instanceModule;
    }


    constructor(js_lib_package, modulePath, init_fn)
    { let self = this;
        self._package = js_lib_package;
        self._path = modulePath;
        self._initFn = init_fn;

        self._instanceModule = null;
    }

}
Object.defineProperties(Module, {

    DoesNotExists: { value:
    new class Module_DoesNotExist {

    }()},

    ExportNotImplemented: { value: {}, },

});


class Package
{

    constructor(jsLibs, packageName)
    { let self = this;
        self.jsLibs = jsLibs;
        self.name = packageName;

        self._modules = {};
    }

    addModule(modulePath, moduleInitFn)
    { let self = this;
        self._modules[modulePath] = new Module(self, modulePath, moduleInitFn);
    }

    importModule(modulePath)
    { let self = this;
        if (modulePath in self._modules)
            return self._modules[modulePath].instanceModule.exports;

        if ((modulePath + '.js') in self._modules)
            return self._modules[modulePath + '.js'].instanceModule.exports;

        if ((modulePath + '/index') in self._modules)
            return self._modules[modulePath + '/index'].instanceModule.exports;

        if ((modulePath + '/index.js') in self._modules)
            return self._modules[modulePath + '/index.js'].instanceModule.exports;

        return Module.DoesNotExist;
    }

}


class Require
{

    get fn()
    { let self = this;
        return self._fn;
    }


    constructor(jsLibs, packageName = null, current_path = null)
    { let self = this;
        self._packageName = packageName;
        self._currentPath_Array = null;

        self._fn = (import_path) => {
            let import_info = self._resolveImportInfo(import_path);

            let module = jsLibs.importModule(import_info.packageName,
                    import_info.modulePath);
            if (module === Module.DoesNotExist) {
                throw new Error('Module `' + import_path + '` (`' +
                        import_info.packageName + ':' + import_info.modulePath +
                        '`) does not exist.');
            }

            return module;
        };

        if (current_path !== null) {
            self._currentPath_Array = current_path.split('/');
            self._currentPath_Array.pop();
        }
    }


    _resolveImportInfo(import_path)
    { let self = this;
        let import_path_array = import_path.split('/');

        /* Import Package */
        if (import_path_array[0] !== '.' && import_path_array[0] !== '..') {
            return {
                packageName: import_path_array[0],
                modulePath: 'index',
            };
        }

        if (self._packageName === null)
            throw new Error('Cannot import module outside of package.');

        /* Import Module */
        let modulePath_array = self._currentPath_Array.slice();

        for (let i = 0; i < import_path_array.length; i++) {
            if (import_path_array[i] === '.')
                continue;

            if (import_path_array[i] === '..') {
                modulePath_array.pop();
                continue;
            }

            modulePath_array.push(import_path_array[i]);
        }

        if (modulePath_array.length === 0)
            modulePath_array.push('index');
        else if (modulePath_array[modulePath_array.length - 1] === '')
            modulePath_array[modulePath_array.length - 1] = 'index';

        return {
            packageName: self._packageName,
            modulePath: modulePath_array.join('/'),
        };
    }

}


return JSLibs;

})();

const jsLibs = new jsLibs_Class();
// const require = (new jsLibs.Require(jsLibs)).fn;
