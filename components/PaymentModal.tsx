
import React, { useState } from 'react';
import type { Player } from '../types.ts';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player;
    amountDue: number;
    onConfirmPayment: (playerId: number, amount: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, player, amountDue, onConfirmPayment }) => {
    const [amount, setAmount] = useState(amountDue.toString());
    
    if (!isOpen) return null;

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount);
        if (!isNaN(numericAmount) && numericAmount >= 0) {
            onConfirmPayment(player.id, numericAmount);
        }
    };

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Registrar Pago</h2>
                </header>
                <main className="p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                         {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.nickname} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-lg">{player.nickname}</p>
                            <p className="text-sm text-gray-500">Cuota del partido: {formatter.format(amountDue)}</p>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto a Pagar</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </main>
                 <footer className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">
                        Confirmar Pago
                    </button>
                </footer>
            </div>
        </div>
    );
};
