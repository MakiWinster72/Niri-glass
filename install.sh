#!/bin/bash
set -e

NIRI_SRC="${1:-$HOME/niri}"

if [ ! -d "$NIRI_SRC" ]; then
  echo "Error: niri source directory not found at $NIRI_SRC"
  echo "Usage: ./install.sh [path-to-niri-src]"
  exit 1
fi

echo "Copying files to $NIRI_SRC..."
cp src/render_helpers/liquid_glass.rs "$NIRI_SRC/src/render_helpers/"
cp src/render_helpers/shaders/clipped_surface.frag "$NIRI_SRC/src/render_helpers/shaders/"
cp src/render_helpers/background_effect.rs "$NIRI_SRC/src/render_helpers/"
cp src/render_helpers/framebuffer_effect.rs "$NIRI_SRC/src/render_helpers/"
cp src/render_helpers/xray.rs "$NIRI_SRC/src/render_helpers/"
cp src/render_helpers/shaders/mod.rs "$NIRI_SRC/src/render_helpers/shaders/"
cp src/render_helpers/mod.rs "$NIRI_SRC/src/render_helpers/"
cp niri-config/src/appearance.rs "$NIRI_SRC/niri-config/src/"

echo "Building niri..."
cd "$NIRI_SRC" && cargo build --release

echo "Installing niri binary..."
sudo cp "$NIRI_SRC/target/release/niri" /usr/local/bin/niri-glass

echo "Registering Wayland session entry..."
sudo tee /usr/share/wayland-sessions/niri-glass.desktop >/dev/null <<'EOF'
[Desktop Entry]
Name=Niri (Liquid Glass)
Comment=Niri with liquid-glass background effect
Exec=/usr/local/bin/niri-glass --session
Type=WaylandSession
DesktopNames=niri
EOF

cat <<'EOF'

Done! Pick which binary to launch at session start:

  exec /usr/local/bin/niri-glass --session   # liquid_glass version
  exec /usr/bin/niri --session               # pacman version  

Also, made a option for your login manager:
  /usr/share/wayland-sessions/niri-glass.desktop
if you dont need it, just delete

EOF
