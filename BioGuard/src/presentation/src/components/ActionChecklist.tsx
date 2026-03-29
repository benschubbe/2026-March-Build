import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Pill, Footprints, Stethoscope, Sparkles } from 'lucide-react';

interface ActionItem {
  cat: string;
  title: string;
  detail: string;
  priority: string;
  source: string;
}

interface Props {
  actions: ActionItem[];
}

const ICONS: Record<string, React.ReactNode> = {
  supplement: <Pill size={20} />,
  lifestyle: <Footprints size={20} />,
  doctor: <Stethoscope size={20} />,
};

const ActionChecklist: React.FC<Props> = ({ actions }) => {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (actions.length === 0) return null;

  const toggle = (idx: number) => {
    setCompleted(prev => {
      const next = { ...prev };
      next[idx] = !next[idx];
      return next;
    });
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

  const prev = () => setCurrentIdx(i => Math.max(0, i - 1));
  const next = () => setCurrentIdx(i => Math.min(actions.length - 1, i + 1));

  const current = actions[currentIdx];
  const isDone = completed[currentIdx] || false;

  return (
    <div className="Card ActionChecklist-Card">
      <div className="Checklist-Header">
        <Sparkles size={18} />
        <h3>Your Action Plan</h3>
        <span className="Checklist-Progress">{completedCount}/{actions.length} done</span>
      </div>

      <div className="Progress-Bar">
        <div className="Progress-Fill" style={{ width: progress + '%' }} />
      </div>

      <div className="Swipe-Container" ref={containerRef}>
        <button className="Swipe-Btn left" onClick={prev} disabled={currentIdx === 0}>
          <ChevronLeft size={20} />
        </button>

        <div className={`Action-Swipe-Card ${isDone ? 'done' : ''} priority-${current.priority}`}>
          <div className="Swipe-Card-Top">
            <div className="Swipe-Icon">{ICONS[current.cat] || <Footprints size={20} />}</div>
            <div className="Swipe-Meta">
              <span className={'Priority-Tag ' + current.priority}>{current.priority.toUpperCase()}</span>
              <span className="Category-Tag">{current.cat}</span>
            </div>
          </div>
          <h4 className={isDone ? 'line-through' : ''}>{current.title}</h4>
          <p>{current.detail}</p>
          <span className="Swipe-Source">{current.source}</span>

          <button className={`Check-Btn ${isDone ? 'checked' : ''}`} onClick={() => toggle(currentIdx)}>
            {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            <span>{isDone ? 'Completed!' : 'Mark as done'}</span>
          </button>
        </div>

        <button className="Swipe-Btn right" onClick={next} disabled={currentIdx === actions.length - 1}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="Swipe-Dots">
        {actions.map((_, i) => (
          <button key={i} className={'Dot' + (i === currentIdx ? ' active' : '') + (completed[i] ? ' done' : '')} onClick={() => setCurrentIdx(i)} />
        ))}
      </div>

      {completedCount === actions.length && actions.length > 0 && (
        <div className="All-Done">
          <Sparkles size={24} />
          <span>All actions completed! You're taking control of your health.</span>
        </div>
      )}
    </div>
  );
};

export default ActionChecklist;
