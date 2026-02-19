
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import type { ChatMessage, Player, Team } from '../types.ts';
import { INITIAL_APP_SETTINGS, INITIAL_MY_TEAM, INITIAL_PLAYERS, NEW_TEAM_INITIAL_PLAYER } from '../constants.ts';

const getEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch (e) {
        return {};
    }
};

let app: firebase.app.App | null = null;
let db: firebase.firestore.Firestore | null = null;
let isAttemptedInitialize = false;

export const getFirestoreInstance = (): firebase.firestore.Firestore | null => {
    if (db) return db;
    if (!isAttemptedInitialize) {
        isAttemptedInitialize = true;
        const env = getEnv();
        if (!env.VITE_FIREBASE_PROJECT_ID) {
            console.error("❌ No se encontró PROJECT_ID en el archivo .env");
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
            console.log("🚀 Firebase conectado al proyecto:", env.VITE_FIREBASE_PROJECT_ID);
            return db;
        } catch (e) {
            console.error("❌ Error de inicialización:", e);
            return null;
        }
    }
    return db;
};

const sanitize = (data: any): any => {
    if (data === undefined || data === null) return null;
    if (Array.isArray(data)) return data.map(item => sanitize(item));
    if (typeof data === 'object' && !(data instanceof Date)) {
        const cleaned: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const val = sanitize(data[key]);
                if (val !== undefined) cleaned[key] = val;
            }
        }
        return cleaned;
    }
    return data;
};

const getTeamPath = (teamId: string, col: string) => `teams/${teamId}/${col}`;

export const findTeamByCode = async (code: string): Promise<Team | null> => {
    const fdb = getFirestoreInstance();
    if (!fdb) return null;
    try {
        const snap = await fdb.collection('teams').where('adminCode', '==', code).limit(1).get();
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Team;
    } catch (e) {
        console.error("Error buscando equipo:", e);
        return null;
    }
};

export const subscribeToTeam = (teamId: string, callback: (team: Team | null) => void): (() => void) => {
    const fdb = getFirestoreInstance();
    if (!fdb || !teamId || teamId === 'super-admin') return () => {};
    return fdb.collection('teams').doc(teamId).onSnapshot((doc) => {
        if (doc.exists) callback({ id: doc.id, ...doc.data() } as Team);
        else callback(null);
    });
};

export const createTeamWithInitialData = async (name: string, adminCode: string) => {
    const fdb = getFirestoreInstance();
    if (!fdb) throw new Error("Firebase no configurado");

    const teamPayload = sanitize({ name, adminCode, status: 'ACTIVE', createdAt: Date.now() });
    const docRef = await fdb.collection('teams').add(teamPayload);
    const teamId = docRef.id;

    if (adminCode.toLowerCase() === 'utn') {
        for (const p of INITIAL_PLAYERS) await saveDocument(teamId, 'players', p.id.toString(), p);
    } else {
        await saveDocument(teamId, 'players', '1', NEW_TEAM_INITIAL_PLAYER);
    }

    await saveDocument(teamId, 'settings', 'appSettings', INITIAL_APP_SETTINGS);
    await saveDocument(teamId, 'myTeam', 'info', { ...INITIAL_MY_TEAM, name });
    return teamId;
};

export const getAllTeams = async (): Promise<Team[]> => {
    const fdb = getFirestoreInstance();
    if (!fdb) return [];
    try {
        const snap = await fdb.collection('teams').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    } catch (e) {
        return [];
    }
};

export const updateTeamStatus = async (teamId: string, status: 'ACTIVE' | 'INACTIVE') => {
    const fdb = getFirestoreInstance();
    if (!fdb) return;
    await fdb.collection('teams').doc(teamId).update({ status });
};

export const saveDocument = async (teamId: string, col: string, docId: string, data: any) => {
    const fdb = getFirestoreInstance();
    if (!fdb) throw new Error("Offline");
    await fdb.collection(getTeamPath(teamId, col)).doc(String(docId)).set(sanitize(data), { merge: true });
};

export const deleteDocument = async (teamId: string, col: string, docId: string | number) => {
    const fdb = getFirestoreInstance();
    if (!fdb) return;
    // Forzamos String() para que Firestore siempre encuentre el documento por su nombre/ID
    await fdb.collection(getTeamPath(teamId, col)).doc(String(docId)).delete();
};

export const subscribeToCollection = <T>(teamId: string, col: string, docId: string | null, callback: (d: T[]) => void, onError: (e: any) => void) => {
    const fdb = getFirestoreInstance();
    if (!fdb || !teamId || teamId === 'super-admin') return () => {};
    const path = getTeamPath(teamId, col);
    if (docId) {
        return fdb.collection(path).doc(String(docId)).onSnapshot(d => callback(d.exists ? [{ id: d.id, ...d.data() } as T] : []), onError);
    }
    return fdb.collection(path).onSnapshot(s => {
        const items: any[] = [];
        s.forEach(d => items.push({ id: isNaN(Number(d.id)) ? d.id : Number(d.id), ...d.data() }));
        callback(items);
    }, onError);
};

export const subscribeToMessages = (teamId: string, matchId: string, callback: (m: ChatMessage[]) => void, onError: (e: any) => void) => {
    const fdb = getFirestoreInstance();
    if (!fdb || !teamId) return () => {};
    const path = `${getTeamPath(teamId, 'matches')}/${matchId}/messages`;
    return fdb.collection(path).orderBy('timestamp', 'asc').onSnapshot(s => {
        const msgs: ChatMessage[] = [];
        s.forEach(d => {
            const data = d.data();
            msgs.push({ id: d.id, ...data, timestamp: data.timestamp?.toDate().getTime() || Date.now() } as ChatMessage);
        });
        callback(msgs);
    }, onError);
};

export const addMessage = async (teamId: string, matchId: string, sender: Player, content: any) => {
    const fdb = getFirestoreInstance();
    if (!fdb || !teamId) return;
    const path = `${getTeamPath(teamId, 'matches')}/${matchId}/messages`;
    await fdb.collection(path).add(sanitize({
        senderId: sender.id, senderName: sender.nickname, senderPhotoUrl: sender.photoUrl,
        ...content, timestamp: firebase.firestore.FieldValue.serverTimestamp(), reactions: {}
    }));
};

export const deleteMessage = async (teamId: string, matchId: string, messageId: string) => {
    const fdb = getFirestoreInstance();
    if (!fdb) return;
    const path = `${getTeamPath(teamId, 'matches')}/${matchId}/messages`;
    await fdb.collection(path).doc(messageId).delete();
};

export const toggleReaction = async (teamId: string, matchId: string, messageId: string, emoji: string, playerId: number) => {
    const fdb = getFirestoreInstance();
    if (!fdb) return;
    const path = `${getTeamPath(teamId, 'matches')}/${matchId}/messages`;
    const docRef = fdb.collection(path).doc(messageId);
    await fdb.runTransaction(async (t) => {
        const doc = await t.get(docRef);
        if (!doc.exists) return;
        const reactions = doc.data()?.reactions || {};
        const reactors = reactions[emoji] || [];
        const newReactors = reactors.includes(playerId) ? reactors.filter((id: number) => id !== playerId) : [...reactors, playerId];
        t.update(docRef, { [`reactions.${emoji}`]: newReactors });
    });
};

export const isCollectionEmpty = async (teamId: string, col: string) => {
    const fdb = getFirestoreInstance();
    if (!fdb || !teamId) return true;
    try {
        const snap = await fdb.collection(getTeamPath(teamId, col)).limit(1).get();
        return snap.empty;
    } catch (e) { return true; }
};
