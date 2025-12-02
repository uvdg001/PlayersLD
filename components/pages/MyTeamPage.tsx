import React, { useState, useEffect, useRef } from 'react';
import type { MyTeam, Player } from '../../types.ts';

interface MyTeamPageProps {
    team: MyTeam | null;
    onSave: (teamData: MyTeam) => void;
    isAdmin: boolean;
    currentUser: Player;
    players: Player[];
    onUpdatePlayer: (player: Player) => void;
}

const SubAdminManager: React.FC<{
    players: Player[];
    onUpdatePlayer: (player: Player) => void;
}> = ({ players, onUpdatePlayer }) => {
    
    const subAdmins = players.filter(p => p.isSubAdmin && p.adminExpires && new Date(p.adminExpires) > new Date());
    const availableSlots = 2 - subAdmins.length;

    const handleToggleSubAdmin = (player: Player) => {
        const isCurrentlySubAdmin = subAdmins.some(p => p.id === player.id);
        if (isCurrentlySubAdmin) {
            // Revoke
            onUpdatePlayer({ ...player, isSubAdmin: false, adminExpires: undefined });
        } else {
            // Grant
            if (availableSlots > 0) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 7);
                onUpdatePlayer({ ...player, isSubAdmin: true, adminExpires: expiryDate.toISOString() });
            } else {
                alert("Ya has alcanzado el límite de 2 administradores suplentes.");
            }
        }
    };
    
    return (
        <div className="mt-8 pt-6 border-t dark:border-gray-700">
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Administradores Suplentes</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Puedes nombrar hasta 2 suplentes. El permiso dura 7 días y es renovable.</p>
             <div className="space-y-3">
                {players.filter(p => p.id !== 9 && p.id !== 1).map(player => {
                    const isSubAdmin = subAdmins.some(p => p.id === player.id);
                    const expiryDate = isSubAdmin ? new Date(player.adminExpires!).toLocaleDateString('es-ES') : null;

                    return (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <img src={player.photoUrl || undefined} alt={player.nickname} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="font-semibold">{player.nickname}</p>
                                    {isSubAdmin && <p className="text-xs text-green-600 dark:text-green-400">Vence: {expiryDate}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleSubAdmin(player)}
                                disabled={!isSubAdmin && availableSlots <= 0}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                    isSubAdmin 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isSubAdmin ? 'Revocar' : 'Nombrar'}
                            </button>
                        </div>
                    );
                })}
             </div>
        </div>
    );
};


export const MyTeamPage: React.FC<MyTeamPageProps> = ({ team, onSave, isAdmin, currentUser, players, onUpdatePlayer }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<MyTeam>({
        name: '',
        shieldUrl: '',
        primaryColor: '#ffffff',
        secondaryColor: '#000000',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (team) {
            setFormData(team);
        }
    }, [team]);

    const handleSave = () => {
        onSave(formData);
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, shieldUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    if (!team && !isEditing) {
        return (
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Información del Equipo</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Aún no has configurado los datos de tu equipo.</p>
                 {isAdmin && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                    >
                        Configurar Mi Equipo
                    </button>
                 )}
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mi Equipo</h2>
                 {isAdmin && !isEditing && (
                     <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Editar</button>
                 )}
            </div>

            {isEditing ? (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nombre del Equipo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Escudo del Equipo</label>
                        <div className="mt-1 flex items-center space-x-4">
                             {formData.shieldUrl && (
                                <img src={formData.shieldUrl} alt="Escudo preview" className="w-16 h-16 rounded-full object-cover bg-gray-200" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Subir Imagen
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium">Color Primario</label>
                            <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="mt-1 block w-full rounded-md" />
                        </div>
                         <div className="flex-1">
                            <label className="block text-sm font-medium">Color Secundario</label>
                            <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="mt-1 block w-full rounded-md" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    {formData.shieldUrl && <img src={formData.shieldUrl} alt="Escudo" className="w-32 h-32 rounded-full object-cover mb-4" />}
                    <h3 className="text-3xl font-bold">{formData.name}</h3>
                    <div className="flex items-center space-x-4 mt-4">
                        <div>
                            <p className="text-sm text-gray-500">Primario</p>
                            <div className="w-12 h-12 rounded-full" style={{ backgroundColor: formData.primaryColor, border: '2px solid #ccc' }}></div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Secundario</p>
                             <div className="w-12 h-12 rounded-full" style={{ backgroundColor: formData.secondaryColor, border: '2px solid #ccc' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {(currentUser.id === 9 || currentUser.id === 1) && (
                <SubAdminManager players={players} onUpdatePlayer={onUpdatePlayer} />
            )}
        </div>
    );
};