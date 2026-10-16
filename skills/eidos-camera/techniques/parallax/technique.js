(() => {
  const E = window.Eidos;
  E.fx["parallax"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { r3 } = E.util;
    const specs = o.layers ?? E.$all("[data-parallax]", stage.world).map((el) => ({ el, depth: parseFloat(el.dataset.parallax) }));
    const layers = [];
    for (const { el, depth } of specs) {
      if (typeof depth !== "number" || !Number.isFinite(depth) || depth < -1) {
        window.__eidosErrors.push(`parallax depth must be a number of -1 or more, got ${String(depth)}`);
        continue;
      }
      for (const node of E.$all(el, stage.world)) layers.push({ node, depth });
    }
    const useX = o.axis !== "y", useY = o.axis !== "x";
    tl.onSeek(() => {
      const st = camera.state, home = camera.home();
      const dx = useX ? st.x - home.x : 0, dy = useY ? st.y - home.y : 0;
      for (const { node, depth } of layers) node.style.transform = `translate(${r3(-depth * dx)}px, ${r3(-depth * dy)}px)`;
    });
    const at = tl.resolveAt(o.at);
    return { start: at, end: at };
  };
})();
