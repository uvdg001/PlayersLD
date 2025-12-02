
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import type { ChatMessage, Player } from '../types';

// Helper to access environment variables safely without crashing
const getEnv = () => {
    try {
        // Safe access to import.meta.env
        return (import.meta && (import.meta as any).env) ? (import.meta as any).env : {};
    } catch (e) {
        return {};
    }
};

let app: firebase.app.App | null = null;
let db: firebase.firestore.Firestore | null = null;
let isAttemptedInitialize = false; // Bandera para saber si ya intentamos inicializar

// Esta función intenta inicializar Firebase una única vez y devuelve la instancia de Firestore si tiene éxito.
export const getFirestoreInstance = (): firebase.firestore.Firestore | null => {
    if (db) {
        return db; // Ya inicializado con éxito
    }

    if (!isAttemptedInitialize) { // Solo intentamos inicializar una vez
        isAttemptedInitialize = true; // Marcamos que ya intentamos
        const env = getEnv();

        // Verificamos si las variables de entorno necesarias están presentes
        if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID || !env.VITE_FIREBASE_APP_ID) {
            console.warn("Firebase no está configurado: Faltan variables de entorno. La aplicación funcionará en modo offline.");
            return null;
        }

        try {
            const firebaseConfig = {
                apiKey: env.VITE_FIREBASE_API_KEY,
                authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: env.VITE_FIREBASE_APP_ID,
                measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
            };

            if (!firebase.apps.length) {
                 app = firebase.initializeApp(firebaseConfig);
            } else {
                 app = firebase.app();
            }
            db = firebase.firestore(app);
            console.log("Firebase inicializado con éxito.");
            return db;
        } catch (e) {
            console.error("Error al inicializar Firebase. La app funcionará en modo offline.", e);
            app = null;
            db = null; // Aseguramos que db sea null si falla la inicialización
            return null;
        }
    }
    return db; // Si ya intentamos inicializar y falló, db seguirá siendo null
};

// Nueva función para verificar si Firestore está disponible
export const isFirestoreAvailable = (): boolean => {
    return !!db;
};

// Helper: Elimina o convierte valores undefined a null para que Firestore no falle
const cleanPayload = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    if (Array.isArray(data)) {
        return data.map(item => cleanPayload(item));
    }
    if (typeof data === 'object' && !(data instanceof Date)) {
        const cleaned: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value === undefined) {
                    cleaned[key] = null; // Convert undefined to null
                } else {
                    cleaned[key] = cleanPayload(value);
                }
            }
        }
        return cleaned;
    }
    return data;
};

export const subscribeToMessages = (
    matchId: string, 
    callback: (messages: ChatMessage[]) => void, 
    onError: (error: Error) => void
): (() => void) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) {
        console.warn("Firestore no está disponible para suscripción de mensajes. La UI debería mostrar el estado offline.");
        onError(new Error("Firebase Offline")); // Notifica el error de conexión
        return () => {}; // Devuelve una función de desuscripción vacía
    }

    const messagesCollection = firestoreDb.collection('matches').doc(matchId).collection('messages');
    const q = messagesCollection.orderBy('timestamp', 'asc');

    return q.onSnapshot((querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp)?.toDate().getTime() || Date.now(),
            } as ChatMessage);
        });
        callback(messages);
    }, (error) => {
        console.error("Error en la suscripción a Firestore:", error);
        onError(error); // Notifica el error a App.tsx
    });
};

export const addMessage = async (matchId: string, sender: Player, content: { text?: string; audioUrl?: string }) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) throw new Error("Firebase no inicializado o no disponible.");
    try {
        await firestoreDb.collection('matches').doc(matchId).collection('messages').add({
            senderId: sender.id,
            senderName: sender.nickname,
            senderPhotoUrl: sender.photoUrl,
            ...content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            reactions: {},
        });
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const deleteMessage = async (matchId: string, messageId: string) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) throw new Error("Firebase no inicializado o no disponible.");
    try {
        await firestoreDb.collection('matches').doc(matchId).collection('messages').doc(messageId).delete();
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
};

