import React, { useState, useRef } from 'react';
import type { Venue } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';

interface VenueFormProps {
    venue: Venue | null;
    onSave: (venue: Venue | Omit<Venue, 'id'>) => void;
    onCancel: () => void;
}

export const VenueForm: React.FC<VenueFormProps> = ({ venue, onSave, onCancel }) => {
    const toast = useToast();
    const [formData, setFormData] = useState({
        name: venue?.name || '',
        address: venue?.address || '',
        mapLink: venue?.mapLink || '',
        photoUrl: venue?.photoUrl || '',
    });
     const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                    const MAX_SIZE = 500; 

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
                console.error(error);
                toast.error("Error al procesar la imagen");
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Limpiamos los datos antes de guardar (trim de espacios)
        const cleanData = {
            ...formData,
            name: formData.name.trim(),
            address: formData.address.trim(),
            mapLink: formData.mapLink.trim(),
        };

        if (venue) {
            onSave({ ...venue, ...cleanData });
        } else {
            onSave(cleanData);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{venue ? 'Editar Cancha' : 'Agregar Nueva Cancha'}</h3>
            
             <div className="flex items-center space-x-4">
                {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 rounded-md object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 1 1-.45 0 .225.225 0 0 1 .45 0Z" />
                        </svg>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto de la Cancha</label>
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
                </div>
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium">Nombre de la Cancha</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
            </div>
            
            <div>
                <label htmlFor="address" className="block text-sm font-medium">Dirección</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
                <label htmlFor="mapLink" className="block text-sm font-medium">Enlace a Google Maps (Opcional)</label>
                <input 
                    type="text" 
                    name="mapLink" 
                    value={formData.mapLink} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="Pega el link de Google o escribe la dirección"
                />
                <p className="text-xs text-gray-500 mt-1">Si no tienes el link, escribe la dirección y la buscaremos automáticamente.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                    Guardar Cancha
                </button>
            </div>
        </form>
    );
};