import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, runTransaction, onValue } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCy8u-i9ZzOnL_ZTO853zaONbKxRLdd0C4",
  authDomain: "muindanayah-relogio-kongo.firebaseapp.com",
  databaseURL: "https://muindanayah-relogio-kongo-default-rtdb.firebaseio.com",
  projectId: "muindanayah-relogio-kongo",
  storageBucket: "muindanayah-relogio-kongo.firebasestorage.app",
  messagingSenderId: "232829611514",
  appId: "1:232829611514:web:70fbf644f0910f16d58843",
  measurementId: "G-9JXHQ1YD7S"
};

let appInstance: any = null;
let dbInstance: any = null;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbInstance = getDatabase(appInstance);
} catch (e) {
  console.warn('[Firebase] Inicialização em modo offline/silencioso:', e);
}

export const db = dbInstance;

/**
 * Registo automático e silencioso de visitas e instalações PWA no Firebase Realtime Database
 */
export function trackVisitAndInstallation() {
  if (!db) return;

  try {
    // Evita contar visitas múltiplas na mesma aba por refresh contínuo usando sessionStorage
    const hasRecordedVisit = sessionStorage.getItem('kongo_session_visited');
    if (!hasRecordedVisit) {
      sessionStorage.setItem('kongo_session_visited', 'true');
      const visitaRef = ref(db, 'estatisticas/visitasTotais');
      runTransaction(visitaRef, (current) => (current || 0) + 1).catch(() => {});
    }

    // Registo de PWA instalado
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      const hasRecordedInstall = localStorage.getItem('kongo_pwa_installed_recorded');
      if (!hasRecordedInstall) {
        localStorage.setItem('kongo_pwa_installed_recorded', 'true');
        const instalacaoRef = ref(db, 'estatisticas/instalacoesPWA');
        runTransaction(instalacaoRef, (current) => (current || 0) + 1).catch(() => {});
      }
    }

    // Ouve evento nativo de instalação PWA caso o utilizador instale agora
    window.addEventListener('appinstalled', () => {
      try {
        localStorage.setItem('kongo_pwa_installed_recorded', 'true');
        const instalacaoRef = ref(db, 'estatisticas/instalacoesPWA');
        runTransaction(instalacaoRef, (current) => (current || 0) + 1).catch(() => {});
      } catch {
        // Silencia erros offline
      }
    }, { once: true });
  } catch {
    // Silencia erros offline
  }
}

/**
 * Escuta em tempo real as estatísticas privadas para o painel de administrador
 */
export function subscribeToPrivateStats(
  callback: (data: { visitas: number; instalacoes: number }) => void
): () => void {
  if (!db) {
    callback({ visitas: 0, instalacoes: 0 });
    return () => {};
  }

  let visitas = 0;
  let instalacoes = 0;

  try {
    const unVisitas = onValue(
      ref(db, 'estatisticas/visitasTotais'),
      (snapshot) => {
        visitas = snapshot.val() || 0;
        callback({ visitas, instalacoes });
      },
      () => {}
    );

    const unInstalacoes = onValue(
      ref(db, 'estatisticas/instalacoesPWA'),
      (snapshot) => {
        instalacoes = snapshot.val() || 0;
        callback({ visitas, instalacoes });
      },
      () => {}
    );

    return () => {
      unVisitas();
      unInstalacoes();
    };
  } catch {
    return () => {};
  }
}