export const toggleReaction = async (matchId: string, messageId: string, emoji: string, userId: number) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) throw new Error("Firebase no inicializado o no disponible.");
    
    const messageRef = firestoreDb.collection('matches').doc(matchId).collection('messages').doc(messageId);
    try {
        await firestoreDb.runTransaction(async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists) {
                throw new Error("El documento no existe!");
            }
            
            const message = messageDoc.data() as ChatMessage;
            const reactions = { ...(message.reactions || {}) };
            const usersForEmoji: number[] = reactions[emoji] || [];

            if (usersForEmoji.includes(userId)) {
                // Eliminar usuario de la reacción
                reactions[emoji] = usersForEmoji.filter(id => id !== userId);
                if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                }
            } else {
                // Agregar usuario a la reacción
                reactions[emoji] = [...usersForEmoji, userId];
            }
            transaction.update(messageRef, { reactions });
        });
    } catch (e) {
        console.error("Error updating reactions: ", e);
        throw e;
    }
};

export const subscribeToCollection = <T>(
    collectionName: string, 
    docId: string | null = null, 
    callback: (data: T[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) {
        console.warn("Firestore no está disponible para suscripción de colección. La UI debería mostrar el estado offline.");
        onError(new Error("Firebase Offline")); // Notifica el error de conexión
        return () => {};
    }

    if (docId) { // Subscribe to a single document
        return firestoreDb.collection(collectionName).doc(docId).onSnapshot((doc) => {
            if (doc.exists) {
                callback([{ id: doc.id, ...doc.data() } as T]);
            } else {
                callback([]); // Document doesn't exist, return empty array
            }
        }, (error) => {
            console.error(`Error subscribing to document ${collectionName}/${docId}:`, error);
            onError(error); // Notifica el error a App.tsx
        });
    } else { // Subscribe to a whole collection
        return firestoreDb.collection(collectionName).onSnapshot((snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: Number(doc.id), ...doc.data() } as T); // Convert id to number
            });
            callback(items);
        }, (error) => {
            console.error(`Error subscribing to collection ${collectionName}:`, error);
            onError(error); // Notifica el error a App.tsx
        });
    }
};


export const saveDocument = async (collectionName: string, docId: string, data: any) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) throw new Error("Firebase no inicializado o no disponible.");
    
    // Sanitizar datos antes de guardar
    const cleanData = cleanPayload(data);
    
    console.log(`Guardando en ${collectionName}/${docId}...`, cleanData);
    try {
        await firestoreDb.collection(collectionName).doc(docId).set(cleanData, { merge: true });
        console.log(`Guardado exitoso en ${collectionName}/${docId}`);
    } catch (e) {
        console.error(`Error saving document in ${collectionName}:`, e);
        throw e;
    }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) throw new Error("Firebase no inicializado o no disponible.");
    try {
        await firestoreDb.collection(collectionName).doc(docId).delete();
    } catch (e) {
        console.error(`Error deleting document from ${collectionName}:`, e);
        throw e;
    }
};

export const isCollectionEmpty = async (collectionName: string): Promise<boolean> => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) return true; // Si no hay DB, consideramos que la colección está "vacía" para la app
    try {
        const snapshot = await firestoreDb.collection(collectionName).limit(1).get();
        return snapshot.empty;
    } catch (e) {
        console.error(`Error checking if collection ${collectionName} is empty:`, e);
        throw e; // Propagamos el error para que App.tsx pueda reaccionar
    }
};

export const isDocumentEmpty = async (collectionName: string, docId: string): Promise<boolean> => {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) return true; // Si no hay DB, consideramos que el documento está "vacío" para la app
    try {
        const docRef = firestoreDb.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        return !docSnap.exists;
    } catch (e) {
        console.error(`Error checking if document ${collectionName}/${docId} is empty:`, e);
        throw e; // Propagamos el error para que App.tsx pueda reaccionar
    }
};
