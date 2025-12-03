
import React, { useState, useRef, useMemo } from 'react';
import type { Player } from '../types.ts';
import { PlayerRole } from '../types.ts';
import { StarRating } from './StarRating.tsx';
import { useToast } from '../hooks/useToast.ts'; // Import useToast

interface PlayerFormProps {
    player: Player | null;
    onSave: (player: Player | Omit<Player, 'id'>) => void;
    onCancel: () => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ player, onSave, onCancel }) => {
    const toast = useToast();

    const [formData, setFormData] = useState({
        firstName: player?.firstName || '',
        lastName: player?.lastName || '',
        nickname: player?.nickname || '',
        photoUrl: player?.photoUrl || '',
        skillLevel: player?.skillLevel || 3,
        role: player?.role || PlayerRole.MEDIOCAMPISTA_CENTRAL,
        pin: player?.pin || '0000',
        birthDate: player?.birthDate || '',
        jerseyNumber: player?.jerseyNumber ?? null, // Default to null, not undefined
        alternativeRoles: player?.alternativeRoles || [],
        observations: player?.observations || '',
        // Campos nuevos
        phone: player?.phone || '',
        address: player?.address || '',
        email: player?.email || '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let parsedValue: any = value; // Default to string value

        if (type === 'number') {
            if (value === '') {
                parsedValue = null; // When cleared, set to null
            } else {
                parsedValue = parseInt(value, 10);
                if (isNaN(parsedValue)) {
                    // Handle cases where user types non-numeric characters, reset to null
                    parsedValue = null;
                }
            }
        }
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSkillChange = (newSkill: number) => {
        setFormData(prev => ({ ...prev, skillLevel: newSkill }));
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 500; // Reducir a 500px máx para ahorrar espacio

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    // Comprimir a JPEG 0.8
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                toast.info("Procesando imagen...");
                const compressedBase64 = await compressImage(file);
                setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
                toast.success("Imagen lista");
            } catch (error) {
                console.error("Error comprimiendo imagen", error);
                toast.error("Error al procesar la imagen");
            }
        }
    };
    
    const handleAltRoleChange = (index: number, value: PlayerRole | '') => {
        const newRoles = [...(formData.alternativeRoles || [])];
        if (value === '') {
            newRoles.splice(index, 1);
        } else {
            newRoles[index] = value;
        }
        setFormData(prev => ({...prev, alternativeRoles: newRoles.filter(Boolean)}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (dataToSave.jerseyNumber === undefined) {
             dataToSave.jerseyNumber = null;
        }

        if (player) {
            onSave({ ...player, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };
    
    const availableRoles = useMemo(() => {
        // Excluir DT y Ayudante de roles seleccionables para jugadores de campo
        return Object.values(PlayerRole).filter(r => r !== PlayerRole.DT && r !== PlayerRole.AYUDANTE);
    }, []);

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{player ? 'Editar Jugador' : 'Agregar Nuevo Jugador'}</h3>
            
            <div className="flex items-center space-x-4">
                {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto del Jugador</label>
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
                        className="mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Subir Imagen
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Se ajustará automáticamente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium">Nombre</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium">Apellido</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="nickname" className="block text-sm font-medium">Apodo</label>
                    <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium">Rol Principal</label>
                    <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                        {Object.values(PlayerRole).map(roleValue => (
                            <option key={roleValue} value={roleValue}>{roleValue}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="pin" className="block text-sm font-medium">PIN de 4 dígitos</label>
                    <input 
                        type="tel"
                        name="pin" 
                        value={formData.pin} 
                        onChange={handleChange} 
                        required 
                        maxLength={4} 
                        pattern="\d{4}"
                        title="El PIN debe contener 4 números."
                        autoComplete="off"
                        className={inputClass} />
                </div>
                 <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium">Fecha de Nacimiento</label>
                    <input 
                        type="date"
                        name="birthDate" 
                        value={formData.birthDate} 
                        onChange={handleChange} 
                        className={inputClass} />
                </div>
                 <div>
                    <label htmlFor="jerseyNumber" className="block text-sm font-medium">N° de Camiseta</label>
                    <input type="number" name="jerseyNumber" value={formData.jerseyNumber ?? ''} onChange={handleChange} className={inputClass} />
                </div>
            </div>

            {/* Datos de Contacto (NUEVO BLOQUE) */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos de Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium">Celular</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+54 9 ..." className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nombre@ejemplo.com" className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium">Dirección</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Calle 123" className={inputClass} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                 <div>
                    <label className="block text-sm font-medium">Rol Alternativo 1</label>
                     <select 
                        value={formData.alternativeRoles?.[0] || ''} 
                        onChange={(e) => handleAltRoleChange(0, e.target.value as PlayerRole)}
                        className={inputClass}
                     >
                        <option value="">Ninguno</option>
                        {availableRoles.filter(r => r !== formData.role).map(roleValue => (
                            <option key={roleValue} value={roleValue}>{roleValue}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Rol Alternativo 2</label>
                     <select 
                        value={formData.alternativeRoles?.[1] || ''} 
                        onChange={(e) => handleAltRoleChange(1, e.target.value as PlayerRole)}
                        className={inputClass}
                        disabled={!formData.alternativeRoles?.[0]}
                     >
                        <option value="">Ninguno</option>
                        {availableRoles.filter(r => r !== formData.role && r !== formData.alternativeRoles?.[0]).map(roleValue => (
                            <option key={roleValue} value={roleValue}>{roleValue}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium">Nivel de Habilidad</label>
                 <StarRating rating={formData.skillLevel} onRatingChange={handleSkillChange} interactive={true} />
            </div>

            <div>
                <label htmlFor="observations" className="block text-sm font-medium">Observaciones</label>
                <textarea 
                    name="observations" 
                    value={formData.observations} 
                    onChange={handleChange} 
                    rows={3}
                    placeholder="Lesiones, historial médico, notas técnicas..."
                    className={inputClass} 
                />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                    Guardar Jugador
                </button>
            </div>
        </form>
    );
};