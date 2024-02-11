class FileSystem extends EventTarget {

    constructor() {
        super();
    }

    #arborescence = {
        name: '',
        access: null,
        children: [],
        length: 0
    };

    #fileSystem = null;
    #path = null;

    async getAccess() {
        this.#arborescence.access = await window.showDirectoryPicker();
        if (!this.#arborescence.access) return false;
        this.#fileSystem = this.#arborescence.access;
        this.#arborescence.length = 0;
        this.#arborescence.children = [];
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
                this.#arborescence.length++;
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
                this.#arborescence.length++;
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
            this.#fileSystem = this.#arborescence.access;
            return true;
        }
        const originalFileSystem = this.#fileSystem;
        const originalPath = this.#path;
        this.#fileSystem = this.#arborescence.access;
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
        let current = this.#arborescence;
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
        let file = typeof path == 'object' ? path : await this.#openFileSync(path, { create });
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
            this.#arborescence.length--;
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

    async #dirRecursive(path) {
        if (!this.#path && await this.getAccess() === false) return false;
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

    async readDirRecursive(path,callback) {
        if (!this.#path && await this.getAccess() === false) return false;
        if (callback && typeof callback === 'function'){
            this.addEventListener('error', (e) => {
                callback(e.detail, null);
            });
            this.addEventListener('data', (e) => {
                callback(false,e.data);
            });
            this.addEventListener('end', () => {
                callback(false,null);
            });
        }

        if (!await this.#accessPath(path)) {
            this.dispatchEvent(new CustomEvent('error', { detail: 'Access denied or path does not exist' }));
            return;
        }
        await this.#dirRecursive(path);
        this.dispatchEvent(new CustomEvent('end'));
    }
}

const fs = new FileSystem();

export default fs;
