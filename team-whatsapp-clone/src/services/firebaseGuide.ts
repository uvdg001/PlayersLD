/**
 * Este archivo es una guía para conectar tu app con Firebase.
 * No necesitas instalar nada nuevo si ya tienes firebase en tu proyecto.
 */

/*
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

// Función para enviar mensaje con la hora del servidor
export const sendMessage = async (chatId: string, text: string, senderId: string) => {
  const db = getFirestore();
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text,
    senderId,
    timestamp: serverTimestamp(), // ESTO SOLUCIONA TU PROBLEMA DE LA HORA
    status: 'sent'
  });
};

// Función para escuchar mensajes en tiempo real
export const subscribeToMessages = (chatId: string, callback: (messages: any[]) => void) => {
  const db = getFirestore();
  const q = query(
    collection(db, 'chats', chatId, 'messages'), 
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convertimos el timestamp de Firebase a Date de JS
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    callback(messages);
  });
};
*/
