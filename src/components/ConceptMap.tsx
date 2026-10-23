import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  Layers,
  ArrowRight,
  Info,
  Link2,
  X
} from 'lucide-react';
import { ConceptNode, ConceptLink } from '../types';
import { CONCEPT_NODES, CONCEPT_LINKS } from '../data/conceptMapData';

interface ConceptMapProps {
  onSelectConceptPrompt?: (prompt: string) => void;
  onSelectDocId?: (docId: string | null, subject: string) => void;
  onNavigateToTab?: (tab: string) => void;
  initialSubject?: string;
}

export const ConceptMap: React.FC<ConceptMapProps> = ({
  onSelectConceptPrompt,
  onSelectDocId,
  onNavigateToTab,
  initialSubject
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(
    initialSubject && initialSubject !== 'All' ? initialSubject : 'All'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNode, setActiveNode] = useState<ConceptNode | null>(null);
  const [showCrossBridgesOnly, setShowCrossBridgesOnly] = useState<boolean>(false);

  // Filter nodes & links based on user controls
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let nodes = [...CONCEPT_NODES];
    let links = [...CONCEPT_LINKS];

    if (showCrossBridgesOnly) {
      links = links.filter(l => l.isCrossSubject);
      const bridgeNodeIds = new Set<string>();
      links.forEach(l => {
        bridgeNodeIds.add(typeof l.source === 'string' ? l.source : (l.source as any).id);
        bridgeNodeIds.add(typeof l.target === 'string' ? l.target : (l.target as any).id);
      });
      nodes = nodes.filter(n => bridgeNodeIds.has(n.id) || n.type === 'subject');
    } else if (selectedSubjectFilter !== 'All') {
      const subjectNode = nodes.find(
        n => n.type === 'subject' && n.subject.toLowerCase() === selectedSubjectFilter.toLowerCase()
      );
      const subjectNodes = nodes.filter(
        n => n.subject.toLowerCase() === selectedSubjectFilter.toLowerCase()
      );
      const nodeIds = new Set(subjectNodes.map(n => n.id));
      if (subjectNode) nodeIds.add(subjectNode.id);

      // Include cross-subject bridge targets connected to this subject
      links.forEach(l => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        if (nodeIds.has(sId) && l.isCrossSubject) nodeIds.add(tId);
        if (nodeIds.has(tId) && l.isCrossSubject) nodeIds.add(sId);
      });

      nodes = nodes.filter(n => nodeIds.has(n.id));
      links = links.filter(l => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        return nodeIds.has(sId) && nodeIds.has(tId);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.map(n => ({
        ...n,
        isSearchMatch:
          n.name.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          (n.keyFormulas && n.keyFormulas.some(f => f.toLowerCase().includes(q)))
      }));
    }

    return { filteredNodes: nodes, filteredLinks: links };
  }, [selectedSubjectFilter, showCrossBridgesOnly, searchQuery]);

  // Color helper according to design system
  const getNodeColor = (node: ConceptNode) => {
    if (node.type === 'subject') {
      if (node.subject === 'Mathematics') return '#284E38'; // Forest Green
      if (node.subject === 'Science') return '#0D6E6E'; // Deep Teal
      return '#B85C38'; // Terracotta
    }
    if (node.subject === 'Mathematics') return '#284E38';
    if (node.subject === 'Science') return '#1A6B54';
    return '#B85C38';
  };

  const getNodeFill = (node: ConceptNode) => {
    if (node.type === 'subject') return getNodeColor(node);
    if (node.type === 'concept') return '#FAF9F5';
    return '#FFFFFF';
  };

  // D3 Graph Simulation Effect
  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    const width = containerEl.clientWidth || 800;
    const height = containerEl.clientHeight || 560;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [0, 0, width, height]);

    // Zoom container
    const g = svg.append('g').attr('class', 'everything');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 3])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Deep copy data for D3 mutation
    const nodes: any[] = filteredNodes.map(d => ({ ...d }));
    const links: any[] = filteredLinks.map(d => ({ ...d }));

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => (d.isCrossSubject ? 160 : d.target.type === 'chapter' ? 110 : 80))
      )
      .force('charge', d3.forceManyBody().strength((d: any) => (d.type === 'subject' ? -480 : -240)))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.val || 20) + 16));

    // Marker defs for arrow / glowing bridges
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker for cross-subject bridges
    defs
      .append('marker')
      .attr('id', 'bridge-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#8C6D23');

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) => (d.isCrossSubject ? '#8C6D23' : '#D1D5DB'))
      .attr('stroke-width', (d: any) => (d.isCrossSubject ? 2.5 : 1.5))
      .attr('stroke-dasharray', (d: any) => (d.isCrossSubject ? '5,5' : 'none'))
      .attr('stroke-opacity', (d: any) => (d.isCrossSubject ? 0.85 : 0.6))
      .attr('marker-end', (d: any) => (d.isCrossSubject ? 'url(#bridge-arrow)' : null));

    // Link label on hover
    link.append('title').text((d: any) => `${d.relation || 'Relates to'}${d.isCrossSubject ? ' (Cross-Subject Bridge)' : ''}`);

    // Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cursor-pointer select-none')
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer circle (ring)
    node
      .append('circle')
      .attr('r', (d: any) => d.val || 22)
      .attr('fill', (d: any) => getNodeFill(d))
      .attr('stroke', (d: any) => getNodeColor(d))
      .attr('stroke-width', (d: any) => (d.type === 'subject' ? 4 : d.isSearchMatch ? 4 : 2.5))
      .attr('stroke-dasharray', (d: any) => (d.type === 'concept' ? '4,3' : 'none'))
      .attr('filter', (d: any) => (d.type === 'subject' || d.isSearchMatch ? 'url(#glow)' : null))
      .attr('class', 'transition-transform duration-200 hover:scale-110');

    // Inner icon/text
    node.each(function (d: any) {
      const el = d3.select(this);

      if (d.type === 'subject') {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#FFFFFF')
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .text(d.subject === 'Mathematics' ? '📐' : d.subject === 'Science' ? '🧪' : '🏛️');
      } else {
        // Dot indicator
        el.append('circle')
          .attr('r', 4)
          .attr('fill', getNodeColor(d));
      }
    });

    // Labels under/beside nodes
    node
      .append('text')
      .attr('dy', (d: any) => (d.val || 22) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1E2922')
      .attr('font-size', (d: any) => (d.type === 'subject' ? '12px' : '11px'))
      .attr('font-weight', (d: any) => (d.type === 'subject' ? '800' : '600'))
      .attr('class', 'pointer-events-none drop-shadow-xs')
      .text((d: any) => d.name);

    // Node Click Handler
    node.on('click', (event, d: any) => {
      event.stopPropagation();
      setActiveNode(d);
    });

    // Click canvas background to unselect
    svg.on('click', () => {
      setActiveNode(null);
    });

    // Tick Handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Reset Zoom function attached to buttons
    (svgEl as any).__d3_reset_zoom = () => {
      svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
    };
    (svgEl as any).__d3_zoom_in = () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    };
    (svgEl as any).__d3_zoom_out = () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    };

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks]);

  // Zoom button triggers
  const handleZoomIn = () => {
    if (svgRef.current && (svgRef.current as any).__d3_zoom_in) {
      (svgRef.current as any).__d3_zoom_in();
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && (svgRef.current as any).__d3_zoom_out) {
      (svgRef.current as any).__d3_zoom_out();
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && (svgRef.current as any).__d3_reset_zoom) {
      (svgRef.current as any).__d3_reset_zoom();
    }
  };

  // Find incoming & outgoing connection names for active node
  const activeConnections = useMemo(() => {
    if (!activeNode) return [];
    return CONCEPT_LINKS.filter(
      l =>
        (typeof l.source === 'string' ? l.source : (l.source as any).id) === activeNode.id ||
        (typeof l.target === 'string' ? l.target : (l.target as any).id) === activeNode.id
    ).map(l => {
      const isSource = (typeof l.source === 'string' ? l.source : (l.source as any).id) === activeNode.id;
      const otherId = isSource
        ? typeof l.target === 'string' ? l.target : (l.target as any).id
        : typeof l.source === 'string' ? l.source : (l.source as any).id;
      const otherNode = CONCEPT_NODES.find(n => n.id === otherId);
      return {
        targetName: otherNode ? otherNode.name : otherId,
        relation: l.relation,
        isCross: l.isCrossSubject,
        subject: otherNode?.subject
      };
    });
  }, [activeNode]);

  return (
    <div className="relative w-full h-[620px] bg-[#FAF9F5]/90 rounded-3xl border border-[#8C6D23]/25 shadow-lg overflow-hidden flex flex-col text-left">
      {/* 1. Concept Map Control Toolbar */}
      <div className="px-5 py-3.5 bg-white/95 backdrop-blur-md border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Left: Filter Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl">
            {['All', 'Mathematics', 'Science', 'Social Science'].map(subj => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setSelectedSubjectFilter(subj);
                  setShowCrossBridgesOnly(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubjectFilter === subj && !showCrossBridgesOnly
                    ? 'bg-[#284E38] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#284E38] hover:bg-white'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Cross-Subject Bridges Toggle */}
          <button
            type="button"
            onClick={() => setShowCrossBridgesOnly(!showCrossBridgesOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showCrossBridgesOnly
                ? 'bg-[#8C6D23] text-white border-[#8C6D23] shadow-xs'
                : 'bg-white border-stone-200 text-[#8C6D23] hover:border-[#8C6D23]'
            }`}
            title="Show only interdisciplinary cross-subject bridges"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Cross-Subject Bridges</span>
          </button>

          {/* Search box */}
          <div className="relative min-w-[170px] sm:min-w-[210px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search concepts or formulas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38] text-stone-800"
            />
          </div>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-2xs"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-2xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-2xs"
            title="Reset to Center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main D3 SVG Canvas */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Interactive Legend (Bottom Left) */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-stone-200/90 shadow-sm text-[11px] space-y-1.5 pointer-events-none select-none hidden sm:block">
          <span className="font-bold text-stone-500 uppercase tracking-wider block text-[10px]">
            Visual Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#284E38]" />
            <span className="font-semibold text-stone-700">Mathematics</span>
            <span className="w-3.5 h-3.5 rounded-full bg-[#0D6E6E] ml-2" />
            <span className="font-semibold text-stone-700">Science</span>
            <span className="w-3.5 h-3.5 rounded-full bg-[#B85C38] ml-2" />
            <span className="font-semibold text-stone-700">Social Science</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500 pt-1 border-t border-stone-100">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-[#8C6D23]" />
            <span className="text-[10px] text-[#8C6D23] font-bold">Golden Dashed: Cross-Subject Bridge</span>
          </div>
        </div>

        {/* Floating Active Node Detail Inspector Card */}
        {activeNode && (
          <div className="absolute top-4 right-4 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-3xl p-5 border-2 border-[#8C6D23]/30 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-150 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2.5 pb-2 border-b border-stone-100">
              <div>
                <span
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md text-white inline-block mb-1"
                  style={{ backgroundColor: getNodeColor(activeNode) }}
                >
                  {activeNode.subject} · {activeNode.type}
                </span>
                <h3 className="text-base font-extrabold text-[#284E38] leading-tight">
                  {activeNode.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveNode(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              {activeNode.description}
            </p>

            {/* Key Formulas / Theorems */}
            {activeNode.keyFormulas && activeNode.keyFormulas.length > 0 && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#FAF9F5] border border-[#8C6D23]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] block mb-1">
                  Key Formulas & Laws:
                </span>
                <ul className="space-y-1">
                  {activeNode.keyFormulas.map((f, i) => (
                    <li key={i} className="text-xs font-mono font-bold text-[#284E38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D23]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interdisciplinary Bridges & Connections */}
            {activeConnections.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Syllabus Connections:
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {activeConnections.map((conn, idx) => (
                    <div
                      key={idx}
                      className={`text-[11px] p-1.5 rounded-lg border flex items-center justify-between gap-1.5 ${
                        conn.isCross
                          ? 'bg-[#FCECD4]/60 border-[#8C6D23]/30 text-[#8C6D23] font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span className="truncate">{conn.targetName}</span>
                      <span className="text-[10px] font-normal italic opacity-80 whitespace-nowrap">
                        {conn.relation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons to Navigate Content */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              {/* Action 1: Ask Mentor */}
              {onSelectConceptPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Explain the core concepts and board exam derivations of "${activeNode.name}" in ${activeNode.subject}. Provide intuitive Indian real-world analogies and an Active-Recall Checkpoint.`;
                    onSelectConceptPrompt(prompt);
                    setActiveNode(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                  <span>Discuss in AI Mentor Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Action 2: Set Active Document Filter */}
              {onSelectDocId && activeNode.doc_id && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectDocId(activeNode.doc_id || null, activeNode.subject);
                    setActiveNode(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold text-[#284E38] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#8C6D23]" />
                  <span>Set Active Context to this Chapter</span>
                </button>
              )}

              {/* Action 3: Quiz or Flashcard shortcut */}
              {onNavigateToTab && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDocId && activeNode.doc_id) {
                        onSelectDocId(activeNode.doc_id, activeNode.subject);
                      }
                      onNavigateToTab('quiz');
                      setActiveNode(null);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Award className="w-3 h-3 text-[#284E38]" />
                    <span>Practice Quiz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDocId && activeNode.doc_id) {
                        onSelectDocId(activeNode.doc_id, activeNode.subject);
                      }
                      onNavigateToTab('flashcards');
                      setActiveNode(null);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-stone-100 hover:bg-amber-50 hover:text-[#8C6D23] text-stone-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Layers className="w-3 h-3 text-[#8C6D23]" />
                    <span>3D Flashcards</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
