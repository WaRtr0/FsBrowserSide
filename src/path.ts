import { FsError } from './errors.js';

export const PathUtils = {
    normalize(path: string): string {
        const parts = path.split('/');
        const resolved: string[] = [];

        for (const part of parts) {
            if (part === '' || part === '.') continue;
            if (part === '..') {
                if (resolved.length === 0) {
                    throw new FsError('INVALID_PATH', path, 'Path resolves above root');
                }
                resolved.pop();
            } else {
                resolved.push(part);
            }
        }

        return '/' + resolved.join('/');
    },

    segments(path: string): string[] {
        const normalized = PathUtils.normalize(path);
        if (normalized === '/') return [];
        return normalized.slice(1).split('/');
    },

    dirname(path: string): string {
        const normalized = PathUtils.normalize(path);
        const lastSlash = normalized.lastIndexOf('/');
        if (lastSlash <= 0) return '/';
        return normalized.slice(0, lastSlash);
    },

    basename(path: string): string {
        const normalized = PathUtils.normalize(path);
        if (normalized === '/') return '';
        const lastSlash = normalized.lastIndexOf('/');
        return normalized.slice(lastSlash + 1);
    },

    join(...parts: string[]): string {
        return PathUtils.normalize(parts.join('/'));
    },
} as const;
