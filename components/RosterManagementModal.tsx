
import React, { useState, useMemo } from 'react';
import type { Player } from '../types.ts';
import { PlayerRole } from '../types.ts';
import { PlayerForm } from './PlayerForm.tsx';
import { useToast } from '../hooks/useToast.ts';

interface RosterManagementModalProps {
    players: Player[];
    onClose: () => void;
    onAddPlayer: (newPlayer: Omit<Player, 'id'>) => Promise<void>;
    onUpdatePlayer: (player: Player) => Promise<void>;
    onDeletePlayer: (playerId: number) => Promise<void>;
    onViewProfile: (player: Player) => void;
    isCurrentUserSuperAdmin: boolean;
    superAdminPlayerId: number;
    onTransferSuperAdmin: (newAdminId: number) => void;
    onToggleSubAdmin: (playerId: number) => void;
}

const ConfirmationModal: React.FC<{
    player: Player;
    onConfirm: () => void;
    onCancel: () => void;
    type: 'delete' | 'transfer';
}> = ({ player, onConfirm, onCancel, type }) => (
    <div className="absolute inset-0 bg-black/80 flex justify-center items-center rounded-xl z-[60] p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-sm border-4 border-indigo-500">
            <div className="text-5xl mb-4">{type === 'delete' ? '🗑️' : '👑'}</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                {type === 'delete' ? '¿Eliminar Jugador?' : '¡Traspaso de Mando!'}
            </h3>
            <p className="my-4 text-sm text-gray-600 dark:text-gray-300 leading-tight">
                {type === 'delete' ? (
                    <>¿Estás seguro de eliminar a <strong>{player.nickname}</strong> de la plantilla permanente?</>
                ) : (
                    <>Vas a nombrar a <strong>{player.nickname}</strong> como el nuevo Dueño.<br/><br/><span className="text-red-600 font-bold uppercase italic">⚠️ Tú perderás tus poderes de Administrador Principal inmediatamente.</span></>
                )}
            </p>
            <div className="flex flex-col gap-2 mt-6">
                <button onClick={onConfirm} className={`w-full py-3 text-sm font-black uppercase rounded-xl shadow-lg ${type === 'delete' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {type === 'delete' ? 'SÍ, ELIMINAR' : 'SÍ, ENTREGAR CORONA'}
                </button>
                <button onClick={onCancel} className="w-full py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    CANCELAR
                </button>
            </div>
        </div>
    </div>
);

const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/z/g, 's').replace(/c/g, 's');
};

const RosterItemPhoto: React.FC<{ url: string }> = ({ url }) => {
    const [hasError, setHasError] = useState(false);
    
    if (!url || hasError) {
        return (
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-xl border-2 border-gray-200 dark:border-gray-500">
                👤
            </div>
        );
    }
    return (
        <img 
            src={url} 
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm" 
            onError={() => setHasError(true)}
            alt=""
        />
    );
};

export const RosterManagementModal: React.FC<RosterManagementModalProps> = ({
    players,
    onClose,
    onAddPlayer,
    onUpdatePlayer,
    onDeletePlayer,
    onViewProfile,
    isCurrentUserSuperAdmin,
    superAdminPlayerId,
    onTransferSuperAdmin,
    onToggleSubAdmin
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
    const [playerToTransferAdmin, setPlayerToTransferAdmin] = useState<Player | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    const sortedPlayers = useMemo(() => {
        const term = normalizeText(searchTerm);
        return [...players]
            .filter(p => normalizeText(p.firstName).includes(term) || normalizeText(p.lastName).includes(term) || normalizeText(p.nickname).includes(term))
            .sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [players, searchTerm]);

    const handleEdit = (player: Player) => { setEditingPlayer(player); setIsFormOpen(true); };
    const handleAddNew = () => { setEditingPlayer(null); setIsFormOpen(true); };
    
    const handleSavePlayer = async (playerData: Player | Omit<Player, 'id'>) => {
        if ('id' in playerData) {
            await onUpdatePlayer(playerData);
            toast.success("Jugador actualizado");
        } else {
            await onAddPlayer(playerData);
            toast.success("Nuevo jugador agregado");
        }
        setIsFormOpen(false); 
        setEditingPlayer(null);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                 {playerToDelete && <ConfirmationModal player={playerToDelete} onConfirm={async () => { await onDeletePlayer(playerToDelete.id); setPlayerToDelete(null); toast.success("Jugador eliminado"); }} onCancel={() => setPlayerToDelete(null)} type="delete" />}
                {playerToTransferAdmin && <ConfirmationModal player={playerToTransferAdmin} onConfirm={async () => { await onTransferSuperAdmin(playerToTransferAdmin.id); setPlayerToTransferAdmin(null); toast.success(`¡Mando transferido!`); }} onCancel={() => setPlayerToTransferAdmin(null)} type="transfer" />}
                
                <header className="flex flex-col md:flex-row justify-between items-center p-6 border-b dark:border-gray-700 gap-3 bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-gray-800 dark:text-gray-100">Gestión de Plantilla</h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <input type="text" placeholder="Buscar por nombre/apodo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 md:w-64 px-4 py-2 rounded-xl border-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-indigo-500" />
                        <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">✕</button>
                    </div>
                </header>

                <main className="p-6 overflow-y-auto">
                    {isFormOpen ? (
                        <PlayerForm player={editingPlayer} onSave={handleSavePlayer} onCancel={() => setIsFormOpen(false)} />
                    ) : (
                        <>
                            <div className="flex justify-end mb-6">
                                <button onClick={handleAddNew} className="px-6 py-3 bg-green-600 text-white rounded-2xl shadow-lg font-black uppercase italic tracking-tighter hover:bg-green-700 transition-all active:scale-95">+ AGREGAR JUGADOR</button>
                            </div>
                            <div className="grid gap-3">
                                {sortedPlayers.map(player => {
                                    const isSuperAdminPlayer = player.id === superAdminPlayerId;
                                    const isSubAdmin = player.isSubAdmin;
                                    const isStaff = player.role === PlayerRole.DT || player.role === PlayerRole.AYUDANTE;
                                    return (
                                        <div key={player.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isStaff ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200' : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent'}`}>
                                            <div className="flex items-center space-x-4">
                                                <RosterItemPhoto url={player.photoUrl} />
                                                <div>
                                                    <p className="font-black text-gray-800 dark:text-gray-200 leading-tight uppercase tracking-tight">
                                                        {player.nickname} <span className="text-[10px] font-normal text-gray-400 lowercase italic">({player.firstName})</span>
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black bg-gray-200 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded shadow-sm">ID: {player.id}</span>
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${isStaff ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'}`}>{player.role}</span>
                                                        {isSuperAdminPlayer && <span className="text-yellow-500 text-sm animate-pulse" title="Dueño / Administrador Principal">👑</span>}
                                                        {isSubAdmin && !isSuperAdminPlayer && <span className="text-green-500 text-sm" title="Sub Admin / Ayudante">🛡️</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                {isCurrentUserSuperAdmin && !isSuperAdminPlayer && (
                                                    <>
                                                        <button onClick={() => onToggleSubAdmin(player.id)} className={`p-2.5 rounded-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-all ${player.isSubAdmin ? 'text-green-600' : 'text-gray-300'}`} title={player.isSubAdmin ? "Quitar Sub-Admin" : "Hacer Sub-Admin"}>🛡️</button>
                                                        <button onClick={() => setPlayerToTransferAdmin(player)} className="p-2.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-600 shadow-sm transition-all hover:scale-110" title="Entregar Corona (Pasar Mando)">👑</button>
                                                    </>
                                                )}
                                                <button onClick={() => onViewProfile(player)} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm text-blue-500 transition-all" title="Ver Perfil">👁️</button>
                                                <button onClick={() => handleEdit(player)} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm text-indigo-500 transition-all" title="Editar">✏️</button>
                                                {!isSuperAdminPlayer && (
                                                    <button onClick={() => setPlayerToDelete(player)} className="p-2.5 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all" title="Eliminar">🗑️</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};
