import { clamp, lerp, smoothstep, segmentInOut } from "../utils/math.js";

const SCROLL_EASE = 0.14;
const POINTER_EASE = 0.12;
const SCROLL_EPSILON = 0.08;
const POINTER_EPSILON = 0.001;

/**
 * Scroll + pointer driven choreography. Reads scroll distance through the sticky
 * section, smooths it, and writes every CSS custom property the stylesheets consume.
 * Runs on demand (requestTick) and keeps re-requesting frames until values settle.
 */
export function createSceneAnimator({ section, root, reduceMotion, sightsControls }) {
  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetScroll = 0;
  let smoothScroll = 0;
  let initialized = false;
  let rafPending = false;

  const set = (name, value) => root.style.setProperty(name, String(value));

  const getScrollDistance = () =>
    clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);

  function update() {
    rafPending = false;

    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else {
      smoothScroll = lerp(smoothScroll, targetScroll, SCROLL_EASE);
    }
    if (Math.abs(smoothScroll - targetScroll) < SCROLL_EPSILON) smoothScroll = targetScroll;

    mouseX = lerp(mouseX, targetMouseX, POINTER_EASE);
    mouseY = lerp(mouseY, targetMouseY, POINTER_EASE);

    // ---- Timeline (px of scroll) ----
    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;
    const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
    // Solve the slider's top inside the scaled back-stack (origin 50% 100%) so it lands at sightsScreenTop on screen.
    const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

    // ---- Pointer ----
    set("--mx", (reduceMotion.matches ? 0 : mouseX).toFixed(4));
    set("--my", (reduceMotion.matches ? 0 : mouseY).toFixed(4));

    // ---- Back stack ----
    set("--back-opacity", 1 - frame2.active * 0.06);
    set("--back-x", `${mouseX * -12}px`);
    set("--back-y", `${mouseY * -4}px`);
    set("--back-scale", backScale);
    set("--four-y", `${10 + progress * 10}vh`);
    set("--four-scale", 0.78 + progress * 0.16);
    set("--bazaar-y", `${20 - progress * 8}vh`);
    set("--blur-px", `${blurActive * 14}px`);
    set("--back-brightness", 1 - blurActive * 0.255);
    set("--bazaar-blur-px", `${frame2.active * 14}px`);
    set("--bazaar-brightness", 1 - frame2.active * 0.255 - frame3.active * 0.06);
    set("--bazaar-saturation", 1 + frame3.active * 0.18);

    // ---- Shade ----
    set("--shade-opacity", "1");
    set("--shade-z", frame2.active > 0.02 ? "2" : "0");
    set("--shade-top-alpha", blurActive * 0.465);
    set("--shade-mid-alpha", blurActive * 0.42);
    set("--shade-bottom-alpha", blurActive * 0.51);

    // ---- Title ----
    set("--title-y", `${introExit * -210}px`);
    set("--title-scale", 1 - introExit * 0.08);
    set("--title-opacity", 1 - introExit);

    // ---- Bridge ----
    set("--bridge-x", `calc(-50% + ${mouseX * 18}px)`);
    set("--bridge-y", `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`);
    set("--bridge-bottom", `${5 - frame2.enter * 13}vh`);
    set("--bridge-width", `${67.2 + frame2.enter * 37.8}vw`);
    set("--bridge-scale", 1.02 + sharedHeroScale + frame2.exit * 0.46);

    // ---- Splitframes ----
    const splitY = `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`;
    const splitScale = 1 + sharedHeroScale + frame2.enter * 0.74;
    set("--split-left-x", `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`);
    set("--split-left-y", splitY);
    set("--split-left-scale", splitScale);
    set("--split-right-x", `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`);
    set("--split-right-y", splitY);
    set("--split-right-scale", splitScale);

    // ---- Frame two ----
    set("--frame2-opacity", frame2Opacity);
    set("--frame2-x", `calc(-50% + ${mouseX * 10}px)`);
    set("--frame2-y", `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`);
    set("--frame2-scale", 1.06 + frame2.enter * 0.08 + frame2.exit * 0.08);

    // ---- Copy + panels ----
    set("--intro-copy-y", `${introExit * 90}px`);
    set("--intro-copy-opacity", 1 - introExit);
    set("--panel2-opacity", panel2Opacity);
    set("--panel2-y", `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`);
    set("--panel3-opacity", panel3Opacity);
    set("--panel3-y", `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`);

    // ---- Sights ----
    set("--sights-opacity", sightsEnter);
    set("--sights-controls-opacity", sightsControlsEnter);
    sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
    set("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
    set("--sights-y", "0px");
    set("--sights-enter-x", `${(1 - sightsEnter) * 420}vw`);
    set("--sights-scale", 1 / backScale);
    set("--sights-top", `${sightsParentTop}px`);
    set("--sights-screen-top", `${sightsScreenTop}px`);

    const settling =
      Math.abs(smoothScroll - targetScroll) > SCROLL_EPSILON ||
      Math.abs(mouseX - targetMouseX) > POINTER_EPSILON ||
      Math.abs(mouseY - targetMouseY) > POINTER_EPSILON;
    if (settling) requestTick();
  }

  function requestTick() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(update);
  }

  function setPointer(clientX, clientY) {
    targetMouseX = clientX / window.innerWidth - 0.5;
    targetMouseY = clientY / window.innerHeight - 0.5;
    requestTick();
  }

  return { requestTick, setPointer };
}
