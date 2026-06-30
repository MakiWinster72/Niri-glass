# Liquid Glass Effect for Niri
## Examples
1.
<img width="1920" height="1080" alt="Screenshot from 2026-06-30 12-31-50" src="https://github.com/user-attachments/assets/8cad6485-b685-4bc9-b22e-8cf7801cd15a" />

2.
<img width="1920" height="1080" alt="Screenshot from 2026-06-30 12-32-48" src="https://github.com/user-attachments/assets/fccc46f0-9cda-488b-b0e1-5939d36676cf" />

3.
<img width="1920" height="1080" alt="Screenshot from 2026-06-30 12-34-48" src="https://github.com/user-attachments/assets/ff3f0d17-3bf1-42e8-9660-e291189321f9" />

4.
<img width="1920" height="1080" alt="Screenshot from 2026-06-30 12-40-02" src="https://github.com/user-attachments/assets/eaeda5ef-1fe3-4e51-8466-10e461240021" />




## Files


### Shader
- `src/render_helpers/shaders/clipped_surface.frag` - Main liquid glass effect shader (based on [kwin-effects-glass](https://github.com/4v3ngR/kwin-effects-glass))


### Rust (rendering)
- `src/render_helpers/liquid_glass.rs` - `LiquidGlassOptions` struct with effect parameters
- `src/render_helpers/background_effect.rs` - Liquid glass integration with background effect
- `src/render_helpers/framebuffer_effect.rs` - Uniform passing to shader (windows)
- `src/render_helpers/xray.rs` - Uniform passing to shader (xray)
- `src/render_helpers/shaders/mod.rs` - Uniform registration during shader compilation
- `src/render_helpers/mod.rs` - Module declaration for liquid_glass



### Niri Config
- `config.kdl` - Example configuration with liquid-glass enabled

## How to Apply

Clone the repo and run the install script:
```bash
git clone https://github.com/zaroutt/Niri-glass
cd Niri-glass
```
```bash
./install.sh /path/to/niri/src
```
> [!WARNING]
> To apply this you must change your actual binary for the one with the changes. To do this you must be in your login manager and open the TTY and the script will replace it

If no path is provided, defaults to `~/niri`. The script copies all modified files, recompiles niri, and installs the binary.

### Manual steps
1. Copy files to your niri `src/` directory
2. Run `cargo build --release` in the niri source
3. Copy `target/release/niri` to `/usr/bin/niri` (requires sudo)

## Configuration
### Example with all parameters
- for the effect work well the xray must be true. if not, the borders will have artifacts
  
In `config.kdl`:
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
            lens distortion
            
        }
    }
}
```


## Warnings 
- Vibe coded project so expect weirdly behavior.

