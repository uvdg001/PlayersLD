import React, { useState, useEffect, useRef } from 'react';
import type { MyTeam, Match, Opponent } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useLanguage } from '../../contexts/LanguageContext.tsx';

interface MyTeamPageProps {
    team: MyTeam | null;
    onSave: (teamData: MyTeam) => void;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    onTogglePinAuth: () => void;
    isPinAuthEnabled: boolean;
    matches: Match[];
    opponents: Opponent[];
}

export const MyTeamPage: React.FC<MyTeamPageProps> = ({ team, onSave, isAdmin, isSuperAdmin, onTogglePinAuth, isPinAuthEnabled, matches, opponents }) => {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<MyTeam>({ 
        name: '', 
        shieldUrl: '', 
        primaryColor: '#4f46e5', 
        secondaryColor: '#ffffff' 
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => { 
        if (team) {
            setFormData({
                name: team.name || '',
                shieldUrl: team.shieldUrl || '',
                primaryColor: team.primaryColor || '#4f46e5',
                secondaryColor: team.secondaryColor || '#ffffff'
            });
        } 
    }, [team]);

    const upcomingMatches = matches.filter(m => m.status !== 'FINALIZADO').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);

    const handleSave = () => { onSave(formData); setIsEditing(false); };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width, height = img.height, MAX_SIZE = 500;
                    if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            toast.info("Procesando escudo...");
            const compressed = await compressImage(e.target.files[0]);
            setFormData(prev => ({ ...prev, shieldUrl: compressed }));
            toast.success("Escudo listo");
        }
    };

    if (!team && !isEditing) return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg"><button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Configurar Equipo</button></div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t.myTeam}</h2>
                 {isAdmin && !isEditing && <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">Editar</button>}
            </div>

            {isEditing ? (
                 <div className="space-y-6 animate-fadeIn">
                    {/* Image Preview & Upload */}
                    <div className="flex flex-col items-center gap-4">
                        {formData.shieldUrl ? (
                            <img src={formData.shieldUrl} alt="Previsualización" className="w-32 h-32 rounded-full object-contain bg-gray-100 p-2 border-4 border-white shadow-md" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cambiar Escudo
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Equipo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: Los Leones FC" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color Primario</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="h-10 w-full rounded cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color Secundario</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="h-10 w-full rounded cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors">Guardar Cambios</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center animate-fadeIn">
                    <div className="relative mb-4">
                        {formData.shieldUrl ? (
                            <img src={formData.shieldUrl} alt="Escudo" className="w-40 h-40 rounded-full object-contain p-2 bg-white shadow-lg" />
                        ) : (
                            <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-4xl">🛡️</div>
                        )}
                        {/* Color Bubbles */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: formData.primaryColor }} title="Color Primario"></div>
                            <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: formData.secondaryColor }} title="Color Secundario"></div>
                        </div>
                    </div>
                    
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-2">{formData.name}</h3>
                </div>
            )}

            <div className="mt-10 pt-6 border-t dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t.nextMatch}</h3>
                {upcomingMatches.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingMatches.map(match => (
                            <div key={match.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow border-l-4 border-indigo-500">
                                <div className="flex justify-between font-bold text-sm text-gray-500 dark:text-gray-300 mb-2">
                                    <span>{match.date}</span>
                                    <span>{match.time} hs</span>
                                </div>
                                <div className="text-center my-3 text-lg font-bold text-gray-800 dark:text-white">
                                    <span style={{ color: formData.primaryColor }}>{formData.name}</span> 
                                    <span className="text-gray-400 mx-2">vs</span> 
                                    <span>{opponents.find(o => o.id === match.opponentId)?.name}</span>
                                </div>
                                <div className="text-center text-xs text-gray-500 mt-2 flex justify-center items-center gap-1">
                                    <span>📍</span> {match.location}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-4 italic">No hay partidos programados.</p>}
            </div>

            {isSuperAdmin && (
                <div className="mt-10 pt-6 border-t dark:border-gray-700 bg-red-50 dark:bg-red-900/10 p-4 rounded border border-red-200 dark:border-red-800">
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                        <span>👑</span> Zona de Peligro (Solo Dueño)
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Autenticación por PIN</p>
                            <p className="text-xs text-gray-500">Si está activo, los jugadores deben ingresar su PIN para entrar.</p>
                        </div>
                        <button onClick={onTogglePinAuth} className={`${isPinAuthEnabled ? 'bg-green-600' : 'bg-gray-400'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}>
                            <span className={`${isPinAuthEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};