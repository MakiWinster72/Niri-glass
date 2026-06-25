#version 100

//_DEFINES_

#if defined(EXTERNAL)
#extension GL_OES_EGL_image_external : require
#endif

precision highp float;
#if defined(EXTERNAL)
uniform samplerExternalOES tex;
#else
uniform sampler2D tex;
#endif

uniform float alpha;
varying vec2 v_coords;

#if defined(DEBUG_FLAGS)
uniform float tint;
#endif

uniform float niri_scale;

uniform vec2 geo_size;
uniform vec4 corner_radius;
uniform mat3 input_to_geo;

// Liquid glass uniforms
uniform float lg_refraction_strength;
uniform float lg_power_factor;
uniform float lg_refraction_a;
uniform float lg_refraction_b;
uniform float lg_refraction_c;
uniform float lg_refraction_d;
uniform float lg_refraction_power;
uniform float lg_physical_refraction;
uniform float lg_glow_weight;
uniform float lg_glow_bias;
uniform float lg_glow_edge0;
uniform float lg_glow_edge1;
uniform float lg_edge_lighting;
uniform float lg_fringing;

float niri_rounding_alpha(vec2 coords, vec2 size, vec4 corner_radius);
vec4 postprocess(vec4 color);

// ============================================================================
// Liquid Glass effect -- faithful port of kwin-effects-glass
// https://github.com/4v3ngR/kwin-effects-glass
// ============================================================================

struct GlassFragment {
    vec4 color;
    float dist;
    float edgeFactor;
    float concaveFactor;
    vec3 normal;
    float ior;
};

