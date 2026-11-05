'use client';
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({ title, children, onClose, className = '' }) {
  const ref = useRef(null); const id = useId();
  useEffect(() => {
    const previous = document.activeElement; const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; ref.current?.showModal();
    ref.current?.querySelector('textarea, input')?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = overflow; if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog className={`modal ${className}`} ref={ref} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby={id}><div className="modal-inner"><button className="icon-button close-modal" onClick={onClose} aria-label="Close dialog"><X size={22} /></button><span className="eyebrow">THE CLASS BOARD</span><h2 id={id}>{title}</h2>{children}</div></dialog>;
}
