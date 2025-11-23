import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Dependency, OracleComponent } from '../types';

interface DependencyGraphProps {
  components: OracleComponent[];
  dependencies: Dependency[];
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ components, dependencies }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || components.length === 0) return;

    const width = 800;
    const height = 500;
    
    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; background-color: #ffffff; border-radius: 0.5rem;");

    // Prepare data
    const nodes = components.map(c => ({ id: c.id, group: 1, ...c }));
    const links = dependencies.map(d => ({ source: d.sourceComponent, target: d.targetComponent, type: d.type }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Define arrow marker
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#64748b")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node circles
    node.append("circle")
      .attr("r", 15)
      .attr("fill", (d: any) => {
          // Color based on component type prefix roughly
          if (d.id.startsWith('AP')) return '#3b82f6'; // Blue
          if (d.id.startsWith('GL')) return '#10b981'; // Emerald
          if (d.id.startsWith('PO')) return '#f59e0b'; // Amber
          if (d.id.startsWith('AR')) return '#8b5cf6'; // Violet
          return '#64748b'; // Slate
      });

    // Labels
    node.append("text")
      .text(d => d.id)
      .attr("x", 18)
      .attr("y", 5)
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#334155")
      .attr("stroke", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [components, dependencies]);

  return (
    <div className="relative border rounded-xl bg-white shadow-sm p-4 overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Dependency Map (ControlM)</h3>
        </div>
        <svg ref={svgRef} className="w-full h-[500px] cursor-move"></svg>
    </div>
  );
};

export default DependencyGraph;