// Rounded-rect SDF -- EXACT copy from kwin
// cornerRadius: x=bottom-left, y=bottom-right, z=top-left, w=top-right
float roundedRectangleDist(vec2 p, vec2 b, vec4 cornerRadius)
{
    float r = p.x > 0.0
        ? (p.y > 0.0 ? cornerRadius.y : cornerRadius.w)
        : (p.y > 0.0 ? cornerRadius.x : cornerRadius.z);
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Rounded rectangle for clipping -- from kwin
vec4 roundedRectangle(vec2 fragCoord, vec3 color, vec4 cornerRadius, vec2 blurSize)
{
    vec2 halfBlurSize = blurSize * 0.5;
    vec2 p = fragCoord - halfBlurSize;
    float dist = roundedRectangleDist(p, halfBlurSize, cornerRadius);

    if (dist <= 0.0) {
        return vec4(color, 1.0);
    }

    float s = smoothstep(0.0, 1.0, dist);
    return vec4(color, mix(1.0, 0.0, s));
}

// Simple refraction -- EXACT copy from kwin's glassRefraction
// uv_tex: global framebuffer UV, used only for texture sampling
GlassFragment glassRefraction(vec2 uv_tex, vec2 position, vec2 halfBlurSize, vec4 cornerRadius, float dist, float edgeFactor, float concaveFactor, float refractionStrength, float refractionRGBFringing)
{
    const float h = 1.0;
    vec2 gradient = vec2(
            roundedRectangleDist(position + vec2(h, 0.0), halfBlurSize, cornerRadius) - roundedRectangleDist(position - vec2(h, 0.0), halfBlurSize, cornerRadius),
            roundedRectangleDist(position + vec2(0.0, h), halfBlurSize, cornerRadius) - roundedRectangleDist(position - vec2(0.0, h), halfBlurSize, cornerRadius)
    );

    vec2 normal = length(gradient) > 0.0 ? -normalize(gradient) : vec2(0.0, 1.0);

    float finalStrength = min(0.4 * concaveFactor * refractionStrength, 1.0);

    vec2 refractOffsetG = -normal.xy * finalStrength;
    vec2 refractOffsetR = -normal.xy * finalStrength;
    vec2 refractOffsetB = -normal.xy * finalStrength;

    // Different refraction offsets for each color channel
    float fringingFactor = refractionRGBFringing * 0.3;
    if (fringingFactor > 0.0) {
        refractOffsetR = -normal.xy * (finalStrength * (1.0 + fringingFactor));
        refractOffsetB = -normal.xy * (finalStrength * (1.0 - fringingFactor));
    }

    vec2 coordR = clamp(uv_tex - refractOffsetR, 0.0, 1.0);
    vec2 coordG = clamp(uv_tex - refractOffsetG, 0.0, 1.0);
    vec2 coordB = clamp(uv_tex - refractOffsetB, 0.0, 1.0);

    vec4 color = vec4(
        texture2D(tex, coordR).r,
        texture2D(tex, coordG).g,
        texture2D(tex, coordB).b,
        texture2D(tex, coordG).a
    );
    return GlassFragment(color, dist, edgeFactor, concaveFactor, vec3(0.0, 0.0, 1.0), 1.0);
}

// Snell's law refraction -- EXACT copy from kwin's snellsRefraction
// uv_tex: global framebuffer UV, used only for texture sampling
GlassFragment snellsRefraction(vec2 uv_tex, vec2 position, vec2 halfBlurSize, vec4 cornerRadius, float minHalfSize, float dist, float edgeFactor, float concaveFactor, float refractionStrength, float refractionBevelIntensity, float refractionOffsetStrength, float refractionRGBFringing)
{
    float bandWidth = max(minHalfSize * 0.15, 4.0);
    float ior = 1.0 + refractionStrength * 0.5;

    float minR = min(min(cornerRadius.x, cornerRadius.y), min(cornerRadius.z, cornerRadius.w));
    float eps = min(bandWidth * 0.75, minR * 0.6);
    float dxp = roundedRectangleDist(position + vec2(eps, 0.0), halfBlurSize, cornerRadius);
    float dxn = roundedRectangleDist(position - vec2(eps, 0.0), halfBlurSize, cornerRadius);
    float dyp = roundedRectangleDist(position + vec2(0.0, eps), halfBlurSize, cornerRadius);
    float dyn = roundedRectangleDist(position - vec2(0.0, eps), halfBlurSize, cornerRadius);
    vec2 smoothGrad = vec2(dxp - dxn, dyp - dyn);
    float gradLen = length(smoothGrad);

    float normalHeight = concaveFactor * refractionBevelIntensity;
    vec2 normalXY = gradLen > 0.001 ? (smoothGrad / gradLen) * normalHeight : vec2(0.0);
    vec3 glassNormal = normalize(vec3(normalXY, 1.0));

    float lensMagnitude = concaveFactor * bandWidth * refractionBevelIntensity;
    vec2 surfaceNormal = gradLen > 0.001 ? smoothGrad / gradLen : vec2(0.0, 1.0);

    vec2 normalizedPos = position / (halfBlurSize * 2.0);
    float cornerWeight = dot(normalizedPos, normalizedPos) * refractionOffsetStrength;
    surfaceNormal += normalizedPos * concaveFactor * cornerWeight;

    vec2 uvScale = 1.0 / (halfBlurSize * 2.0);
    vec2 lensShift = -surfaceNormal * lensMagnitude * uvScale;

    // Snell's law
    vec3 viewRay = vec3(0.0, 0.0, -1.0);
    vec3 refracted = refract(viewRay, glassNormal, 1.0 / ior);
    vec2 dir = length(refracted.xy) > 0.001 ? normalize(refracted.xy) : vec2(0.0);

    float refractionMagnitude = lensMagnitude * refractionStrength;
    vec2 shiftG = dir * refractionMagnitude * uvScale + lensShift;
    vec2 uvG = clamp(uv_tex + shiftG, 0.0, 1.0);
    vec4 sampleG = texture2D(tex, uvG);

    vec4 color;
    if (refractionRGBFringing > 0.001) {
        float fringe = clamp(refractionRGBFringing, 0.0, 1.0) * 0.3;
        vec2 shiftR = dir * (refractionMagnitude * (1.0 + fringe)) * uvScale + lensShift;
        vec2 shiftB = dir * (refractionMagnitude * (1.0 - fringe)) * uvScale + lensShift;

        float r = texture2D(tex, clamp(uv_tex + shiftR, 0.0, 1.0)).r;
        float b = texture2D(tex, clamp(uv_tex + shiftB, 0.0, 1.0)).b;
        color = vec4(r, sampleG.g, b, sampleG.a);
    } else {
        color = sampleG;
    }

    return GlassFragment(color, dist, edgeFactor, concaveFactor, glassNormal, ior);
}

// Outline -- EXACT copy from kwin's glassOutline
vec3 glassOutline(vec2 position, vec2 blurSize, GlassFragment s, float glowStrength, float edgeLighting)
{
    float rimMask = clamp(0.25 * s.concaveFactor, 0.0, glowStrength);
    vec3 glow = mix(s.color.rgb, vec3(1.0), rimMask);
    if (edgeLighting > 0.5) {
        glow += (s.color.rgb * s.concaveFactor);
    }

    if (glowStrength > 0.0) {
        float edgeMask = smoothstep(0.0, -2.0, s.dist);
        float borderInner = smoothstep(-1.0, -3.0, s.dist);
        float edgeProfile = edgeMask - borderInner;
        float thicknessShadow = pow(edgeProfile, 0.9);
        float shadowMask = smoothstep(blurSize.y * 0.7, -blurSize.y * 0.7, position.y) *
                           smoothstep(blurSize.x * 0.7, -blurSize.x * 0.7, position.x);
        float highlightMask = smoothstep(-blurSize.y * 0.7, blurSize.y * 0.7, position.y) *
                              smoothstep(-blurSize.x * 0.7, blurSize.x * 0.7, position.x);

        glow = mix(glow, vec3(1.0), thicknessShadow * shadowMask);
        glow = mix(glow, vec3(1.0), thicknessShadow * highlightMask);
    }

    return glow;
}

// Main glass function -- faithful port of kwin's glass()
//
// FIX: separação de dois espaços UV:
//   uv_tex  = v_coords   → coordenadas no framebuffer global (0..1 da tela inteira)
//                           usado APENAS para amostrar a textura
//   uv_geo  = coords_geo → coordenadas normalizadas DENTRO da janela (0..1)
//                           usado para calcular a posição no SDF e o clip final
//
// O bug original: passava-se apenas v_coords para ambos os propósitos.
// Quando a janela não começa na origem do framebuffer, v_coords não vai de
// 0 a 1 dentro da janela, então o position ficava offset e o SDF só
// detectava borda num lado (tipicamente o esquerdo).
//
// FIX2: glowStrength não é mais multiplicado por 10.0 — o valor lg_glow_weight
//        (0..1) é passado diretamente para evitar saturação total do glow.
// FIX3: edgeLighting agora é controlado pelo uniform lg_edge_lighting em vez
//        de ser hardcoded em 1.0.
// FIX4: refractionRGBFringing agora é controlado pelo uniform lg_fringing em
//        vez de ser hardcoded em 0.3.
vec4 glass_effect(vec2 uv_tex, vec2 uv_geo, vec4 baseColor, vec2 blurSize, vec4 cornerRadius,
                  float refractionStrength, float refractionNormalPow,
                  float refractionRGBFringing, float refractionOffsetStrength,
                  float refractionBevelIntensity, float physicallyBasedRefraction,
                  float glowStrength, float edgeLighting)
{
    vec2 halfBlurSize = blurSize * 0.5;
    float minHalfSize = min(halfBlurSize.x, halfBlurSize.y);

    // Position in pixel coords relative to center (same as kwin)
    // uv_geo vai de [0,1] dentro da janela → position fica sempre centrado
    // na janela, independente de onde ela está na tela.
    // Note: niri has Y going downward, kwin expects Y going upward
    vec2 position = uv_geo * blurSize - halfBlurSize.xy;
    position.y = -position.y; // Invert Y for kwin convention
    float dist = roundedRectangleDist(position, halfBlurSize, cornerRadius);

    // Outside rectangle = no effect
    if (dist >= 0.0) {
        return baseColor;
    }

    // Edge and concave factors (EXACT same as kwin)
    float minEsp = clamp(minHalfSize * 0.15, 0.1, minHalfSize * 0.9);
    float edgeFactor = 1.0 - clamp(abs(dist) / minEsp, 0.0, 1.0);
    float concaveFactor = 1.0 - sqrt(1.0 - pow(smoothstep(0.0, 1.0, edgeFactor), refractionNormalPow));

    GlassFragment s;
    if (refractionStrength > 0.0) {
        vec4 r = clamp(cornerRadius * 2.0, min(64.0, minHalfSize), min(128.0, minHalfSize));
        // Passa uv_tex para sampling, position (derivado de uv_geo) para o SDF
        s = physicallyBasedRefraction < 0.5
            ? glassRefraction(uv_tex, position, halfBlurSize, r, dist, edgeFactor, concaveFactor, refractionStrength, refractionRGBFringing)
            : snellsRefraction(uv_tex, position, halfBlurSize, r, minHalfSize, dist, edgeFactor, concaveFactor, refractionStrength, refractionBevelIntensity, refractionOffsetStrength, refractionRGBFringing);
    } else {
        s = GlassFragment(baseColor, dist, edgeFactor, concaveFactor, vec3(0.0, 0.0, 1.0), 1.0);
    }

    // Apply outline (same as kwin)
    vec3 rgb = s.concaveFactor < 1.0 ? glassOutline(position, blurSize, s, glowStrength, edgeLighting) : s.color.rgb;

    // Não aplicamos roundedRectangle aqui: o clip de cantos arredondados já é
    // feito pelo niri_rounding_alpha no main(). Aplicar os dois causa uma linha
    // de artefato nos cantos porque os dois SDFs usam corner_radius em espaços
    // diferentes (kwin vs niri) e não se cancelam perfeitamente.
    return vec4(rgb, s.color.a);
}

void main() {
    vec3 coords_geo = input_to_geo * vec3(v_coords, 1.0);

    vec4 color = texture2D(tex, v_coords);
#if defined(NO_ALPHA)
    color = vec4(color.rgb, 1.0);
#endif

    // Binary mask
    float insideGeo = step(0.0, coords_geo.x) * step(coords_geo.x, 1.0)
                     * step(0.0, coords_geo.y) * step(coords_geo.y, 1.0);
    float lgEnabled = step(0.0001, lg_refraction_strength);
    float effectMask = insideGeo * lgEnabled;

    if (effectMask > 0.0) {
        // Normalize strength (config 0-100 -> shader 0-1)
        float normStrength = clamp(lg_refraction_strength * 0.05, 0.0, 1.0);

        // Remap corner radius: niri=[TL,TR,BR,BL] -> kwin=[BL,BR,TL,TR]
        // kwin SDF: p.x>0 && p.y>0 -> cornerRadius.y (bottom-right)
        //           p.x>0 && p.y<=0 -> cornerRadius.w (top-right)
        //           p.x<=0 && p.y>0 -> cornerRadius.x (bottom-left)
        //           p.x<=0 && p.y<=0 -> cornerRadius.z (top-left)
        // niri: x=TL, y=TR, z=BR, w=BL
        // kwin: x=BL, y=BR, z=TL, w=TR
        vec4 cr = vec4(corner_radius.w, corner_radius.z, corner_radius.x, corner_radius.y);

        vec4 result = glass_effect(
            v_coords,       // uv_tex  -- UV do framebuffer global (para texture sampling)
            coords_geo.xy,  // uv_geo  -- [0,1] dentro da janela (para SDF e clip)
            color, geo_size, cr,
            normStrength,
            lg_power_factor,           // refractionNormalPow
            lg_fringing,               // refractionRGBFringing (era 0.3 hardcoded)
            lg_refraction_power,       // refractionOffsetStrength
            lg_refraction_power,       // refractionBevelIntensity
            lg_physical_refraction,
            lg_glow_weight,            // glowStrength (era lg_glow_weight * 10.0)
            lg_edge_lighting           // edgeLighting (era 1.0 hardcoded)
        );
        color = result;
    }

    color = postprocess(color);

    color = color * niri_rounding_alpha(coords_geo.xy * geo_size, geo_size, corner_radius)
                  * insideGeo;

    color = color * alpha;

#if defined(DEBUG_FLAGS)
    if (tint == 1.0)
        color = vec4(0.0, 0.2, 0.0, 0.2) + color * 0.8;
#endif

    gl_FragColor = color;
}
