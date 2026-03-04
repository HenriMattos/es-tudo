// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DO FIREBASE
// Substitua os valores abaixo pelos do seu projeto Firebase.
// Como obter:
//   1. Acesse https://console.firebase.google.com
//   2. Crie um projeto (ou use um existente)
//   3. Vá em "Configurações do projeto" > "Seus apps" > "App da Web"
//   4. Copie o firebaseConfig e cole aqui
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyDfFr6-MPaGQzvL_xaQdD3P-0VqOsnjJek",
  authDomain: "es-tudo.firebaseapp.com",
  projectId: "es-tudo",
  storageBucket: "es-tudo.firebasestorage.app",
  messagingSenderId: "106000198607",
  appId: "1:106000198607:web:6c0830e4320764f9eb80ba",
  measurementId: "G-DVHY18FKV3"
};

// ─────────────────────────────────────────────────────────────────────────────
// CÓDIGO DE CONVITE DO GRUPO
// Apenas quem tiver esse código poderá criar conta na plataforma.
// Mude para qualquer palavra/número secreto que quiser.
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_INVITE_CODE = "estudos2025";

// ─────────────────────────────────────────────────────────────────────────────
// Inicialização
// ─────────────────────────────────────────────────────────────────────────────

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Habilita persistência offline (dados ficam em cache no navegador)
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
