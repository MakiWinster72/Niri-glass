# home-manager module for niri-glass.
#
# Installs the niri-glass package into the user profile and, optionally,
# manages ~/.config/niri/config.kdl.
#
# Usage (flake):
#   imports = [ inputs.niri-glass.homeManagerModules.default ];
#   programs.niri-glass = {
#     enable = true;
#     config = builtins.readFile ./niri/config.kdl;  # optional
#   };
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
      description = "The niri-glass package to install.";
    };

    config = lib.mkOption {
      type = lib.types.nullOr (lib.types.either lib.types.lines lib.types.path);
      default = null;
      example = lib.literalExpression "builtins.readFile ./niri/config.kdl";
      description = ''
        Contents of `~/.config/niri/config.kdl`. Either inline KDL text or a
        path to a config file. When `null`, niri-glass' config is left
        unmanaged (niri falls back to its built-in default config).
      '';
    };
  };

  config = lib.mkIf cfg.enable {
    home.packages = [ cfg.package ];

    xdg.configFile."niri/config.kdl" = lib.mkIf (cfg.config != null) (
      if builtins.isPath cfg.config || lib.isStorePath cfg.config then
        { source = cfg.config; }
      else
        { text = cfg.config; }
    );
  };
}
