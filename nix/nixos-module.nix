# NixOS module for niri-glass.
#
# Thin wrapper around nixpkgs' `programs.niri` module: it reuses all of the
# upstream session wiring (wayland session, xdg-desktop-portal, polkit, dbus,
# gnome-keyring, systemd user units) but substitutes the niri-glass package.
#
# Usage (flake):
#   imports = [ inputs.niri-glass.nixosModules.default ];
#   programs.niri-glass.enable = true;
self:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.programs.niri-glass;
  system = pkgs.stdenv.hostPlatform.system;
in
{
  options.programs.niri-glass = {
    enable = lib.mkEnableOption "niri-glass, niri with a liquid-glass background effect";

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${system}.niri-glass;
      defaultText = lib.literalExpression "niri-glass.packages.\${system}.niri-glass";
      description = "The niri-glass package to use.";
    };
  };

  config = lib.mkIf cfg.enable {
    # Delegate to the upstream niri module, swapping in our package. This pulls
    # in the wayland session, portals, polkit rules, dbus and systemd units.
    programs.niri = {
      enable = true;
      package = cfg.package;
    };
  };
}
