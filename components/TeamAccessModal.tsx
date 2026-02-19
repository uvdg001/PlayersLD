
import React, { useState } from 'react';
import { findTeamByCode } from '../services/firebaseService.ts';
import type { Team } from '../types.ts';

// Misma función de normalización que en el Panel Maestro
const normalizeCode = (text: string) => {
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '');
};

interface TeamAccessModalProps {
    onTeamSelect: (team: Team) => void;
}

export const TeamAccessModal: React.FC<TeamAccessModalProps> = ({ onTeamSelect }) => {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawCode = inputValue.trim();
        if (!rawCode) return;
        
        // CÓDIGO MAESTRO ACTUALIZADO
        if (rawCode.toUpperCase() === 'PLAYERLD') {
            onTeamSelect({
                id: 'super-admin',
                name: 'PANEL MAESTRO',
                adminCode: 'MASTER',
                status: 'ACTIVE',
                createdAt: Date.now()
            });
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            // Buscamos usando el código normalizado
            const cleanCode = normalizeCode(rawCode);
            const team = await findTeamByCode(cleanCode);
            
            if (team) {
                if (team.status === 'INACTIVE') {
                    setError('⚠️ Servicio suspendido.');
                } else {
                    onTeamSelect(team);
                }
            } else {
                setError('❌ Equipo no encontrado. Revisa el nombre.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950 flex items-center justify-center p-4 z-[100] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border-t-8 border-indigo-600">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                        <span className="text-5xl">⚽</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tighter italic">PLAYERS</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold uppercase text-[10px] tracking-widest">Digital Roster Management</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-center text-xs font-black text-gray-400 uppercase mb-2">Nombre de tu Equipo</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ej: UTN"
                            className="w-full text-center text-3xl font-black p-4 rounded-2xl border-4 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-indigo-500 outline-none tracking-tight transition-all"
                            autoFocus
                        />
                        {error && <p className="mt-4 text-red-500 text-xs font-black text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !inputValue.trim()}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black rounded-2xl shadow-xl shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'BUSCANDO...' : 'ENTRAR'}
                    </button>
                </form>
                
                <p className="mt-8 text-center text-[10px] text-gray-400 font-medium">
                    No importa si usas tildes o mayúsculas.
                </p>
            </div>
        </div>
    );
};
