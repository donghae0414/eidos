(() => {
  const E = window.Eidos;
  E.fx["parallax"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { r3 } = E.util;
    const fail = (message) => {
      const error = `parallax: ${message}`;
      window.__eidosErrors.push(error);
      throw new TypeError(error);
    };
    const validate = (options, rules) => {
      if (!options || typeof options !== "object" || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options))) fail("options must be a plain object");
      for (const key of Reflect.ownKeys(options)) {
        if (!Object.hasOwn(rules, key)) fail(`unknown option ${String(key)}`);
        if (options[key] !== undefined && !rules[key](options[key])) fail(`invalid ${String(key)} (${typeof options[key]})`);
      }
    };
    const nonnegative = (v) => Number.isFinite(v) && v >= 0;
    const atTime = (v) => (nonnegative(v) || (typeof v === "string" && /^(?:<(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)|\+=(?:\d+(?:\.\d*)?|\.\d+))?|[+-]=(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+(?:\.\d*)?|\.\d+))$/.test(v))) && nonnegative(tl.resolveAt(v));
    const nodes = (v) => {
      try { return (typeof v === "string" || v instanceof Element || Array.isArray(v) || v instanceof NodeList || v instanceof HTMLCollection) && E.$all(v, stage.world).length > 0 && E.$all(v, stage.world).every((el) => el instanceof Element); }
      catch { return false; }
    };
    validate(o, { layers: Array.isArray, axis: (v) => ["x", "y", "both"].includes(v), at: atTime });
    const specs = o.layers ?? E.$all("[data-parallax]", stage.world).map((el) => ({ el, depth: el.dataset.parallax.trim() === "" ? NaN : Number(el.dataset.parallax) }));
    const layers = [];
    for (const spec of specs) {
      validate(spec, { el: nodes, depth: (v) => Number.isFinite(v) && v >= -1 });
      const { el, depth } = spec;
      if (!nodes(el) || !Number.isFinite(depth) || depth < -1) fail("layers need el elements and a finite numeric depth of -1 or more");
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
