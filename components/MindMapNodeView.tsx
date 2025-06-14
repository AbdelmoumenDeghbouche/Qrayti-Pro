import React from 'react';
import { MindMapUINode } from '../utils/mindmapUtils';

interface MindMapNodeViewProps {
  node: MindMapUINode;
  level: number; // Current depth for styling
}

const levelColors = [
  { bg: 'bg-teal-500 dark:bg-teal-600', textC: 'text-white dark:text-teal-50', borderC: 'border-teal-600 dark:border-teal-700' },
  { bg: 'bg-sky-500 dark:bg-sky-600', textC: 'text-white dark:text-sky-50', borderC: 'border-sky-600 dark:border-sky-700' },
  { bg: 'bg-emerald-500 dark:bg-emerald-600', textC: 'text-white dark:text-emerald-50', borderC: 'border-emerald-600 dark:border-emerald-700' },
  { bg: 'bg-lime-500 dark:bg-lime-600', textC: 'text-slate-800 dark:text-lime-50', borderC: 'border-lime-600 dark:border-lime-700' },
  { bg: 'bg-amber-500 dark:bg-amber-600', textC: 'text-slate-800 dark:text-amber-50', borderC: 'border-amber-600 dark:border-amber-700' },
  { bg: 'bg-orange-500 dark:bg-orange-600', textC: 'text-white dark:text-orange-50', borderC: 'border-orange-600 dark:border-orange-700' },
  { bg: 'bg-indigo-500 dark:bg-indigo-600', textC: 'text-white dark:text-indigo-50', borderC: 'border-indigo-600 dark:border-indigo-700' },
  { bg: 'bg-violet-500 dark:bg-violet-600', textC: 'text-white dark:text-violet-50', borderC: 'border-violet-600 dark:border-violet-700' },
];

const MindMapNodeView: React.FC<MindMapNodeViewProps> = ({ node, level }) => {
  const hasChildren = node.children && node.children.length > 0;
  const colors = levelColors[level % levelColors.length];

  return (
    <div className={`mt-4 ${level > 0 ? 'ml-6 md:ml-10' : ''}`}> {/* Increased ml */}
      <div 
        className={`relative inline-block px-5 py-3.5 rounded-xl shadow-lg ${colors.bg} ${colors.textC} min-w-[150px] max-w-lg break-words text-lg font-bold border-2 ${colors.borderC} transition-all duration-150 ease-in-out hover:shadow-xl hover:scale-[1.02]`}
      >
        {level > 0 && (
           <span className={`absolute -left-[calc(1.5rem+3px)] md:-left-[calc(2.5rem+3px)] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full ${colors.bg} border-2 ${colors.borderC} ring-2 ring-white/50 dark:ring-slate-800/50`}></span>
        )}
        {node.text}
      </div>

      {hasChildren && (
        <div className={`mt-2 ${level > -1 ? 'ml-6 md:ml-10 border-l-3 border-slate-300 dark:border-slate-500 pl-5 pt-3' : ''}`}> {/* Increased border-l, pl, pt */}
          {node.children.map(childNode => (
            <MindMapNodeView key={childNode.id} node={childNode} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MindMapNodeView;