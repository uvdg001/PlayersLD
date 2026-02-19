import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext.tsx';
import type { ToastType } from '../types.ts';

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }

    const { addToast } = context;

    const toast = (message: string, type: ToastType = 'info') => {
        addToast(message, type);
    };

    toast.success = (message: string) => {
        addToast(message, 'success');
    };

    toast.error = (message: string) => {
        addToast(message, 'error');
    };

    toast.info = (message: string) => {
        addToast(message, 'info');
    };

    toast.warning = (message: string) => {
        addToast(message, 'warning');
    };

    return toast;
};