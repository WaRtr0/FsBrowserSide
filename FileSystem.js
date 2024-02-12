/**
 * @file FsBrowserSide.js
 * @module FsBrowserSide
 * @description
 * This is a test file for the FileSystem class.
 */

/**
 * class FsBrowserSide = FS to client environment
 * adapted from `FileSystem API`
 * 
 * @param {Object} [options] - The options object.
 * @param {boolean} [options.debug] - Enable or disable debug mode. When enabled, the error method will log errors to the console.
 * @param {Function} [options.error] - The error function to use for logging errors. If not provided, the error method will log errors to the console.
 * @param {boolean} [options.navigatorMode] - Enable or disable navigator mode. When enabled, the file system will use the navigator.storage.getDirectory method to request access to the file system.
 * 
 * @property {boolean} navigatorMode - The mode of the file system. When set to true, the file system will use the navigator.storage.getDirectory method to request access to the file system.
 * @property {Object}  tree - The file system tree object.
 * @property {Object}  fileSystem - The file system object.
 * @property {string}  path - The current path of the file system.
 * @property {Object}  error - The error object.
 * 
 * @method getAccess - Request access to the file system.
 * @method openFileSync - Open a file synchronously.
 * @method openFile - Open a file asynchronously.
 * @method readFileSync - Read a file synchronously.
 * @method readFile - Read a file asynchronously.
 * @method writeFileSync - Write to a file synchronously.
 * @method writeFile - Write to a file asynchronously.
 * @method writeFileTextSync - Write text to a file synchronously.
 * @method readFileTextSync - Read text from a file synchronously.
 * @method readFileText - Read text from a file asynchronously.
 * @method existsSync - Check if a file or folder exists synchronously.
 * @method exists - Check if a file or folder exists asynchronously.
 * @method mkdirSync - Create a directory synchronously.
 * @method mkdir - Create a directory asynchronously.
 * @method rmdirSync - Remove a directory synchronously.
 * @method rmdir - Remove a directory asynchronously.
 * @method rmSync - Remove a file or directory synchronously.
 * @method rm - Remove a file or directory asynchronously.
 * @method copyFileSync - Copy a file synchronously.
 * @method copyFile - Copy a file asynchronously.
 * @method cp - Copy a file asynchronously.
 * @method renameSync - Rename a file or directory synchronously.
 * @method rename - Rename a file or directory asynchronously.
 * @method readdirSync - Read a directory synchronously.
 * @method readdirRecursive - Read a directory recursively.
 * 
 * @event error - The error event.
 * @event data - The data event.
 * @event end - The end event.
 * 
 * @returns {FSClient<EventTarget>}
 * 
 * @example
 * const fs = new FsClient({navigatorMode : true}); 
 * fs.getAccess().then(access => {
 *    if (access){
 *          fs.mkdir('/hi', {recursive : true}, dir => {
 *              if (dir) console.log('Directory created');
 *              fs.readdir('/', data => {
 *                  data.forEach(doc => {
 *                      console.log(`${doc.type} - ${doc.name}`);
 *                  });
 *              });
 *              fs.openFile('/hi/test.txt', {create : true}, async file => {
 *                  if (file){
 *                      fs.writeFileTextSync(file, "Hello World");
 *                      fs.readFileText('/hi/test.txt', content => {
 *                          console.log(`Content : ${content}`);
 *                      });
 *                  }
 *              });
 *          });
 *      }
 *  });
 * 
 * @example 
 * const fs = new FsBrowserSide({navigatorMode : true});
 * await fs.mkdirSync('/hi')
 *  await fs.openFile('/hi/test.txt', { create : true}, async (file) => {
 *      if(file){
 *          await fs.writeFileTextSync(file, "Hello World");
 *      }
 *  });
 *  fs.readdirRecursive('/',async (error, data) => {
 *      if (error || !data) return false;
 *      if (data?.type == 'file'){
 *          const content = await fs.readFileTextSync(data?.path);
 *          console.log(`File ${data?.name}\nContent :\n${content}`);
 *      }
 *      else{
 *          console.log(`Folder ${data?.name}`);
 *      }
 *  });
 * 
 */
