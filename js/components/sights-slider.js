/**
 * Infinite card slider: the original cards are cloned into 3 identical sets and the
 * active index lives in the middle set. After each slide, if it drifted into an outer
 * set, it jumps (no transition) back by one set length — the loop looks seamless.
 */
const SET_COUNT = 3;

export function createSightsSlider({ track, root }) {
  const originalCards = [...track.querySelectorAll(".sight-card")];
  const originalCount = originalCards.length;
  let sightCards = [];
  let activeSight = originalCount;

  function update() {
    if (!sightCards.length) return;
    const cardWidth = sightCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    root.style.setProperty("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);
    sightCards.forEach((card, index) => card.classList.toggle("is-active", index === activeSight));
  }

  function move(direction) {
    activeSight += direction;
    update();
  }

  function select(card) {
    const index = Number(card.dataset.sightIndex);
    if (Number.isFinite(index)) activeSight = index;
    update();
  }

  function jump(index) {
    track.classList.add("is-jumping");
    activeSight = index;
    update();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => track.classList.remove("is-jumping"));
    });
  }

  function normalize() {
    if (activeSight >= originalCount * 2) jump(activeSight - originalCount);
    else if (activeSight < originalCount) jump(activeSight + originalCount);
  }

  function setup() {
    track.replaceChildren();
    for (let setIndex = 0; setIndex < SET_COUNT; setIndex += 1) {
      originalCards.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(setIndex * originalCount + cardIndex);
        track.append(clone);
      });
    }

    sightCards = [...track.querySelectorAll(".sight-card")];
    activeSight = originalCount;

    sightCards.forEach((card) => {
      card.addEventListener("click", () => select(card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(card);
        }
      });
    });

    // Only the track's own transform transition — ignore bubbling from children.
    track.addEventListener("transitionend", (event) => {
      if (event.target === track) normalize();
    });
    update();
  }

  return { setup, update, move };
}
