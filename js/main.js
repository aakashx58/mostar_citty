import { createSceneAnimator } from "./core/scene-animator.js";
import { createSightsSlider } from "./components/sights-slider.js";

const section = document.querySelector(".cinema-scroll");
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const track = document.querySelector(".sights-track");
const sightsControls = document.querySelector(".sights-controls");
const prevButton = document.querySelector(".sight-prev");
const nextButton = document.querySelector(".sight-next");

const slider = createSightsSlider({ track, root });
const animator = createSceneAnimator({ section, root, reduceMotion, sightsControls });

slider.setup();
animator.requestTick();

window.addEventListener("scroll", animator.requestTick, { passive: true });
window.addEventListener("resize", () => {
  slider.update();
  animator.requestTick();
});
window.addEventListener(
  "pointermove",
  (event) => animator.setPointer(event.clientX, event.clientY),
  { passive: true },
);

prevButton.addEventListener("click", () => slider.move(-1));
nextButton.addEventListener("click", () => slider.move(1));
