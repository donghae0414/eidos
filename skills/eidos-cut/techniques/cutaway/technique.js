(() => {
  const E = window.Eidos;
  const fail = (message) => {
    (window.__eidosErrors ||= []).push(`cutaway: ${message}`);
    throw new Error(`cutaway: ${message}`);
  };
  E.fx["cutaway"] = (stage, o = {}) => {
    const allowed = { id: 1, hub: 1, from: 1, via: 1, with: 1, title: 1, reason: 1, label: 1, build: 1 };
    if (!o || typeof o !== "object" || Array.isArray(o)) fail("options must be an object");
    for (const key of Object.keys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${key}`);
    for (const key of ["id", "hub"]) if (typeof o[key] !== "string" || !o[key].trim()) fail(`${key} must be a non-empty scene id`);
    if (stage.scenes.some((scene) => scene.id === o.id)) fail(`id ${o.id} is already used`);
    if (!stage.scenes.some((scene) => scene.id === o.hub)) fail(`hub ${o.hub} must already exist`);
    if (!stage.stops.some((stop) => stop.scene === o.hub)) fail(`hub ${o.hub} needs a stop before the detour`);
    if (typeof o.build !== "function") fail("build must be a function that authors the detour stops");
    for (const key of ["title", "reason", "label"]) if (o[key] != null && typeof o[key] !== "string") fail(`${key} must be a string`);
    const via = o.via ?? "cross-dissolve";
    if (!Object.hasOwn(E.fx, via) || E.fx[via].kind !== "transition") fail(`via must name a loaded transition (got ${String(via)})`);
    if (o.with != null && (typeof o.with !== "object" || Array.isArray(o.with))) fail("with must be a transition options object");
    if (o.with?.dur != null && (!Number.isFinite(o.with.dur) || o.with.dur <= 0)) fail("with.dur must be positive so the return stop follows the detour stop");
    let targets;
    try { targets = E.$all(o.from, stage.world); }
    catch { fail("from must be a valid detour selector or element"); }
    if (targets.length !== 1) fail("from must select one detour scene");
    const start = stage.tl.end;
    stage.spoke(o.id, { hub: o.hub, from: o.from, via, with: o.with, title: o.title, reason: o.reason });
    const count = stage.stops.length;
    o.build(stage);
    if (stage.stops.length === count) fail("build must add at least one detour stop");
    stage.back({ via, with: o.with, label: o.label });
    return { start, end: stage.tl.end };
  };
})();
