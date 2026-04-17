# rsync

通过 npm `optionalDependencies` 分发主流平台 `oc-rsync` 预编译产物（来源：`oferchen/rsync` `v0.6.0`）。

## 安装

```bash
npm install -g @xspect-build/rsync
```

主包会按平台安装对应可选依赖包：

- `@xspect-build/rsync-linux-x64`
- `@xspect-build/rsync-linux-arm64`
- `@xspect-build/rsync-darwin-x64`
- `@xspect-build/rsync-darwin-arm64`
- `@xspect-build/rsync-win32-x64`

## 使用

```bash
rsync --version
# 或
oc-rsync --version
```

## CI 打包说明

`/.github/workflows/build-platform-packages.yml` 会在 CI 中下载所有主流平台二进制，写入各平台子包 `bin/` 目录并执行 `npm pack`，用于后续分发。
