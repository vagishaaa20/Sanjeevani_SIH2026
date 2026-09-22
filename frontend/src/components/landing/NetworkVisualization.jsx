import React, { useState } from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { User, Activity, Bot, Building2, Stethoscope, FileSearch, RotateCcw } from 'lucide-react';

const NODES = [
    { id: 'patient', label: 'PATIENT', icon: User, pos: { x: 50, y: 15 }, connections: ['worker', 'ai', 'diagnostics'] },
    { id: 'worker', label: 'HEALTH WORKER', icon: Activity, pos: { x: 20, y: 40 }, connections: ['patient', 'ai', 'clinic'] },
    { id: 'ai', label: 'AI TRIAGE', icon: Bot, pos: { x: 50, y: 50 }, connections: ['patient', 'worker', 'doctor', 'clinic'] },
    { id: 'doctor', label: 'DOCTOR', icon: Stethoscope, pos: { x: 80, y: 40 }, connections: ['ai', 'diagnostics', 'followup'] },
    { id: 'clinic', label: 'CLINIC', icon: Building2, pos: { x: 35, y: 80 }, connections: ['worker', 'ai', 'diagnostics'] },
    { id: 'diagnostics', label: 'DIAGNOSTICS', icon: FileSearch, pos: { x: 65, y: 80 }, connections: ['patient', 'doctor', 'clinic'] },
    { id: 'followup', label: 'FOLLOW-UP', icon: RotateCcw, pos: { x: 50, y: 95 }, connections: ['doctor'] }
];

export const NetworkVisualization = () => {
    const { ref, isVisible } = useScrollReveal(0.3);
    const [hoveredNode, setHoveredNode] = useState(null);

    const isConnected = (id1, id2) => {
        const n1 = NODES.find(n => n.id === id1);
        const n2 = NODES.find(n => n.id === id2);
        return n1?.connections.includes(id2) || n2?.connections.includes(id1);
    };

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-6xl mx-auto z-20" ref={ref}>
            <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    The Sanjeevani Network
                </h2>
                <p className="mt-4 text-lg font-medium max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                    Hover over any node to see how data and care are coordinated across the ecosystem.
                </p>
            </div>

            <div 
                className={`relative w-full aspect-square md:aspect-video max-h-[600px] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            >
                {/* SVG Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                    {NODES.map(node1 => 
                        NODES.map(node2 => {
                            if (node1.id >= node2.id) return null; // Avoid duplicate lines
                            if (!isConnected(node1.id, node2.id)) return null;

                            const isHighlighted = hoveredNode && (hoveredNode === node1.id || hoveredNode === node2.id) && isConnected(hoveredNode, (hoveredNode === node1.id ? node2.id : node1.id));
                            const isFaded = hoveredNode && !isHighlighted && hoveredNode !== node1.id && hoveredNode !== node2.id;

                            return (
                                <line 
                                    key={`${node1.id}-${node2.id}`}
                                    x1={`${node1.pos.x}%`} y1={`${node1.pos.y}%`}
                                    x2={`${node2.pos.x}%`} y2={`${node2.pos.y}%`}
                                    stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
                                    strokeWidth={isHighlighted ? 2 : 1}
                                    className="transition-all duration-300"
                                    opacity={isFaded ? 0.1 : (isHighlighted ? 1 : 0.4)}
                                />
                            );
                        })
                    )}
                </svg>

                {/* Nodes */}
                {NODES.map(node => {
                    const isHighlighted = hoveredNode === node.id || (hoveredNode && isConnected(hoveredNode, node.id));
                    const isFaded = hoveredNode && !isHighlighted;

                    return (
                        <div 
                            key={node.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-300 ${isFaded ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}`}
                            style={{ left: `${node.pos.x}%`, top: `${node.pos.y}%`, zIndex: isHighlighted ? 10 : 1 }}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-[var(--bg-surface)] shadow-md"
                                 style={{ 
                                     borderColor: hoveredNode === node.id ? 'var(--accent)' : (isHighlighted ? 'var(--accent)' : 'var(--border)'),
                                     boxShadow: hoveredNode === node.id ? '0 0 20px rgba(225,59,104,0.3)' : 'none'
                                 }}>
                                <node.icon className="w-5 h-5 md:w-7 md:h-7 transition-colors duration-300" style={{ color: isHighlighted ? 'var(--accent)' : 'var(--text-secondary)' }} />
                            </div>
                            <span className="mt-2 text-[10px] md:text-xs font-black tracking-widest uppercase transition-colors duration-300" 
                                  style={{ color: isHighlighted ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {node.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default NetworkVisualization;
