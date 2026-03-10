import type { FsError } from './errors.js';

export interface DirEntry {
    name: string;
    type: 'file' | 'directory';
    path: string;
}

export interface WriteOptions {
    append?: boolean;
}

export interface MkdirOptions {
    recursive?: boolean;
}

export interface RmOptions {
    recursive?: boolean;
}

export type Callback<T = void> = (err: FsError | null, data?: T) => void;

export interface FsBrowserSideOptions {
    navigatorMode?: boolean;
    rootHandle?: FileSystemDirectoryHandle;
}
