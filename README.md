# Liquid Glass Effect for Niri

Este diretório contém apenas os arquivos modificados do niri para o efeito liquid glass.

## Arquivos

### Shader
- `src/render_helpers/shaders/clipped_surface.frag` - Shader principal do efeito liquid glass (baseado em kwin-effects-glass + HyprGlass)

### Rust (renderização)
- `src/render_helpers/liquid_glass.rs` - Struct `LiquidGlassOptions` com os parâmetros do efeito
- `src/render_helpers/background_effect.rs` - Integração do liquid glass com background effect
- `src/render_helpers/framebuffer_effect.rs` - Passagem de uniforms para o shader (janelas)
- `src/render_helpers/xray.rs` - Passagem de uniforms para o shader (xray)
- `src/render_helpers/shaders/mod.rs` - Registro dos uniforms na compilação do shader
- `src/render_helpers/mod.rs` - Declaração do módulo liquid_glass

### Config
- `niri-config/src/appearance.rs` - Parsing da configuração `liquid-glass` no KDL

### Config do Niri
- `config.kdl` - Configuração de exemplo com liquid-glass habilitado

## Como aplicar

1. Copie os arquivos para o diretório do niri:
   ```bash
   cp src/render_helpers/liquid_glass.rs /home/za/niri/src/render_helpers/
   cp src/render_helpers/shaders/clipped_surface.frag /home/za/niri/src/render_helpers/shaders/
   # ... etc
   ```

2. Recompile o niri:
   ```bash
   cd /home/za/niri && cargo build --release
   ```

3. Copie o binário:
   ```bash
   sudo cp /home/za/niri/target/release/niri /usr/bin/niri
   ```

## Configuração

No `config.kdl`:
```kdl
window-rule {
    background-effect {
        blur true
        xray true
        liquid-glass {
            refraction-strength 1.0
            power-factor 3.0
            refraction-power 0.6
        }
    }
}
```
