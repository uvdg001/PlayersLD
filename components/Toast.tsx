import React, { useContext, useEffect, useState } from 'react';
import { ToastContext } from '../contexts/ToastContext.tsx';
import type { ToastMessage } from '../types.ts';

const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onRemove(toast.id), 300); // Wait for fade out animation
        }, 7000); // 7 seconds duration

        return () => {
            clearTimeout(timer);
        };
    }, [toast.id, onRemove]);

    const handleRemove = () => {
        setIsFadingOut(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const toastStyles = {
        success: {
            bg: 'bg-green-500',
            icon: '✅',
        },
        error: {
            bg: 'bg-red-500',
            icon: '❌',
        },
        info: {
            bg: 'bg-blue-500',
            icon: 'ℹ️',
        },
        warning: {
            bg: 'bg-yellow-500',
            icon: '⚠️',
        },
    };

    const style = toastStyles[toast.type];

    return (
        <div
            className={`
                flex items-center p-4 mb-4 text-white rounded-lg shadow-lg
                transform transition-all duration-300
                ${style.bg}
                ${isFadingOut ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
            role="alert"
        >
            <div className="text-xl mr-3">{style.icon}</div>
            <div className="text-sm font-medium">{toast.message}</div>
            <button
                onClick={handleRemove}
                className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex h-8 w-8 hover:bg-white/20"
                aria-label="Cerrar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const context = useContext(ToastContext);

    if (!context) {
        return null; // Should not happen if wrapped in provider
    }

    const { toasts, removeToast } = context;

    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-xs">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};