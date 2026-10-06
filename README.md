# Mostar city — cinematic scroll

Vanilla HTML/CSS/JS, no build step. All images and fonts load from remote URLs.

## Run

ES modules don't load over `file://`, so serve the folder:

```bash
npx serve .          # or: python -m http.server 5173
```

## Structure

```
index.html                  DOM + paint order (source order = stacking for equal z-index)
css/
  tokens.css                @font-face + :root custom properties (animation channels)
  base.css                  resets
  layout.css                scroll rig, sticky stage, world, shade
  header.css                top navigation
  scene.css                 photo layers: sky, back stack, bridge, splitframes, frame two
  sights.css                sights slider, cards, prev/next controls
  hero.css                  MOSTAR title + intro copy
  story.css                 bridge / bazaar story panels
  responsive.css            breakpoints + reduced motion (must load last)
js/
  main.js                   entry: queries DOM, wires listeners
  core/scene-animator.js    scroll/pointer smoothing + per-frame CSS variable writes
  components/sights-slider.js  3-set clone infinite slider
  utils/math.js             clamp, smoothstep, lerp, segmentInOut
```

CSS reads only custom properties; JS only writes them on `:root`. To retime a scene,
edit the `segmentInOut` / `smoothstep` ranges at the top of `update()` in `scene-animator.js`.
