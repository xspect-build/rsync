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

`/.github/workflows/build-platform-packages.yml` 通过统一脚本完成下载与打包：

```bash
npm run release:pack
```

脚本会下载所有主流平台二进制，写入各平台子包 `bin/` 目录，并将各平台包与主包一起 `npm pack` 到 `dist/`。

## 本地发布

本地登录 npm 后可直接执行：

```bash
npm run release:publish
```

可选指定 tag：

```bash
npm run release:publish -- --tag=next
```
