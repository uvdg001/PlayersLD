
import React, { useState, useEffect } from 'react';
import { getAllTeams, updateTeamStatus, getFirestoreInstance, createTeamWithInitialData } from '../../services/firebaseService.ts';
import type { Team } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';

const normalizeCode = (text: string) => {
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '');
};

export const SuperAdminPanel: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTeamName, setNewTeamName] = useState('');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const toast = useToast();

    useEffect(() => {
        fetchTeams();
        const db = getFirestoreInstance();
        if (!db) {
            setConnectionError("❌ ERROR: No se detectó conexión a Firebase. Revisa tu archivo .env");
        }
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        setConnectionError(null);
        try {
            const data = await getAllTeams();
            setTeams(data.sort((a: Team, b: Team) => b.createdAt - a.createdAt));
            if (data.length === 0 && !getFirestoreInstance()) {
                setConnectionError("No se pudieron cargar equipos. Verifica tus credenciales.");
            }
        } catch (e: any) {
            console.error("Error al obtener equipos:", e);
            setConnectionError(`Error de base de datos: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawName = newTeamName.trim();
        if (!rawName) return;
        const cleanCode = normalizeCode(rawName);
        
        try {
            toast.info(`Creando equipo: ${rawName}...`);
            await createTeamWithInitialData(rawName, cleanCode);
            toast.success(`¡"${rawName}" creado con éxito!`);
            setNewTeamName('');
            fetchTeams();
        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        }
    };

    const handleToggleStatus = async (teamId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await updateTeamStatus(teamId, newStatus);
            toast.success(newStatus === 'ACTIVE' ? "✅ Equipo Habilitado" : "⏸️ Equipo Suspendido");
            fetchTeams();
        } catch (e) {
            toast.error("Error al cambiar estado.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Cabecera de Guía */}
            <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl border-4 border-indigo-500/50">
                <h2 className="text-xl font-black uppercase italic mb-4 flex items-center gap-2">
                    <span>🚀</span> PASOS PARA ACTIVAR UN EQUIPO
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold uppercase tracking-tight">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/10">1. Crea el nombre abajo.</div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/10">2. Asegúrate que diga "ACTIVO" en verde.</div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/10">3. Sal del Panel y escribe el nombre para entrar.</div>
                </div>
            </div>

            {/* Alerta de Error de Conexión */}
            {connectionError && (
                <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl animate-pulse font-black text-center border-4 border-red-400">
                    <p className="text-xl">⚠️ ATENCIÓN</p>
                    <p className="text-sm mt-1">{connectionError}</p>
                </div>
            )}

            {/* Creador de Equipos */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 border-t-8 border-indigo-600">
                <h2 className="text-xl font-black mb-4 text-indigo-700 dark:text-indigo-400 uppercase tracking-tighter">➕ Crear Nueva Licencia</h2>
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="text" 
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        placeholder="Nombre del equipo (Ej: Branca)"
                        className="flex-1 p-4 rounded-2xl border-2 border-gray-100 dark:bg-gray-900 dark:border-gray-700 font-bold outline-none focus:border-indigo-500"
                    />
                    <button type="submit" className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-95">
                        REGISTRAR
                    </button>
                </form>
            </div>

            {/* Lista de Equipos */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black uppercase text-gray-800 dark:text-white tracking-tighter">Equipos Registrados</h2>
                    <button onClick={fetchTeams} className="text-[10px] font-black bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-indigo-500">REFRESCAR 🔄</button>
                </div>

                {loading ? (
                    <div className="text-center py-20 opacity-50 font-bold italic animate-pulse">Conectando con la nube...</div>
                ) : (
                    <div className="grid gap-6">
                        {teams.length === 0 ? (
                            <p className="text-center py-10 text-gray-400 font-bold italic">No hay equipos creados todavía.</p>
                        ) : (
                            teams.map(team => {
                                const isActive = team.status === 'ACTIVE';
                                return (
                                    <div key={team.id} className={`relative overflow-hidden p-6 rounded-3xl border-2 transition-all ${isActive ? 'bg-white dark:bg-gray-800 border-green-500/30' : 'bg-red-50 dark:bg-red-900/10 border-red-500/30 grayscale'}`}>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            {/* Info Equipo */}
                                            <div className="flex items-center gap-4">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner ${isActive ? 'bg-green-100 text-green-600' : 'bg-red-200 text-red-600'}`}>
                                                    {team.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 dark:text-white text-2xl uppercase tracking-tighter leading-none">{team.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-green-500 text-white animate-pulse' : 'bg-red-600 text-white'}`}>
                                                            {isActive ? '● ACTIVO' : '● SUSPENDIDO'}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px] font-mono">ID: {team.id.substring(0,8)}...</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones - BOTONES GRANDES */}
                                            <div className="w-full md:w-auto flex flex-col gap-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(team.id, team.status)}
                                                    className={`w-full md:px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                >
                                                    {isActive ? '⏸️ SUSPENDER EQUIPO' : '▶️ HABILITAR EQUIPO'}
                                                </button>
                                                <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-wider">
                                                    {isActive ? 'El equipo puede entrar a la app' : 'El acceso está bloqueado'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