class FsBrowserSide extends EventTarget {
    constructor({ debug, error , navigatorMode} = { navigatorMode : false, debug : true, error: undefined }) {
        super();
        if (!navigatorMode || navigatorMode == undefined) this.navigatorMode = false;
        else this.navigatorMode = true;
        if (debug || error != undefined) {
            if (error == undefined) this.#error._send = console.error;
            else this.#error._send = error;
        }
        else this.#error._send = false;
    }
    #tree = {
        name: '',
        access: null,
        children: [],
        length: 0
    };

    #fileSystem = null;
    #path = null;

    async getAccess() {
        if (!this.navigatorMode){
            try{
                this.#tree.access = await window.showDirectoryPicker();
            }
            catch(e){
                return false;
            }
        }
        else this.#tree.access = await navigator.storage.getDirectory();
        if (!this.#tree.access) return false;
        this.#fileSystem = this.#tree.access;
        this.#tree.length = 0;
        this.#tree.children = [];
        this.#path = "/";
        return true;
    }

    async #existInFolder(name, { create } = { create: false }) {
        const actualFolder = this.#getFolder(this.#path);
        if (!actualFolder) return false;
        try {
            const cache = await this.#fileSystem.getDirectoryHandle(name, { create: false });
            if (actualFolder.children.find(child => child.name === name) ? false : true) {
                actualFolder.children.push({
                    name: name,
                    access: cache,
                    children: []
                });
                this.#tree.length++;
            }
            return true;
        } catch (e) {
            if (create) {
                const cache = await this.#fileSystem.getDirectoryHandle(name, { create: true });
                actualFolder.children.push({
                    name: name,
                    access: cache,
                    children: []
                });
                this.#tree.length++;
                return true;
            }
            return false;
        }
    }

    #parsePath(path) {
        return path.split('/');
    }

    #setPath(array) {
        if (array[0] != "") array.unshift("");
        return array.join('/');
    }

    async #accessPath(path, { create } = { create: false }) {
        if (!this.#path && await this.getAccess() === false) return false;
        if (path === "/"){
            this.#path = "/";
            this.#fileSystem = this.#tree.access;
            return true;
        }
        const originalFileSystem = this.#fileSystem;
        const originalPath = this.#path;
        this.#fileSystem = this.#tree.access;
        const paths = this.#parsePath(path).slice(1);
        let currentPath = "";

        for (const segment of paths) {
            const result = await this.#existInFolder(segment, { create });
    
            if (!result) {
                this.#fileSystem = originalFileSystem;
                this.#path = originalPath;
                return false;
            }
            currentPath += "/" + segment;
            this.#path = currentPath;
            if (this.#getFolder(this.#path)?.access) {
                this.#fileSystem = this.#getFolder(this.#path).access;
            }
        }
        return true;
    }

    #getFolder(path) {
        const paths = this.#parsePath(path).slice(1);
        let current = this.#tree;
        if (path == "/" || paths.length == 0) return current;
        for (let path of paths) {
            current = current.children.find(child => child.name === path);
            if (!current) return null;
        }
        return current;
    }

    async #openFileSync(path, { create } = { create: false }) {
        if (!this.#path && await this.getAccess() === false) return false;
        let paths = this.#parsePath(path);
        if (paths.length < 2) return false;
        if (await this.#accessPath(this.#setPath(paths.slice(0, paths.length - 1)))) {
            return this.#fileSystem.getFileHandle(paths.pop(), { create })
        }
        return false;
    }

    openFile(path, { create } = { create: false }, callback) {
        this.#openFileSync(path, { create }).then(file => {
            callback(file);
        });
    }

    async readFileSync(path) {
        if (!this.#path && await this.getAccess() === false) return false;
        let file = typeof path == 'object' ? path : await this.#openFileSync(path);
        if (!file) return null;
        const contents = await file.getFile();
        return await contents.arrayBuffer();
    }

    readFile(path, callback) {
        this.readFileSync(path).then
        (contents => {
            callback(contents);
        });
    }

    async writeFileSync(path, data, { r } = { r: 'w' }) {
        if (!this.#path && await this.getAccess() === false) return false;
        if (typeof data === 'object') data = new Uint8Array(data);
        let file = typeof path == 'object' ? path : await this.#openFileSync(path, { create : true});
        if (!file) return false;
        if (r === 'a') {
            const contents = await file.getFile();
            const blob = await contents.arrayBuffer();
            data = new Uint8Array([...new Uint8Array(blob), ...new TextEncoder().encode(data)]);
        }
        const writable = await file.createWritable();
        await writable.write(data);
        await writable.close();
        return true;
    }

    async close() {return true;}

    writeFile(path, data, callback, { r } = { r: 'w' }) {
        this.writeFileSync(path, data, {r}).then(exists => {
            callback(exists);
        });
    }

    async writeFileTextSync(path, data, { r } = { r: 'w' }) {
        if (!this.#path && await this.getAccess() === false) return false;
        let file = typeof path == 'object' ? path : await this.#openFileSync(path , { create : true});
        if (!file) return false;
        if (r === 'a') {
            const contents = await file.getFile();
            const blob = await contents.arrayBuffer();
            data = new Uint8Array([...new Uint8Array(blob), ...new TextEncoder().encode(data)]);
        }
        const writable = await file.createWritable();
        await writable.write(data);
        await writable.close();
        return true;
    }

    async readFileTextSync(path) {
        if (!this.#path && await this.getAccess() === false) return false;
        let file = typeof path == 'object' ? path : await this.#openFileSync(path
        );
        if (!file) return null;
        const contents = await file.getFile();
        return await contents.text();
    }

    readFileText(path, callback) {
        this.readFileTextSync(path).then(contents => {
            callback(contents);
        });
    }

    writeFileText(path, data, callback, { r } = { r: 'w' }) {
        this.writeFileTextSync(path, data, r).then(exists => {
            callback(exists);
        });
    }
    async existsSync(path) {
        return await this.#accessPath(path);
    }

    exists(path, callback) {
        this.existsSync(path).then(exists => {
            callback(exists);
        });
    }

    async mkdirSync(path, { recursive } = { recursive: false }) {
        if (!this.#path && await this.getAccess() === false) return false;
        let paths = this.#parsePath(path);
        this.#path = '/';
        if (paths.length > 2 && recursive) return await this.#accessPath(path, { create: true });
        if (await this.#accessPath(this.#setPath(paths.slice(0, paths.length - 1))))
        {
            return await this.#accessPath(path, { create: true });
        }
        return false;
    }

    mkdir(path, { recursive } = { recursive: false }, callback) {
        this.mkdirSync(path, { recursive }).then(exists => {
            callback(exists);
        });
    }

    async rmdirSync(path, { recursive } = { recursive: false }) {
        if (!this.#path && await this.getAccess() === false) return false;
        if (await this.#accessPath(path)) {
            const folder = this.#getFolder(this.#path);
            if (recursive) folder.access.remove({recursive:true});
            else {
                if (folder.children.length > 0) return false;
                try {
                    folder.access.remove();
                }
                catch (e) {
                    return false;
                }
            }
            this.#tree.length--;
            return true;
        }
        return false;
    }

    rmdir(path, { recursive } = { recursive: false }, callback) {
        this.rmdirSync(path, { recursive }).then(exists => {
            callback(exists);
        });
    }

    async rmSync(path, { recursive } = { recursive: false }){ return this.rmdirSync(path, { recursive }); }
    rm(path, { recursive } = { recursive: false }, callback) { return this.rmdir(path, { recursive }, callback); }

    async copyFileSync(path, newPath) {
        if (!this.#path && await this.getAccess() === false) return false;
        const file = await this.#openFileSync(path);
        if (!file) return false;  
        const newFile = await this.#openFileSync(newPath, { create: true });
        if (!newFile) return false;  
        const contents = await file.getFile();
        const blob = await contents.arrayBuffer();
        const writable = await newFile.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
    }

    copyFile(path, newPath, callback) {
        this.copyFileSync(path, newPath
        ).then(exists => {
            callback(exists);
        });
    }

    cp(path, callback) {
        this.copyFile(path, callback);
    }

    async renameSync(path, newPath) {
        if (this.copyFileSync(path, newPath)) return this.rmSync(path);
        return false;
    }

    rename(path, newPath, callback) {
        this.renameSync(path, newPath).then(exists => {
            callback(exists);
        });
    }

    async readdirSync(path) {
        if (!this.#path && await this.getAccess() === false) return false;
        if (await this.#accessPath(path)) {
            const result = [];
            for await (const [name, handle] of this.#fileSystem.entries()) {
                result.push({name, type:handle.kind, path: path == "/" ? "/" + name : path + "/" + name});
            }
            return result;
        }
        return false;
    }

    readdir(path, callback) {
        this.readdirSync(path).then
        (contents => {
            callback(contents);
        });
    }

    /**
     * Read a directory executed by `readdirRecursive(path)`
     * 
     * @async
     * @param {string} path __Absolute Path__
     * @returns 
     */
    async #dirRecursive(path) {
        if (!this.#path && await this.getAccess() === false) return this.#error._command('access','dirRecursive');
        if (await this.#accessPath(path)) {
            for await (const [name, handle] of this.#fileSystem.entries()) {
                this.#accessPath("/");
                this.dispatchEvent(new CustomEvent('data',{detail:{
                    name,
                    type : handle.kind,
                    path: path == "/" ? "/" + name : path + "/" + name
                }}));
                if (handle.kind === "directory") await this.#dirRecursive(path == "/" ? "/" + name : path + "/" + name);
            }
            return false;
        }
        return true;
    }

    /**
     * Read a directory recursively
     * execute `dirRecursive(path)`
     * 
     * @async
     * @param {string} path __Absolute Path__
     * @param {RequestCallback} callback (`error` : `Object` | `boolean`, `data` : `Object` | `null`)
     * @returns {Promise<boolean>}
     */
    async readdirRecursive(path,callback) {
        if (!this.#path && await this.getAccess() === false) return this.#error._command('access','readdirRecursive', new Error().stack);
        if (callback && typeof callback === 'function'){
            this.addEventListener('error', (e) => {
                callback(e.detail, null);
                this.#error._command(e.detail.name, e.detail.funcName, new Error().stack);
            });
            this.addEventListener('data', (e) => {
                callback(false,e.detail);
            });
            this.addEventListener('end', () => {
                callback(false,null);
            });
        }
        else return false;

        if (!await this.#accessPath(path)) {
            this.dispatchEvent(new CustomEvent('error', { detail: {name : 'notExist', funcName : 'readdirRecursive' }}));
            return false;
        }
        await this.#dirRecursive(path);
        this.dispatchEvent(new CustomEvent('end'));
        return true;
    }

    /**
     * Object for error handling
     * 
     * @property {string}   access
     * @property {string}   notExist
     * @property {string}   read
     * @property {string}   write
     * @property {string}   delete
     * @property {string}   mkdir
     * @property {string}   invalidPath
     * @property {string}   permission
     * @property {string}   fileFormat
     * @property {string}   diskSpace
     * @property {string}   conflict
     * @property {Function} _send - The function used for logging errors, defaulting to `console.error`.
     * @property {string}   _return - Controls the return type of the `_command` method; when set to 'boolean', it returns `false`, otherwise returns an error object.
     * 
     * @method
     * _command Handles the construction and logging of error objects based on the provided error code and function name.
     * @param {string} e - The error code, which corresponds to one of the object's properties.
     * @param {string} funcName - The name of the function where the error occurred.
     * @param {string} [stack='...'] - The error stack trace.
     * @returns {boolean|Object} Returns `false` if `_return` is set to 'boolean', otherwise returns an error object with details of the error.
     */
    #error = {
        'access' : 'The authorization request via the “getAccess()” function was not authorized or no folder was selected.',
        'notExist' : 'Path does not exist',
        'read' : 'Error reading the file. The file might not exist, or an issue occurred while reading.',
        'write' : 'Error writing to the file. There might be an issue with file permissions or disk space.',
        'delete' : 'Error deleting the file or directory. It might be in use or protected.',
        'mkdir' : 'Error creating the directory. There might be an issue with permissions or the directory already exists.',
        'invalidPath' : 'The provided path is invalid or contains illegal characters.',
        'permission' : 'Insufficient permissions to perform the operation on the specified file or directory.',
        'fileFormat' : 'Insufficient disk space to complete the operation.',
        'diskSpace' : 'Unsupported file format or file is corrupted.',
        'conflict' : 'Operation resulted in a conflict, such as attempting to create a file that already exists without overwrite permission.',
        '_send' : console.error,
        '_return' : 'boolean',
        '_command' : function (e, funcName, stack = '...'){
            if (e.startsWith('_')) e = 'Error';
            const error = {
                "type" : 'error',
                "name" : e || 'Error',
                "funcName" : funcName || '',
                "details" : this?.[e] || '',
                stack
            };
            if (!this._send || typeof this._send != 'function'){
                if (this._return == 'boolean') return false;
                return error;
            }
            this._send(`[${error.name}] - ${error.funcName} - ${error.details}\nStack trace: ${error.stack}`);
            if (this._return == 'boolean') return false;
            return error;
        }
    }
}

const fs = new FsBrowserSide();
