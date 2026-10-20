// =============================================================
//  FIREBASE: una sola app para salas (red.js) y nube (nube.js).
//  Esta configuración es pública por diseño: identifica el proyecto,
//  no da permisos. Lo que protege los datos son las reglas.
// =============================================================
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyDfmvjGRPhUzR2b90yjzpq8Bg9llYclmds',
  authDomain: 'kasugchi.firebaseapp.com',
  databaseURL: 'https://kasugchi-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'kasugchi',
  storageBucket: 'kasugchi.firebasestorage.app',
  messagingSenderId: '1017762951602',
  appId: '1:1017762951602:web:3f11670c7dbf6f91cdb4ab'
};

export const app = getApps()[0] || initializeApp(firebaseConfig);
