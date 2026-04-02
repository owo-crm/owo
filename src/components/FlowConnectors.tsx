"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface NodeRef {
  id: string;
  el: HTMLElement;
}

interface Connector {
  from: string;
  to: string;
}

interface Props {
  nodes: NodeRef[];
  connectors: Connector[];
  containerRef: RefObject<HTMLElement | null>;
}

interface PathData {
  d: string;
  key: string;
}

export function FlowConnectors({
  nodes,
  connectors,
  containerRef,
}: Props) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const recalculate = () => {
      if (!containerRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const nodeMap = new Map(nodes.map((node) => [node.id, node.el]));
      const newPaths: PathData[] = [];

      for (const { from, to } of connectors) {
        const fromEl = nodeMap.get(from);
        const toEl = nodeMap.get(to);

        if (!fromEl || !toEl) {
          continue;
        }

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const x1 = fromRect.right - containerRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
        const x2 = toRect.left - containerRect.left;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;

        const tension = Math.max((x2 - x1) * 0.6, 80);
        const cp1x = x1 + tension;
        const cp1y = y1;
        const cp2x = x2 - tension;
        const cp2y = y2;

        newPaths.push({
          key: `${from}-${to}`,
          d: `M ${x1},${y1} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`,
        });
      }

      setPaths(newPaths);
    };

    recalculate();

    const observer = new ResizeObserver(recalculate);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    nodes.forEach(({ el }) => observer.observe(el));

    window.addEventListener("resize", recalculate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalculate);
    };
  }, [nodes, connectors, containerRef]);

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="#6b7ff0"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {paths.map(({ key, d }) => (
        <path
          key={key}
          d={d}
          fill="none"
          stroke="#6b7ff0"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd="url(#flow-arrow)"
        />
      ))}
    </svg>
  );
}
