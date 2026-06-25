#[derive(Debug, Default, Clone, Copy, PartialEq)]
pub struct LiquidGlassOptions {
    pub refraction_strength: f64,
    pub power_factor: f64,
    pub refraction_a: f64,
    pub refraction_b: f64,
    pub refraction_c: f64,
    pub refraction_d: f64,
    pub refraction_power: f64,
    pub glow_weight: f64,
    pub glow_bias: f64,
    pub glow_edge0: f64,
    pub glow_edge1: f64,
}

impl From<niri_config::LiquidGlass> for LiquidGlassOptions {
    fn from(config: niri_config::LiquidGlass) -> Self {
        Self {
            refraction_strength: config.refraction_strength,
            power_factor: config.power_factor,
            refraction_a: config.refraction_a,
            refraction_b: config.refraction_b,
            refraction_c: config.refraction_c,
            refraction_d: config.refraction_d,
            refraction_power: config.refraction_power,
            glow_weight: config.glow_weight,
            glow_bias: config.glow_bias,
            glow_edge0: config.glow_edge0,
            glow_edge1: config.glow_edge1,
        }
    }
}
