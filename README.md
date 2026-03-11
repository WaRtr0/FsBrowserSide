![GitHub](https://img.shields.io/github/license/WaRtr0/FsBrowserSide) ![GitHub top language](https://img.shields.io/github/languages/top/WaRtr0/FsBrowserSide) ![GitHub repo size](https://img.shields.io/github/repo-size/WaRtr0/FsBrowserSide) ![GitHub contributors](https://img.shields.io/github/contributors/WaRtr0/FsBrowserSide) ![GitHub repo directory count](https://img.shields.io/github/directory-file-count/WaRtr0/FsBrowserSide) ![GitHub last commit (branch)](https://img.shields.io/github/last-commit/WaRtr0/FsBrowserSide/master) ![GitHub Repo stars](https://img.shields.io/github/stars/WaRtr0/FsBrowserSide) ![GitHub watchers](https://img.shields.io/github/watchers/WaRtr0/FsBrowserSide) ![GitHub followers](https://img.shields.io/github/followers/WaRtr0) ![View counter](https://visitcount.itsvg.in/api?id=WaRtr0/fsbrowserside&label=Views&icon=5&pretty=false)

# Fs Browser Side

## Overview

`Fs Browser Side` is a TypeScript library that brings **[Node.js FileSystem (fs)](https://nodejs.org/api/fs.html)** capabilities into the **client-side environment**, built on top of the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API). It provides a clean, promise-based interface for managing files and directories within the browser.

## Features

- **Promise-first API** — All methods return `Promise` by default, with optional error-first callbacks.
- **Stateless path resolution** — No mutable internal state; concurrent operations are safe.
- **Robust path handling** — Proper normalization with `.`, `..`, and `//` support.
- **Idiomatic errors** — `FsError` extends `Error` with typed error codes.
- **AsyncGenerator for recursive reads** — `readdirRecursive` yields entries lazily via `for await...of`.
- **Two access modes** — User-picked directory (`showDirectoryPicker`) or OPFS (`navigator.storage`).

## Installation

```bash
pnpm add fs-browser-side
```

## Quick Start

```typescript
import { FsBrowserSide } from 'fs-browser-side';

const fs = new FsBrowserSide();

// Request access to a user-selected directory
if (await fs.getAccess()) {
    // Create nested directories
    await fs.mkdir('/project/src', { recursive: true });

    // Write a text file
    await fs.writeFileText('/project/src/index.ts', 'console.log("hello");');

    // Read it back
    const content = await fs.readFileText('/project/src/index.ts');
    console.log(content); // 'console.log("hello");'

    // List directory contents
    const entries = await fs.readdir('/project/src');
    console.log(entries);
    // [{ name: 'index.ts', type: 'file', path: '/project/src/index.ts' }]
}
```

### OPFS Mode (Origin Private File System)

```typescript
const fs = new FsBrowserSide({ navigatorMode: true });
await fs.getAccess(); // No user prompt needed
```

## API Reference

### `new FsBrowserSide(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `navigatorMode` | `boolean` | `false` | Use OPFS instead of `showDirectoryPicker` |

### `getAccess(): Promise<boolean>`

Request file system access. Returns `true` on success.

### `readFile(path): Promise<ArrayBuffer>`

Read a file as an `ArrayBuffer`.

### `readFileText(path): Promise<string>`

Read a file as a UTF-8 string.

### `writeFile(path, data, options?): Promise<void>`

Write binary data to a file. Creates the file and parent directories if needed.

| Option | Type | Default | Description |
|---|---|---|---|
| `append` | `boolean` | `false` | Append to existing content |

### `writeFileText(path, data, options?): Promise<void>`

Write a string to a file. Same options as `writeFile`.

### `exists(path): Promise<boolean>`

Check if a file or directory exists at the given path.

### `mkdir(path, options?): Promise<void>`

Create a directory.

| Option | Type | Default | Description |
|---|---|---|---|
| `recursive` | `boolean` | `false` | Create parent directories as needed |

### `rmdir(path, options?): Promise<void>`

Remove a directory. Fails if non-empty unless `recursive` is `true`.

| Option | Type | Default | Description |
|---|---|---|---|
| `recursive` | `boolean` | `false` | Remove contents recursively |

### `rm(path, options?): Promise<void>`

Remove a file or directory entry.

| Option | Type | Default | Description |
|---|---|---|---|
| `recursive` | `boolean` | `false` | Remove directory contents recursively |

### `copyFile(src, dest): Promise<void>`

Copy a file from `src` to `dest`.

### `rename(src, dest): Promise<void>`

Move/rename a file (copy + remove).

### `readdir(path): Promise<DirEntry[]>`

List entries in a directory. Each `DirEntry` has `name`, `type` (`'file'` | `'directory'`), and `path`.

### `readdirRecursive(path): AsyncGenerator<DirEntry>`

Recursively yield all entries under a directory:

```typescript
for await (const entry of fs.readdirRecursive('/')) {
    console.log(entry.type, entry.path);
}
```

### Callback Style

Every method also accepts an error-first callback as last argument:

```typescript
fs.readFileText('/file.txt', (err, content) => {
    if (err) {
        console.error(err.code, err.path);
        return;
    }
    console.log(content);
});
```

## Error Handling

All errors are instances of `FsError` with a typed `code`:

```typescript
import { FsError } from 'fs-browser-side';

try {
    await fs.readFile('/missing.txt');
} catch (err) {
    if (err instanceof FsError) {
        console.log(err.code); // 'NOT_FOUND'
        console.log(err.path); // '/missing.txt'
    }
}
```

| Code | Description |
|---|---|
| `NO_ACCESS` | File system access not granted |
| `NOT_FOUND` | Path does not exist |
| `ALREADY_EXISTS` | Path already exists |
| `PERMISSION_DENIED` | Insufficient permissions |
| `INVALID_PATH` | Invalid path (e.g. resolves above root) |
| `NOT_A_DIRECTORY` | Expected a directory |
| `NOT_A_FILE` | Expected a file |
| `UNKNOWN` | Unexpected error |

## Path Utilities

```typescript
import { PathUtils } from 'fs-browser-side';

PathUtils.normalize('//a/./b/../c');  // '/a/c'
PathUtils.dirname('/a/b/c');          // '/a/b'
PathUtils.basename('/a/b/c');         // 'c'
PathUtils.join('/a', 'b', '../c');    // '/a/c'
PathUtils.segments('/a/b/c');         // ['a', 'b', 'c']
```

## Compatibility

The library requires browser support for the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API#browser_compatibility). OPFS mode (`navigatorMode: true`) has broader compatibility than `showDirectoryPicker`.

## Use Cases

- **Browser-Based IDE** — Read and write project files directly. [Demo](https://wartr0.github.io/mini-vscode/) [Github](https://github.com/WaRtr0/mini-Vscode)
- **Custom CMS** — Manage content files without a server.
- **Offline-first apps** — Persistent storage via OPFS.
- **Client-side scraping** — Save processed data to local files.
- **Photo/file organizer** — Manage user files in the browser.

## Contributing

You are completely free to contribute to this project! It would be my pleasure to review and accept your *Pull Requests* or *Issues* to improve this package.

## License

This project is licensed under the MIT License.
