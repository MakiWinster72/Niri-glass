#!/bin/bash

set -e

echo "Niri-glass uninstaller"
echo

# Refuse if a niri-glass session is currently active
if systemctl --user -q is-active niri-glass.service 2>/dev/null; then
  echo "niri-glass.service is currently active (this is your running session)."
  echo "Log out first, then run this script from a TTY:"
  echo "  pkill -9 niri-glass && niri-session"
  echo
  echo "After logging out and switching to upstream niri, re-run uninstall.sh."
  exit 1
fi

# Stop the unit if it's loaded-but-inactive
if systemctl --user -q is-enabled niri-glass.service 2>/dev/null; then
  systemctl --user disable --now niri-glass.service 2>/dev/null || true
fi

echo "Removing /usr/local/bin/niri-glass..."
sudo rm -f /usr/local/bin/niri-glass

echo "Removing /usr/local/bin/niri-glass-session..."
sudo rm -f /usr/local/bin/niri-glass-session

echo "Removing /usr/share/wayland-sessions/niri-glass.desktop..."
sudo rm -f /usr/share/wayland-sessions/niri-glass.desktop

echo "Removing ~/.local/share/systemd/user/niri-glass.service..."
rm -f "$HOME/.local/share/systemd/user/niri-glass.service"

echo "Reloading systemd user units..."
systemctl --user daemon-reload

cat <<'EOF'

Done.

EOF
