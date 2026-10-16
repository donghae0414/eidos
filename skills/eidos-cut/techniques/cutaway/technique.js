(() => {
  const E = window.Eidos;
  const fail = (message) => {
    (window.__eidosErrors ||= []).push(`cutaway: ${message}`);
    throw new Error(`cutaway: ${message}`);
  };
  E.fx["cutaway"] = (stage, o = {}) => {
    const allowed = { id: 1, hub: 1, from: 1, via: 1, with: 1, title: 1, reason: 1, label: 1, build: 1 };
    const reversible = { cut: 1, camera: 1, "cross-dissolve": 1, "jump-cut": 1, "smash-cut": 1, "dip-to-color": 1, iris: 1 };
    if (!o || typeof o !== "object" || Array.isArray(o)) fail("options must be an object");
    for (const key of Object.keys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${key}`);
    for (const key of ["id", "hub"]) if (typeof o[key] !== "string" || !o[key].trim()) fail(`${key} must be a non-empty scene id`);
    if (stage.scenes.some((scene) => scene.id === o.id)) fail(`id ${o.id} is already used`);
    const hub = stage.scenes.find((scene) => scene.id === o.hub);
    if (!hub) fail(`hub ${o.hub} must already exist`);
    if (!stage.stops.some((stop) => stop.scene === o.hub)) fail(`hub ${o.hub} needs a stop before the detour`);
    if (typeof o.build !== "function") fail("build must be a function that authors the detour stops");
    for (const key of ["title", "reason", "label"]) if (o[key] != null && typeof o[key] !== "string") fail(`${key} must be a string`);
    const via = o.via ?? "cross-dissolve";
    if (!Object.hasOwn(reversible, via)) fail(`via ${String(via)} cannot preserve the hub snapshot; use ${Object.keys(reversible).join(", ")}`);
    if (via !== "cut" && via !== "camera" && (!Object.hasOwn(E.fx, via) || E.fx[via].kind !== "transition")) fail(`via must name a loaded transition (got ${String(via)})`);
    if (o.with != null && (typeof o.with !== "object" || Array.isArray(o.with))) fail("with must be a transition options object");
    if (o.with?.dur != null && (!Number.isFinite(o.with.dur) || o.with.dur < 0)) fail("with.dur must be finite nonnegative seconds");
    let targets;
    try { targets = E.$all(o.from, stage.world); }
    catch { fail("from must be a valid detour selector or element"); }
    if (targets.length !== 1) fail("from must select one detour scene");
    if (via === "camera" && !E.$all(hub.el, stage.world).some((el) => el !== targets[0] && el.contains(targets[0]))) fail("camera needs a detour element inside the hub; use cut or cross-dissolve for separate scene layers");
    const start = stage.tl.end;
    const entryTracks = stage.tl.tracks.length;
    stage.spoke(o.id, { hub: o.hub, from: o.from, via, with: o.with, title: o.title, reason: o.reason });
    // A zero-duration transition must leave the hub's exact stop untouched.
    if (stage.tl.end === start) for (const track of stage.tl.tracks.slice(entryTracks)) {
      const fn = track.fn;
      track.fn = (p) => fn(stage.tl.t <= start ? 0 : p);
    }
    const count = stage.stops.length;
    o.build(stage);
    if (stage.stops.length === count) fail("build must add at least one detour stop");
    // A return cut must not overwrite the detail stop at the same timestamp.
    stage.tl.wait(0.1);
    const returnStart = stage.tl.end;
    stage.back({ via, with: o.with, label: o.label });
    // Some transitions default to zero only under reduced motion. Give their
    // strict t > start tracks a settling point without changing their duration.
    if (stage.tl.end === returnStart) {
      stage.tl.wait(0.1);
      stage.stops[stage.stops.length - 1].t = stage.tl.end;
    }
    return { start, end: stage.tl.end };
  };
})();
