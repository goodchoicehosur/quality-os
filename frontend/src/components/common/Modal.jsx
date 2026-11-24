import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TbX } from 'react-icons/tb';

export default function Modal({ open, onClose, title, children, footer, width = 520 }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#111A16]/55 backdrop-blur-sm px-4 no-print"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            className="modal-panel bg-card rounded-2xl shadow-popover border border-border w-full max-h-[88vh] flex flex-col overflow-hidden dark:bg-slate-800 dark:border-slate-700"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0 dark:border-slate-700">
              <h3 className="text-[16px] font-semibold text-ink dark:text-slate-100">{title}</h3>
              <button onClick={onClose} className="text-muted hover:text-ink hover:bg-slate-100 rounded-xl p-2 dark:hover:bg-slate-700">
                <TbX size={17} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto scroll-thin">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-border bg-[#FAFAF6] flex items-center justify-end gap-2 shrink-0 dark:bg-slate-900 dark:border-slate-700">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
