# rsync

通过 npm 安装主流平台的 `oc-rsync` 预编译产物（来源：`oferchen/rsync` `v0.6.0`）。

## 安装

```bash
npm install -g @xspect-build/rsync
```

安装时会根据当前平台自动下载：

- Linux x64: `oc-rsync-0.6.0-linux-x86_64-musl.tar.gz`
- Linux arm64: `oc-rsync-0.6.0-linux-aarch64-musl.tar.gz`
- macOS x64: `oc-rsync-0.6.0-darwin-x86_64.tar.gz`
- macOS arm64: `oc-rsync-0.6.0-darwin-aarch64.tar.gz`
- Windows x64: `oc-rsync-0.6.0-windows-x86_64.tar.gz`

## 使用

```bash
rsync --version
# 或
oc-rsync --version
```
