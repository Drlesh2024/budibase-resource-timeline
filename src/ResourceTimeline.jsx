import React, { useEffect, useMemo, useRef } from "react";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

function displayName(u) {
  const fn = u?.first_name || "";
  const ln = u?.last_name || "";
  const full = `${fn} ${ln}`.trim();
  return full || u?.email || u?.id || "Unknown";
}

export default function ResourceTimeline(props) {
  const {
    workers = [],
    assignments = [],
    start,
    end,
    height = 650,
    onSelectAssignmentId
  } = props;

  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  const groups = useMemo(() => {
    return new DataSet(
      (workers || []).map((u) => ({
        id: u.id,
        content: displayName(u)
      }))
    );
  }, [workers]);

  const items = useMemo(() => {
    return new DataSet(
      (assignments || [])
        .filter((a) => a?.worker?.id)
        .map((a) => {
          const p = a.project || {};
          const label = [
            a.typ ? `[${a.typ}]` : "",
            p.title || "",
            p.customer_name ? `- ${p.customer_name}` : ""
          ]
            .filter(Boolean)
            .join(" ");

          return {
            id: a.id,
            group: a.worker.id,
            content: label || a.notes || "Assignment",
            start: a.start_at,
            end: a.end_at,
            className: `typ-${String(a.typ || "none").toLowerCase()}`
          };
        })
    );
  }, [assignments]);

  useEffect(() => {
    if (!containerRef.current) return;

    // init
    if (!timelineRef.current) {
      timelineRef.current = new Timeline(
        containerRef.current,
        items,
        groups,
        {
          stack: false,
          horizontalScroll: true,
          zoomKey: "ctrlKey",
          orientation: "both",
          margin: { item: 6, axis: 10 },
          timeAxis: { scale: "day", step: 1 },
          start: start || undefined,
          end: end || undefined
        }
      );

      timelineRef.current.on("select", (p) => {
        const id = p?.items?.[0];
        if (!id) return;
        if (typeof onSelectAssignmentId === "function") {
          onSelectAssignmentId(id);
        }
      });
    } else {
      // update
      timelineRef.current.setGroups(groups);
      timelineRef.current.setItems(items);

      if (start && end) {
        timelineRef.current.setWindow(start, end, { animation: false });
      }
    }

    return () => {
      // keep instance (no destroy) to avoid flicker; Budibase remount handles cleanup
    };
  }, [groups, items, start, end, onSelectAssignmentId]);

  return (
    <div style={{ height: typeof height === "number" ? `${height}px` : height }}>
      <style>{`
        .typ-urlaub { background:#b71c1c !important; color:#fff !important; border-color:#7f0000 !important; }
        .typ-montage { background:#ef6c00 !important; color:#fff !important; border-color:#e65100 !important; }
        .typ-blocker { background:#7b1fa2 !important; color:#fff !important; border-color:#4a148c !important; }
        .typ-office { background:#00897b !important; color:#fff !important; border-color:#00695c !important; }
        .typ-onboarding { background:#1565c0 !important; color:#fff !important; border-color:#0d47a1 !important; }
      `}</style>

      <div ref={containerRef} style={{ height: "100%" }} />
    </div>
  );
}
