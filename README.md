![GitHub](https://img.shields.io/github/license/WaRtr0/FsBrowserSide) ![GitHub top language](https://img.shields.io/github/languages/top/WaRtr0/FsBrowserSide) ![GitHub repo size](https://img.shields.io/github/repo-size/WaRtr0/FsBrowserSide) ![GitHub contributors](https://img.shields.io/github/contributors/WaRtr0/FsBrowserSide) ![GitHub repo directory count](https://img.shields.io/github/directory-file-count/WaRtr0/FsBrowserSide) ![GitHub last commit (branch)](https://img.shields.io/github/last-commit/WaRtr0/FsBrowserSide/master) ![GitHub Repo stars](https://img.shields.io/github/stars/WaRtr0/FsBrowserSide) ![GitHub watchers](https://img.shields.io/github/watchers/WaRtr0/FsBrowserSide) ![GitHub followers](https://img.shields.io/github/followers/WaRtr0) ![View counter](https://visitcount.itsvg.in/api?id=WaRtr0/fsbrowserside&label=Views&icon=5&pretty=false)

# Fs Browser Side

> [!warning]
> This library is currently under development and is **not recommended** for ***use*** in **production environments**!!! Contributions are welcome to improve its functionality and stability.

## Overview

`Fs Browser Side` is a library designed to bring **[NodeJS's FileSystem (FS)](https://nodejs.org/api/fs.html)** capabilities ___into___ the **client-side environment**, inspired by the robust and versatile [FS](https://nodejs.org/api/fs.html) module in NodeJS. This project aims to **simplify interactions** with the **[FileSystem API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) on the web**, providing a more accessible interface for managing files and directories within the client's browser. By leveraging this library, developers can perform file operations **similar** to those in a **server-side context**, within the **confines of the client's permissions and browser capabilities**.

## Features

- **FileSystem API Simplification:** Offers a simplified, user-friendly interface for the [FileSystem API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), making it easier to perform file operations on the client side.
- **Multi-Folder Management:** Allows the instantiation of multiple FS classes, enabling the management of multiple folders simultaneously.
- **NodeJS FS Commands Adaptation:** Implements a multitude of commands similar to NodeJS's FS module, adapted for browser compatibility.
- **Secure Folder Access:** Ensures secure access to the file system, requiring users to grant permission for reading and writing operations in selected folders.

## Compatibility

The library is designed with compatibility in mind; however, it's important to note the FileSystem API's **support varies across browsers**. Users may encounter **limitations based** on their **[browser's compatibility](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API#browser_compatibility)** **with** the **FileSystem API**.

## But what is it for?

But what use can it serve? These tasks can indeed be accomplished on the server side through simple upload and download operations...

Precisely, this allows you to **reduce server dependencies**! It enables users to perform complex file management tasks directly within their browser. This provides the opportunity to innovate web applications that are less reliant on a server, with better confidentiality...

**Here are some possibilities :**

- **Custom Content Management System:** Tailor and manage your digital content directly in the browser.
- **Browser-Based IDE:** Develop and test code entirely within your web browser.
- **Online Photoshop Alternative:** Edit images online with comprehensive tools.
- **Advanced Online Download Manager:** Or even a file backup and synchronization solution.
- **Client-Side Semi-Scraping Extension:** Extract and process web data on the fly.
- **Offline Cache System:** Access your files and work offline without a problem.
- **Photo Album Organizer:** Curate and manage your photo collections with ease.
