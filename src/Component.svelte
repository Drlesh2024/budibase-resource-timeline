<script>
  import { onMount } from "svelte";
  import { getContext } from "svelte";
  import { DataSet } from "vis-data";
  import { Timeline } from "vis-timeline/standalone";
  import "vis-timeline/styles/vis-timeline-graph2d.min.css";

  const { styleable, Provider } = getContext("sdk");

  export let workersProvider;
  export let assignmentsProvider;
  export let height = 650;

  let selectedAssignmentId = null;
  $: dataContext = { selectedAssignmentId };

  let container;
  let timeline;

  $: workersRaw = workersProvider?.rows ?? [];
  $: assignmentsRaw = assignmentsProvider?.rows ?? [];

  function displayName(u) {
    const fn = u?.first_name || "";
    const ln = u?.last_name || "";
    const full = `${fn} ${ln}`.trim();
    return full || u?.email || u?.id || "Unknown";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function buildGroups(workers) {
    return new DataSet(
      (workers || [])
        .filter(u => u?.id)
        .map(u => ({ id: u.id, content: escapeHtml(displayName(u)) }))
    );
  }

  function buildItems(assignments) {
    return new DataSet(
      (assignments || [])
        .filter(a => a?.worker?.id && a?.start_at && a?.end_at)
        .map(a => {
          const p = a.project || {};
          const label = [
            a.typ ? `[${a.typ}]` : "",
            p.title || "",
            p.customer_name ? `- ${p.customer_name}` : ""
          ].filter(Boolean).join(" ");

          return {
            id: a.id,
            group: a.worker.id,
            content: escapeHtml(label || a.notes || "Assignment"),
            start: a.start_at,
            end: a.end_at,
            className: `typ-${String(a.typ || "none").toLowerCase()}`
          };
        })
    );
  }

  function render() {
    if (!container) return;

    const groups = buildGroups(workersRaw);
    const items = buildItems(assignmentsRaw);

    if (!timeline) {
      timeline = new Timeline(container, items, groups, {
        stack: false,
        horizontalScroll: true,
        zoomKey: "ctrlKey",
        orientation: "both",
        margin: { item: 6, axis: 10 },
        timeAxis: { scale: "day", step: 1 }
      });

      timeline.on("select", (props) => {
        const id = props?.items?.[0];
        if (!id) return;
        selectedAssignmentId = id;
      });
    } else {
      timeline.setGroups(groups);
      timeline.setItems(items);
    }
  }

  onMount(render);
  $: workersRaw, assignmentsRaw, render();
</script>

<Provider {dataContext}>
  <div use:styleable style="height: {height}px;">
    <div bind:this={container} style="height: 100%;"></div>
  </div>
</Provider>

<style>
  :global(.typ-urlaub) { background:#b71c1c !important; color:#fff !important; border-color:#7f0000 !important; }
  :global(.typ-montage) { background:#ef6c00 !important; color:#fff !important; border-color:#e65100 !important; }
  :global(.typ-blocker) { background:#7b1fa2 !important; color:#fff !important; border-color:#4a148c !important; }
  :global(.typ-office) { background:#00897b !important; color:#fff !important; border-color:#00695c !important; }
  :global(.typ-onboarding) { background:#1565c0 !important; color:#fff !important; border-color:#0d47a1 !important; }
</style>
