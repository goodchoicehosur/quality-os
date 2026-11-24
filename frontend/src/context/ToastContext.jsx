import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TbCircleCheck, TbAlertTriangle, TbInfoCircle, TbX } from 'react-icons/tb';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  };

  const iconFor = (type) => {
    if (type === 'success') return <TbCircleCheck className="text-ok" size={18} />;
    if (type === 'error') return <TbAlertTriangle className="text-danger" size={18} />;
    return <TbInfoCircle className="text-acc" size={18} />;
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 no-print">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-border rounded-lg shadow-popover px-3.5 py-3 flex items-start gap-2.5"
            >
              {iconFor(t.type)}
              <div className="flex-1 text-[13px] text-ink leading-snug">{t.message}</div>
              <button onClick={() => remove(t.id)} className="text-muted hover:text-ink">
                <TbX size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
