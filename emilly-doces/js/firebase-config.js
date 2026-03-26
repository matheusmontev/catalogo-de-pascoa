// Inicialização oficial do Firebase v9 (Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Configurações injetadas pelo Firebase MCP
const firebaseConfig = {
  apiKey: "AIzaSyCF6xcxqU5pDMcrBbC290Vtfy7z0s7-NOs",
  authDomain: "cardapio-pascoa-emilly.firebaseapp.com",
  projectId: "cardapio-pascoa-emilly",
  storageBucket: "cardapio-pascoa-emilly.firebasestorage.app",
  messagingSenderId: "233283091789",
  appId: "1:233283091789:web:623537f0496c9d6af4cb04"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
