export type FsErrorCode =
    | 'NO_ACCESS'
    | 'NOT_FOUND'
    | 'ALREADY_EXISTS'
    | 'PERMISSION_DENIED'
    | 'INVALID_PATH'
    | 'NOT_A_DIRECTORY'
    | 'NOT_A_FILE'
    | 'NOT_EMPTY'
    | 'UNKNOWN';

const DEFAULT_MESSAGES: Record<FsErrorCode, string> = {
    NO_ACCESS: 'File system access has not been granted.',
    NOT_FOUND: 'The specified path does not exist.',
    ALREADY_EXISTS: 'The specified path already exists.',
    PERMISSION_DENIED: 'Insufficient permissions for this operation.',
    INVALID_PATH: 'The provided path is invalid.',
    NOT_A_DIRECTORY: 'The path does not point to a directory.',
    NOT_A_FILE: 'The path does not point to a file.',
    NOT_EMPTY: 'The directory is not empty.',
    UNKNOWN: 'An unknown error occurred.',
};

export class FsError extends Error {
    public readonly code: FsErrorCode;
    public readonly path: string;

    constructor(code: FsErrorCode, path: string, message?: string) {
        super(message ?? DEFAULT_MESSAGES[code]);
        this.name = 'FsError';
        this.code = code;
        this.path = path;
    }
}