# Niri 液态玻璃

## 效果图

1.

  <img width="1920" height="1080" alt="截图 2026-07-02 00-06-33" src="https://github.com/user-attachments/assets/a10b40c7-b147-4dfa-8208-28ebb4003cfc" />

2.

<img width="1920" height="1080" alt="截图 2026-06-30 12-31-50" src="https://github.com/user-attachments/assets/8cad6485-b685-4bc9-b22e-8cf7801cd15a" />

3.

<img width="1920" height="1080" alt="截图 2026-06-30 12-32-48" src="https://github.com/user-attachments/assets/fccc46f0-9cda-488b-b0e1-5939d36676cf" />

4.

<img width="1920" height="1080" alt="截图 2026-06-30 12-34-48" src="https://github.com/user-attachments/assets/ff3f0d17-3bf1-42e8-9660-e291189321f9" />

5.

<img width="1920" height="1080" alt="截图 2026-06-30 12-40-40" src="https://github.com/user-attachments/assets/eaeda5ef-1fe3-4e51-8466-10e461240021" />

## 文件

### 着色器(Shader)

- `src/render_helpers/shaders/clipped_surface.frag` - 液态玻璃主效果着色器(基于 [kwin-effects-glass](https://github.com/4v3ngR/kwin-effects-glass))

### Rust(渲染)

- `src/render_helpers/liquid_glass.rs` - `LiquidGlassOptions` 结构体,定义效果参数
- `src/render_helpers/background_effect.rs` - 液态玻璃与背景效果的集成
- `src/render_helpers/framebuffer_effect.rs` - 着色器 uniform 传递(窗口)
- `src/render_helpers/xray.rs` - 着色器 uniform 传递(xray)
- `src/render_helpers/shaders/mod.rs` - 着色器编译时的 uniform 注册
- `src/render_helpers/mod.rs` - liquid_glass 模块声明

### Niri 配置

- `config.kdl` - 启用了液态玻璃的示例配置

## 如何使用

### Nix / NixOS(flake)

本仓库自带 flake,基于匹配的上游 niri 版本(pin 在 rev `49fc611`,niri 26.04)打上液态玻璃补丁。无需手动复制文件或跑 `install.sh`。

快速试用(不安装):

```bash
nix run github:zaroutt/Niri-glass          # 跑合成器
nix shell github:zaroutt/Niri-glass        # 把 niri-glass 加进 shell
nix develop github:zaroutt/Niri-glass      # 开发 shell(rust + niri 编译依赖)
nix build  github:zaroutt/Niri-glass       # 编译,产物在 ./result
```

NixOS(flake),复用上游 niri 的 session / portal / polkit 接线:

```nix
{
  inputs.niri-glass.url = "github:zaroutt/Niri-glass";

  # in your nixosConfiguration modules:
  imports = [ inputs.niri-glass.nixosModules.default ];
  programs.niri-glass.enable = true;
}
```

home-manager:

```nix
{
  imports = [ inputs.niri-glass.homeManagerModules.default ];
  programs.niri-glass = {
    enable = true;
    # 可选:管理 ~/.config/niri/config.kdl
    config = builtins.readFile ./niri/config.kdl;
  };
}
```

或者通过 overlay 加进包集合(`overlays.default` 暴露 `pkgs.niri-glass`),
或者直接在任何接收包的地方引用 `inputs.niri-glass.packages.<system>.niri-glass`
(比如 `programs.niri.package`)。

> flake pin 在这些补丁文件所针对的精确 niri 提交。如果你 bump 了 `niri` 输入,
> 同步刷新补丁文件,否则可能编译失败。

### install.sh(非 Nix 方式)

克隆仓库并跑安装脚本:

```bash
git clone https://github.com/zaroutt/Niri-glass
cd Niri-glass
```

```bash
./install.sh /path/to/niri/src
```

> [!WARNING]
> 为了真正用上,你需要把现有的 niri 换成带改动的新二进制。操作方法是
> 退出登录管理器,回到 TTY,脚本会替换它。

如果没指定路径,默认是 `~/niri`。脚本会复制所有修改过的文件,重新编译 niri,
并装好二进制。

### 手动步骤

1. 把文件拷到你 niri 的 `src/` 目录
2. 在 niri 源码里跑 `cargo build --release`
3. 把 `target/release/niri` 拷到 `/usr/bin/niri`(需要 sudo)

## 配置

### 完整参数示例

- 想要效果正常,`xray` 必须是 `true`。不然边框会有 artifacts。

在 `config.kdl` 里:

```kdl
window-rule {
    match app-id =".*"
    background-effect {
        blur true
        xray true
        liquid-glass {
            refraction-strength 3.0
            power-factor 10
            refraction-power 1.0
            glow-weight 0.0001
            edge-lighting 0.2
            saturation 0.9
            vibrancy 0.2
            adaptive-dim 0.2
            adaptive-boost 0.2
            physical-refraction 0
            lens-distortion 0
            fringing 0

        }
    }
}
```

### 磨砂玻璃外观的参数

```kdl
saturation 0.9
vibrancy 0.2
adaptive-dim 0.25
adaptive-boost 0.25
```

<img width="462" height="276" alt="截图 2026-06-30 13-40-40" src="https://github.com/user-attachments/assets/ef2949f8-c8b7-4805-a2b5-7aaa87507525" />

所有参数设为 0(只留 `saturation = 1`):

<img width="462" height="276" alt="截图 2026-06-30 13-37-39" src="https://github.com/user-attachments/assets/991553ad-66d0-4a62-8519-8ce3b04bdcc0" />

### 其他

- `fringing`(色散):
  让 RGB 三通道分离,边缘出现彩色。

  <img width="243" height="63" alt="截图 2026-06-30 16-13-20" src="https://github.com/user-attachments/assets/56d589e5-ffa1-46e9-a58a-996d015070e9" />

- `edge-lighting`(边缘光):
  让壁纸的颜色向窗口边缘渗透。

<img width="533" height="320" alt="截图 2026-06-30 16-18-04" src="https://github.com/user-attachments/assets/91d4b152-8bec-47dc-b4dd-6f10a30a441d" />

<img width="531" height="329" alt="截图 2026-06-30 16-17-54" src="https://github.com/user-attachments/assets/c4ba4a55-a3cd-49b5-ae15-fdf9154650c4" />

## 提示

- 这个项目是 vibe coded,可能会有奇怪的行为,请预期。
