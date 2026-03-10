import { FsError } from './errors.js';
import { PathUtils } from './path.js';
import type {
    DirEntry,
    WriteOptions,
    MkdirOptions,
    RmOptions,
    Callback,
    FsBrowserSideOptions,
} from './types.js';

type AnyOptions = WriteOptions | MkdirOptions | RmOptions;

function parseOverload<O extends AnyOptions>(
    optionsOrCb?: O | Callback,
    callback?: Callback,
): { opts: O; cb: Callback | undefined } {
    if (typeof optionsOrCb === 'function') {
        return { opts: {} as O, cb: optionsOrCb };
    }
    return { opts: (optionsOrCb ?? {}) as O, cb: callback };
}

function toUint8Array(data: BufferSource): Uint8Array {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export class FsBrowserSide {
    public readonly navigatorMode: boolean;
    private rootHandle: FileSystemDirectoryHandle | null = null;

    constructor(options: FsBrowserSideOptions = {}) {
        this.navigatorMode = options.navigatorMode ?? false;
        if (options.rootHandle) {
            this.rootHandle = options.rootHandle;
        }
    }

    // -- Access ---------------------------------------------------------------

    async getAccess(): Promise<boolean> {
        if (this.rootHandle) return true;
        try {
            if (this.navigatorMode) {
                this.rootHandle = await navigator.storage.getDirectory();
            } else {
                this.rootHandle = await (window as any).showDirectoryPicker();
            }
            return this.rootHandle !== null;
        } catch {
            return false;
        }
    }

    // -- Private helpers ------------------------------------------------------

    private ensureAccess(): FileSystemDirectoryHandle {
        if (!this.rootHandle) {
            throw new FsError('NO_ACCESS', '/');
        }
        return this.rootHandle;
    }

    private async resolveDirHandle(
        path: string,
        create = false,
    ): Promise<FileSystemDirectoryHandle> {
        const root = this.ensureAccess();
        const segs = PathUtils.segments(path);
        let current = root;
        for (const seg of segs) {
            try {
                current = await current.getDirectoryHandle(seg, { create });
            } catch {
                throw new FsError('NOT_FOUND', path);
            }
        }
        return current;
    }

    private async resolveFileHandle(
        path: string,
        create = false,
    ): Promise<FileSystemFileHandle> {
        const normalized = PathUtils.normalize(path);
        const dir = PathUtils.dirname(normalized);
        const name = PathUtils.basename(normalized);
        if (!name) throw new FsError('INVALID_PATH', path);

        const parentHandle = await this.resolveDirHandle(dir, create);

        try {
            return await parentHandle.getFileHandle(name, { create });
        } catch {
            throw new FsError(create ? 'UNKNOWN' : 'NOT_FOUND', path);
        }
    }

    private dispatchWork<T>(
        path: string,
        work: () => Promise<T>,
        cb: Callback<T> | undefined,
    ): Promise<T> | void {
        if (cb) {
            work().then(
                (result) => cb(null, result),
                (err) => cb(err instanceof FsError ? err : new FsError('UNKNOWN', path)),
            );
            return;
        }
        return work();
    }

    private resolveParent(path: string): { parentPath: string; name: string } {
        const normalized = PathUtils.normalize(path);
        const name = PathUtils.basename(normalized);
        if (!name) throw new FsError('INVALID_PATH', path);
        return { parentPath: PathUtils.dirname(normalized), name };
    }

    // -- readFile -------------------------------------------------------------

    readFile(path: string): Promise<ArrayBuffer>;
    readFile(path: string, callback: Callback<ArrayBuffer>): void;
    readFile(path: string, callback?: Callback<ArrayBuffer>): Promise<ArrayBuffer> | void {
        const work = async (): Promise<ArrayBuffer> => {
            const handle = await this.resolveFileHandle(path);
            const file = await handle.getFile();
            return file.arrayBuffer();
        };
        return this.dispatchWork(path, work, callback);
    }

    // -- readFileText ---------------------------------------------------------

    readFileText(path: string): Promise<string>;
    readFileText(path: string, callback: Callback<string>): void;
    readFileText(path: string, callback?: Callback<string>): Promise<string> | void {
        const work = async (): Promise<string> => {
            const handle = await this.resolveFileHandle(path);
            const file = await handle.getFile();
            return file.text();
        };
        return this.dispatchWork(path, work, callback);
    }

    // -- writeFile ------------------------------------------------------------

    writeFile(path: string, data: BufferSource): Promise<void>;
    writeFile(path: string, data: BufferSource, options: WriteOptions): Promise<void>;
    writeFile(path: string, data: BufferSource, callback: Callback): void;
    writeFile(
        path: string,
        data: BufferSource,
        optionsOrCb?: WriteOptions | Callback,
        callback?: Callback,
    ): Promise<void> | void {
        const { opts, cb } = parseOverload<WriteOptions>(optionsOrCb, callback);

        const work = async (): Promise<void> => {
            const handle = await this.resolveFileHandle(path, true);
            let finalData: BufferSource = data;

            if (opts.append) {
                const prev = toUint8Array(await (await handle.getFile()).arrayBuffer());
                const next = toUint8Array(data);
                const merged = new Uint8Array(prev.length + next.length);
                merged.set(prev);
                merged.set(next, prev.length);
                finalData = merged;
            }

            const writable = await handle.createWritable();
            await writable.write(finalData);
            await writable.close();
        };

        return this.dispatchWork(path, work, cb);
    }

    // -- writeFileText --------------------------------------------------------

    writeFileText(path: string, data: string): Promise<void>;
    writeFileText(path: string, data: string, options: WriteOptions): Promise<void>;
    writeFileText(path: string, data: string, callback: Callback): void;
    writeFileText(
        path: string,
        data: string,
        optionsOrCb?: WriteOptions | Callback,
        callback?: Callback,
    ): Promise<void> | void {
        const { opts, cb } = parseOverload<WriteOptions>(optionsOrCb, callback);

        const work = async (): Promise<void> => {
            const handle = await this.resolveFileHandle(path, true);

            let finalData = data;
            if (opts.append) {
                const prev = await (await handle.getFile()).text();
                finalData = prev + data;
            }

            const writable = await handle.createWritable();
            await writable.write(finalData);
            await writable.close();
        };

        return this.dispatchWork(path, work, cb);
    }

    // -- exists ---------------------------------------------------------------

    exists(path: string): Promise<boolean>;
    exists(path: string, callback: Callback<boolean>): void;
    exists(path: string, callback?: Callback<boolean>): Promise<boolean> | void {
        const work = async (): Promise<boolean> => {
            this.ensureAccess();
            const normalized = PathUtils.normalize(path);
            const segs = PathUtils.segments(normalized);

            if (segs.length === 0) return true;

            const { parentPath, name } = this.resolveParent(path);
            let parentHandle: FileSystemDirectoryHandle;

            try {
                parentHandle = await this.resolveDirHandle(parentPath);
            } catch {
                return false;
            }

            try {
                await parentHandle.getFileHandle(name);
                return true;
            } catch { /* not a file — try directory */ }

            try {
                await parentHandle.getDirectoryHandle(name);
                return true;
            } catch {
                return false;
            }
        };

        return this.dispatchWork(path, work, callback);
    }

    // -- mkdir ----------------------------------------------------------------

    mkdir(path: string): Promise<void>;
    mkdir(path: string, options: MkdirOptions): Promise<void>;
    mkdir(path: string, callback: Callback): void;
    mkdir(
        path: string,
        optionsOrCb?: MkdirOptions | Callback,
        callback?: Callback,
    ): Promise<void> | void {
        const { opts, cb } = parseOverload<MkdirOptions>(optionsOrCb, callback);

        const work = async (): Promise<void> => {
            const normalized = PathUtils.normalize(path);

            if (opts.recursive) {
                await this.resolveDirHandle(normalized, true);
                return;
            }

            const { parentPath, name } = this.resolveParent(path);
            const parentHandle = await this.resolveDirHandle(parentPath);
            await parentHandle.getDirectoryHandle(name, { create: true });
        };

        return this.dispatchWork(path, work, cb);
    }

    // -- rmdir ----------------------------------------------------------------

    rmdir(path: string): Promise<void>;
    rmdir(path: string, options: RmOptions): Promise<void>;
    rmdir(path: string, callback: Callback): void;
    rmdir(
        path: string,
        optionsOrCb?: RmOptions | Callback,
        callback?: Callback,
    ): Promise<void> | void {
        const { opts, cb } = parseOverload<RmOptions>(optionsOrCb, callback);

        const work = async (): Promise<void> => {
            const { parentPath, name } = this.resolveParent(path);
            const parentHandle = await this.resolveDirHandle(parentPath);

            if (!opts.recursive) {
                const targetHandle = await parentHandle.getDirectoryHandle(name);
                // @ts-expect-error entries() exists on FileSystemDirectoryHandle
                for await (const _ of targetHandle.entries()) {
                    throw new FsError('NOT_EMPTY', path);
                }
            }

            await parentHandle.removeEntry(name, { recursive: opts.recursive ?? false });
        };

        return this.dispatchWork(path, work, cb);
    }

    // -- rm -------------------------------------------------------------------

    rm(path: string): Promise<void>;
    rm(path: string, options: RmOptions): Promise<void>;
    rm(path: string, callback: Callback): void;
    rm(
        path: string,
        optionsOrCb?: RmOptions | Callback,
        callback?: Callback,
    ): Promise<void> | void {
        const { opts, cb } = parseOverload<RmOptions>(optionsOrCb, callback);

        const work = async (): Promise<void> => {
            const { parentPath, name } = this.resolveParent(path);
            const parentHandle = await this.resolveDirHandle(parentPath);
            await parentHandle.removeEntry(name, { recursive: opts.recursive ?? false });
        };

        return this.dispatchWork(path, work, cb);
    }

    // -- copyFile -------------------------------------------------------------

    copyFile(src: string, dest: string): Promise<void>;
    copyFile(src: string, dest: string, callback: Callback): void;
    copyFile(src: string, dest: string, callback?: Callback): Promise<void> | void {
        const work = async (): Promise<void> => {
            const srcHandle = await this.resolveFileHandle(src);
            const destHandle = await this.resolveFileHandle(dest, true);

            const buffer = await (await srcHandle.getFile()).arrayBuffer();
            const writable = await destHandle.createWritable();
            await writable.write(buffer);
            await writable.close();
        };

        return this.dispatchWork(src, work, callback);
    }

    // -- rename ---------------------------------------------------------------

    rename(src: string, dest: string): Promise<void>;
    rename(src: string, dest: string, callback: Callback): void;
    rename(src: string, dest: string, callback?: Callback): Promise<void> | void {
        const work = async (): Promise<void> => {
            await this.copyFile(src, dest);
            await this.rm(src);
        };

        return this.dispatchWork(src, work, callback);
    }

    // -- readdir --------------------------------------------------------------

    readdir(path: string): Promise<DirEntry[]>;
    readdir(path: string, callback: Callback<DirEntry[]>): void;
    readdir(path: string, callback?: Callback<DirEntry[]>): Promise<DirEntry[]> | void {
        const work = async (): Promise<DirEntry[]> => {
            const normalized = PathUtils.normalize(path);
            const dirHandle = await this.resolveDirHandle(normalized);
            const entries: DirEntry[] = [];

            // @ts-expect-error entries() exists on FileSystemDirectoryHandle
            for await (const [name, handle] of dirHandle.entries()) {
                entries.push({
                    name,
                    type: handle.kind as 'file' | 'directory',
                    path: PathUtils.join(normalized, name),
                });
            }

            return entries;
        };

        return this.dispatchWork(path, work, callback);
    }

    // -- readdirRecursive -----------------------------------------------------

    async *readdirRecursive(path: string): AsyncGenerator<DirEntry> {
        const normalized = PathUtils.normalize(path);
        const dirHandle = await this.resolveDirHandle(normalized);

        // @ts-expect-error entries() exists on FileSystemDirectoryHandle
        for await (const [name, handle] of dirHandle.entries()) {
            const entryPath = PathUtils.join(normalized, name);
            const entry: DirEntry = {
                name,
                type: handle.kind as 'file' | 'directory',
                path: entryPath,
            };

            yield entry;

            if (handle.kind === 'directory') {
                yield* this.readdirRecursive(entryPath);
            }
        }
    }
}
