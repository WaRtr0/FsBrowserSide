# Fs Browser Side

## Overview

`Fs Browser Side` is a library designed to bring **NodeJS's FileSystem (FS)** capabilities ___into___ the **client-side environment**, inspired by the robust and versatile FS module in NodeJS. This project aims to **simplify interactions** with the **FileSystem API on the web**, providing a more accessible interface for managing files and directories within the client's browser. By leveraging this library, developers can perform file operations **similar** to those in a **server-side context**, albeit within the **confines of the client's permissions and browser capabilities**.

## Features

- **FileSystem API Simplification:** Offers a simplified, user-friendly interface for the FileSystem API, making it easier to perform file operations on the client side.
- **Multi-Folder Management:** Allows the instantiation of multiple FS classes, enabling the management of multiple folders simultaneously.
- **NodeJS FS Commands Adaptation:** Implements a multitude of commands similar to NodeJS's FS module, adapted for browser compatibility.
- **Secure Folder Access:** Ensures secure access to the file system, requiring users to grant permission for reading and writing operations in selected folders.

## Compatibility

The library is designed with compatibility in mind; however, it's important to note the FileSystem API's **support varies across browsers**. Users may encounter **limitations based** on their **browser's compatibility** **with** the **FileSystem API**.
