import { useEffect, useState, useRef } from 'react';
import { trackVisitAndInstallation, subscribeToPrivateStats } from './firebase';
import { GoldenDustCanvas } from './GoldenDustCanvas';

const CFG = {
  anchorLocal: "2026-04-02T18:00:00",
  nvula: 6008
};

const LUAS = [
  "Yahandi", "Lubeni", "Ngudi", "Ezala", "Nuanini", "Masesi",
  "Nsimbanu", "Lemba", "Isekele", "Zibulani", "Yasah", "Bengami"
];

function getOrdinal(n: number) {
  return n + "ª";
}

const NOMES_NTU: Record<number, string> = {
  0: "Zinga", 1: "Mosy", 2: "Zole", 3: "Tatu", 4: "Ya", 5: "Tanu",
  6: "Sambanu", 7: "Sambuady", 8: "Nana", 9: "Vua", 
  10: "Kumi", 11: "Kumi Mosy", 12: "Kumi Zole"
};

const DIAS_SEMANA_TRADICIONAL = [
  "primeiro dia",   // 0 = Domingo
  "segundo dia",    // 1 = Segunda-feira
  "terceiro dia",   // 2 = Terça-feira
  "quarto dia",     // 3 = Quarta-feira
  "quinto dia",     // 4 = Quinta-feira
  "sexto dia",      // 5 = Sexta-feira
  "sétimo dia"      // 6 = Sábado
];

// Tabela oficial de Luas do Calendário Kongo baseada nos períodos informados
export function obterLuaKongo(data: Date): string {
  const mes = data.getMonth() + 1; // 1 a 12
  const dia = data.getDate();

  // Mapeamento exato das 12 Luas do Calendário Kongo
  if ((mes === 4 && dia >= 7) || (mes === 5 && dia <= 6)) return "1ª LUA • YAHANDI";
  if ((mes === 5 && dia >= 7) || (mes === 6 && dia <= 5)) return "2ª LUA • LUBENI";
  if ((mes === 6 && dia >= 6) || (mes === 7 && dia <= 5)) return "3ª LUA • NGUDI";
  if ((mes === 7 && dia >= 6) || (mes === 8 && dia <= 4)) return "4ª LUA • EZALA";
  if ((mes === 8 && dia >= 5) || (mes === 9 && dia <= 3)) return "5ª LUA • NUANINI";
  if ((mes === 9 && dia >= 4) || (mes === 10 && dia <= 3)) return "6ª LUA • MASESI";
  if ((mes === 10 && dia >= 4) || (mes === 11 && dia <= 2)) return "7ª LUA • NSIMBANU";
  if ((mes === 11 && dia >= 3) || (mes === 12 && dia <= 2)) return "8ª LUA • LEMBA";
  if ((mes === 12 && dia >= 3) || (mes === 1 && dia <= 1)) return "9ª LUA • ISEKELE";
  if (mes === 1) return "10ª LUA • ZIBULANI";
  if ((mes === 2) || (mes === 3 && dia <= 2)) return "11ª LUA • YASAH";
  return "12ª LUA • BENGAMI"; // Março a 6 de Abril
}

function calculateNtu(date = new Date()) {
  const anchor = new Date(CFG.anchorLocal);
  const elapsed = date.getTime() - anchor.getTime();
  const jornadaIndex = Math.floor(elapsed / 86400000);
  const jornada = ((jornadaIndex % 30) + 30) % 30 + 1;
  const luaIndex = Math.floor(jornadaIndex / 30);
  const lua = LUAS[((luaIndex % 12) + 12) % 12];
  const nvula = CFG.nvula + Math.floor(jornadaIndex / 360);
  const luaKongo = obterLuaKongo(date);

  // Ciclo dos dias da semana (Domingo = Primeiro Dia ... Sábado = Sétimo Dia)
  const diaSemana = DIAS_SEMANA_TRADICIONAL[date.getDay()];
  const diaSemanaUpper = diaSemana.toUpperCase();
  const diaSemanaLower = diaSemana.toLowerCase();

  const h = date.getHours();
  let hourNumber: number;
  let period: string;
  if (h >= 18) {
    hourNumber = h - 18;
    period = "DA NOITE";
  } else if (h < 6) {
    hourNumber = h + 6;
    period = "DA NOITE";
  } else {
    hourNumber = h - 6;
    period = "DO DIA";
  }

  const nomeNtu = NOMES_NTU[hourNumber] || "Zinga";

  return {
    hourNumber,
    period,
    nomeNtu,
    horaNtu: `${getOrdinal(hourNumber)} HORA ${period}`,
    jornada,
    jornadaOrdinal: getOrdinal(jornada),
    lua: lua.toUpperCase(),
    luaKongo,
    nvula,
    diaSemana,
    diaSemanaUpper,
    diaSemanaLower,
    dataNtu: `NVULA ${nvula} • ${lua.toUpperCase()} • ${getOrdinal(jornada)} JORNADA`
  };
}

function applyColorIntensity(intensity: number, isDark: boolean) {
  const f = intensity / 100;
  const root = document.documentElement;

  if (isDark) {
    let bgR = 5, bgG = 5, bgB = 5;
    if (intensity <= 100) {
      const ratio = (intensity - 50) / 50;
      bgR = Math.max(0, Math.round(5 * ratio));
      bgG = Math.max(0, Math.round(5 * ratio));
      bgB = Math.max(0, Math.round(5 * ratio));
    } else {
      const ratio = (intensity - 100) / 50;
      bgR = Math.min(255, Math.round(5 + 17 * ratio));
      bgG = Math.min(255, Math.round(5 + 14 * ratio));
      bgB = Math.min(255, Math.round(5 + 7 * ratio));
    }
    const bgColor = `rgb(${bgR}, ${bgG}, ${bgB})`;

    const gpR = Math.min(255, Math.round(252 * (0.6 + 0.4 * f)));
    const gpG = Math.min(255, Math.round(238 * (0.6 + 0.4 * f)));
    const gpB = Math.min(255, Math.round(186 * (0.6 + 0.4 * f)));
    const goldPrimary = `rgb(${gpR}, ${gpG}, ${gpB})`;

    const gsR = Math.min(255, Math.round(212 * f));
    const gsG = Math.min(255, Math.round(175 * f));
    const gsB = Math.min(255, Math.round(55 * f));
    const goldSecondary = `rgb(${gsR}, ${gsG}, ${gsB})`;

    const tmR = Math.min(255, Math.round(197 * f));
    const tmG = Math.min(255, Math.round(168 * f));
    const tmB = Math.min(255, Math.round(128 * f));
    const textMins = `rgb(${tmR}, ${tmG}, ${tmB})`;

    const lnR = Math.min(255, Math.round(74 * f));
    const lnG = Math.min(255, Math.round(59 * f));
    const lnB = Math.min(255, Math.round(24 * f));
    const lineColor = `rgb(${lnR}, ${lnG}, ${lnB})`;

    const dtR = Math.min(255, Math.round(230 * f));
    const dtG = Math.min(255, Math.round(213 * f));
    const dtB = Math.min(255, Math.round(172 * f));
    const dateColor = `rgb(${dtR}, ${dtG}, ${dtB})`;

    const crR = Math.min(255, Math.round(122 * f));
    const crG = Math.min(255, Math.round(106 * f));
    const crB = Math.min(255, Math.round(69 * f));
    const creditColor = `rgb(${crR}, ${crG}, ${crB})`;

    root.style.setProperty('--bg-color', bgColor);
    root.style.setProperty('--gold-primary', goldPrimary);
    root.style.setProperty('--gold-secondary', goldSecondary);
    root.style.setProperty('--text-mins', textMins);
    root.style.setProperty('--line-color', lineColor);
    root.style.setProperty('--date-color', dateColor);
    root.style.setProperty('--credit-color', creditColor);
  } else {
    const ratio = (intensity - 50) / 100;
    const bg = Math.round(253 - 10 * (1 - ratio));
    root.style.setProperty('--bg-color', `rgb(${bg}, ${bg - 2}, ${bg - 6})`);
    root.style.setProperty('--gold-primary', `rgb(${Math.min(255, Math.round(140 * f))}, ${Math.min(255, Math.round(109 * f))}, ${Math.min(255, Math.round(31 * f))})`);
    root.style.setProperty('--gold-secondary', `rgb(${Math.min(255, Math.round(89 * f))}, ${Math.min(255, Math.round(67 * f))}, ${Math.min(255, Math.round(17 * f))})`);
    root.style.setProperty('--text-mins', `rgb(${Math.min(255, Math.round(110 * f))}, ${Math.min(255, Math.round(91 * f))}, ${Math.min(255, Math.round(55 * f))})`);
    root.style.setProperty('--line-color', `rgb(${Math.min(255, Math.round(214 * f))}, ${Math.min(255, Math.round(196 * f))}, ${Math.min(255, Math.round(161 * f))})`);
    root.style.setProperty('--date-color', `rgb(${Math.min(255, Math.round(74 * f))}, ${Math.min(255, Math.round(59 * f))}, ${Math.min(255, Math.round(24 * f))})`);
    root.style.setProperty('--credit-color', `rgb(${Math.min(255, Math.round(138 * f))}, ${Math.min(255, Math.round(121 * f))}, ${Math.min(255, Math.round(82 * f))})`);
  }
}

export default function App() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [ntuData, setNtuData] = useState(() => calculateNtu());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const FIXED_INTENSITY = 113;

  // Modo StandBy e Bateria
  const [isStandbyActive, setIsStandbyActive] = useState(false);
  const [standbyClockType, setStandbyClockType] = useState<'digital' | 'analog'>('digital');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(true);
  const [nowDate, setNowDate] = useState(() => new Date());

  // Sensor de Movimentos de Rotação e Giroscópio
  const [autoLandscapeStandby, setAutoLandscapeStandby] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Modal de Widgets para o Ecrã Principal
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<'4x2' | '2x2'>('4x2');
  const [widgetInstalledToast, setWidgetInstalledToast] = useState(false);

  // Modal do Saber (Geometria Sagrada)
  const [showSacredGeometryModal, setShowSacredGeometryModal] = useState(false);

  // Painel Privado de Administrador (Triplo clique rápido no título)
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStats, setAdminStats] = useState<{ visitas: string | number; instalacoes: string | number }>({
    visitas: "A carregar...",
    instalacoes: "A carregar..."
  });
  const adminClickRef = useRef({ count: 0, lastTime: 0 });

  const handleTitleClick = () => {
    const now = Date.now();
    if (now - adminClickRef.current.lastTime > 1500) {
      adminClickRef.current.count = 1;
    } else {
      adminClickRef.current.count += 1;
    }
    adminClickRef.current.lastTime = now;

    if (adminClickRef.current.count === 3) {
      setShowAdminPanel(true);
      adminClickRef.current.count = 0;
    }
  };

  // Registo automático e silencioso de visitas e instalações no Firebase
  useEffect(() => {
    trackVisitAndInstallation();
  }, []);

  // Escuta estatísticas privadas quando o painel de administrador está aberto
  useEffect(() => {
    if (showAdminPanel) {
      const unsubscribe = subscribeToPrivateStats((stats) => {
        setAdminStats(stats);
      });
      return () => unsubscribe();
    }
  }, [showAdminPanel]);

  useEffect(() => {
    applyColorIntensity(FIXED_INTENSITY, isDarkMode);
  }, [isDarkMode]);

  // Sensor de Rotação (Landscape) e Giroscópio (Movimento de Inclinação 3D)
  useEffect(() => {
    // 1. Deteção de Orientação Paisagem (Landscape) para acionar StandBy automático
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      if (isLandscapeMode && autoLandscapeStandby) {
        setIsStandbyActive(true);
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // 2. Sensor de Movimento / Giroscópio (DeviceOrientation) com filtro contra jitter
    let lastTiltX = 0;
    let lastTiltY = 0;
    let rAFId: number | null = null;

    const handleOrientationMotion = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        // Normaliza ângulo com base na postura padrão de segurar o dispositivo (~45°)
        const rawTargetX = -Math.max(-10, Math.min(10, (e.beta - 45) * 0.2));
        const rawTargetY = Math.max(-10, Math.min(10, e.gamma * 0.2));

        // Filtro deadband contra micro-trepidações/jitter do sensor de rotação
        const deltaX = Math.abs(rawTargetX - lastTiltX);
        const deltaY = Math.abs(rawTargetY - lastTiltY);

        if (deltaX > 0.2 || deltaY > 0.2) {
          if (rAFId !== null) cancelAnimationFrame(rAFId);
          rAFId = requestAnimationFrame(() => {
            lastTiltX = rawTargetX;
            lastTiltY = rawTargetY;
            setTilt({ x: rawTargetX, y: rawTargetY });
          });
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientationMotion);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('deviceorientation', handleOrientationMotion);
      if (rAFId !== null) cancelAnimationFrame(rAFId);
    };
  }, [autoLandscapeStandby]);

  // Deteção da Bateria para o Modo StandBy
  useEffect(() => {
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{
        charging: boolean;
        level: number;
        addEventListener: (type: string, listener: () => void) => void;
      }>;
    };
    if (nav.getBattery) {
      nav.getBattery().then(bat => {
        setIsCharging(bat.charging);
        setBatteryLevel(bat.level);
        bat.addEventListener('chargingchange', () => setIsCharging(bat.charging));
        bat.addEventListener('levelchange', () => setBatteryLevel(bat.level));
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const currentNtu = calculateNtu();
    setNtuData(currentNtu);

    // Apresenta hora, data NTU e ciclo dos dias da semana na notificação inicial
    const timer = setTimeout(() => {
      const msg = `Relógio Kongo • Sabedoria Ancestral\n\nHora NTU: ${currentNtu.horaNtu}\nData NTU: ${currentNtu.dataNtu}\nCiclo Semanal: ${currentNtu.diaSemanaUpper}\n\nBaseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi\nDesenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini`;

      try {
        alert(msg);
      } catch {
        setShowNotificationModal(true);
      }

      // Notificação nativa do sistema / Android (Notification API)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification("Relógio Kongo • Tempo NTU", {
              body: `${currentNtu.horaNtu}\n${currentNtu.dataNtu}\n${currentNtu.diaSemanaUpper}`,
              icon: './icon.png'
            });
          } catch {}
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              try {
                new Notification("Relógio Kongo • Tempo NTU", {
                  body: `${currentNtu.horaNtu}\n${currentNtu.dataNtu}\n${currentNtu.diaSemanaUpper}`,
                  icon: './icon.png'
                });
              } catch {}
            }
          }).catch(() => {});
        }
      }
    }, 300);

    let lastHour = -1;
    let lastMinute = -1;

    function updateClock() {
      const now = new Date();
      setNowDate(now);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const ntu = calculateNtu(now);

      const hourEl = document.getElementById("txtHoraNtu") || document.getElementById("hourDisplay");
      if (hourEl) {
        const newHourText = getOrdinal(ntu.hourNumber) + " HORA " + ntu.period;
        if (hourEl.innerText !== newHourText) {
          hourEl.innerText = newHourText;
        }
        if (lastHour !== -1 && currentHour !== lastHour) {
          hourEl.classList.remove("fade-update");
          void hourEl.offsetWidth; // trigger reflow
          hourEl.classList.add("fade-update");
        }
      }

      const nomeEl = document.getElementById("txtNomeNtu");
      if (nomeEl) {
        if (nomeEl.innerText !== ntu.nomeNtu) {
          nomeEl.innerText = ntu.nomeNtu;
        }
        if (lastHour !== -1 && currentHour !== lastHour) {
          nomeEl.classList.remove("fade-update");
          void nomeEl.offsetWidth;
          nomeEl.classList.add("fade-update");
        }
      }

      const minEl = document.getElementById("txtContadorMinSec") || document.getElementById("minDisplay");
      if (minEl) {
        minEl.innerText = String(now.getMinutes()).padStart(2, '0') + " minutos • " + String(now.getSeconds()).padStart(2, '0') + " segundos";
        if (lastMinute !== -1 && currentMinute !== lastMinute) {
          minEl.classList.remove("fade-update");
          void minEl.offsetWidth; // trigger reflow
          minEl.classList.add("fade-update");
        }
      }

      const luaEl = document.getElementById("txtLuaKongo");
      if (luaEl && luaEl.innerText !== ntu.luaKongo) {
        luaEl.innerText = ntu.luaKongo;
      }

      const dateEl = document.getElementById("dateDisplay");
      if (dateEl) {
        const newDateText = "NVULA " + ntu.nvula + "\n" + ntu.lua + " • " + ntu.jornadaOrdinal + " JORNADA";
        if (dateEl.innerText !== newDateText) {
          dateEl.innerText = newDateText;
          if (lastHour !== -1) {
            dateEl.classList.remove("fade-update");
            void dateEl.offsetWidth;
            dateEl.classList.add("fade-update");
          }
        }
      }

      const weekDayEl = document.getElementById("txtDiaSemana") || document.getElementById("weekdayDisplay");
      if (weekDayEl && weekDayEl.innerText !== ntu.diaSemanaLower) {
        weekDayEl.innerText = ntu.diaSemanaLower;
        if (lastHour !== -1) {
          weekDayEl.classList.remove("fade-update");
          void weekDayEl.offsetWidth;
          weekDayEl.classList.add("fade-update");
        }
      }

      lastHour = currentHour;
      lastMinute = currentMinute;

      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      const gregEl = document.getElementById("txtRelogioGregoriano") || document.getElementById("gregorianDisplay");
      if (gregEl) {
        gregEl.innerText = hh + ":" + mm + ":" + ss + "\n" + d + "/" + m + "/" + y;
      }
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  function toggleTheme() {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.remove("light-mode");
      } else {
        document.body.classList.add("light-mode");
      }
      return next;
    });
  }

  function closeApp() {
    const nav = window.navigator as unknown as { app?: { exitApp?: () => void } };
    if (nav.app && typeof nav.app.exitApp === 'function') {
      nav.app.exitApp();
    } else {
      window.close();
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = "about:blank";
        }
      }, 150);
    }
  }

  // Cálculos para os mostradores
  const sec = nowDate.getSeconds();
  const min = nowDate.getMinutes();
  const hr = nowDate.getHours();
  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const digitalHh = String(nowDate.getHours()).padStart(2, '0');
  const digitalMm = String(nowDate.getMinutes()).padStart(2, '0');

  // Adicionar widget / atalho ao ecrã inicial
  function handleAddWidget() {
    setWidgetInstalledToast(true);
    setTimeout(() => setWidgetInstalledToast(false), 4000);
  }

  return (
    <>
      {/* Canvas animado de partículas de ouro imperial flutuantes que reagem ao giroscópio */}
      <GoldenDustCanvas />

      <div
        className="gyro-interactive"
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <h1
          id="tituloKongo"
          className="titulo-topo"
          onClick={(e) => {
            e.stopPropagation();
            handleTitleClick();
          }}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Toque 3 vezes rápido para abrir o Painel Privado"
        >
          RELÓGIO KONGO
        </h1>

        {/* Relógio N'TU */}
        <div className="hora-destaque" id="txtHoraNtu">{ntuData.horaNtu}</div>
        <div className="sub-hora" id="txtNomeNtu">{ntuData.nomeNtu}</div>
        <div className="tempo-detalhe" id="txtContadorMinSec">
          {String(nowDate.getMinutes()).padStart(2, '0')} minutos • {String(nowDate.getSeconds()).padStart(2, '0')} segundos
        </div>

        <hr className="linha-divisorias" />

        {/* Secção Astronómica com Número e Nome da Lua */}
        <div className="info-astro">NVULA {ntuData.nvula}</div>
        <div className="jornada-texto" id="txtLuaKongo">{ntuData.luaKongo}</div>
        <div className="dia-semana" id="txtDiaSemana">{ntuData.diaSemanaLower}</div>

        <hr className="linha-divisorias" />

        <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'pre-line', marginBottom: '20px' }} id="txtRelogioGregoriano">
          {String(nowDate.getHours()).padStart(2, '0')}:{String(nowDate.getMinutes()).padStart(2, '0')}:{String(nowDate.getSeconds()).padStart(2, '0')}<br />
          {String(nowDate.getDate()).padStart(2, '0')}/{String(nowDate.getMonth() + 1).padStart(2, '0')}/{nowDate.getFullYear()}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={toggleTheme}>Mudar Tema</button>
          <button onClick={() => setIsStandbyActive(true)}>Modo StandBy ⚡</button>
          <button onClick={() => setShowSacredGeometryModal(true)}>Saber ✦</button>
          <button onClick={() => setShowWidgetModal(true)}>Widgets 📱</button>
          <button onClick={closeApp}>Fechar App</button>
        </div>

        {/* Indicador de Sensor de Rotação */}
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: 'var(--text-mins)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          onClick={() => setAutoLandscapeStandby(p => !p)}
          title="Clique para ativar/desativar ativação automática ao rodar o telemóvel"
        >
          <span>🔄 Sensor de Rotação:</span>
          <span style={{ color: autoLandscapeStandby ? 'var(--gold-secondary)' : '#666', fontWeight: 'bold' }}>
            {autoLandscapeStandby ? 'StandBy em Paisagem Ativo' : 'Manual'}
          </span>
        </div>

        <div className="rodape-credito">
          Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi<br />
          Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi e do Gemini
        </div>
      </div>

      {/* ====================================================================
          MODO STANDBY (CARREGAMENTO / EXIBIÇÃO EM PAISAGEM) ANIMADO
          ==================================================================== */}
      {isStandbyActive && (
        <div className="standby-container">
          <button
            className="standby-close-btn"
            onClick={() => setIsStandbyActive(false)}
            title="Sair do Modo StandBy"
          >
            ✕
          </button>

          <div
            className="standby-card gyro-interactive"
            style={{
              transform: `perspective(800px) rotateX(${tilt.x * 0.8}deg) rotateY(${tilt.y * 0.8}deg)`
            }}
          >
            {/* Indicador de Carregamento / Bateria */}
            <div className="standby-charging-badge">
              <span className="standby-bolt">⚡</span>
              <span>
                {isCharging ? 'A Carregar' : 'Bateria'} • {batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : '100%'}
              </span>
            </div>

            {/* Visualização 1: Digital Grande Estilo StandBy com Hora e Data NTU Exclusivas */}
            {standbyClockType === 'digital' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-mins)',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}
                >
                  TEMPO CÓSMICO NTU
                </div>

                <div className="standby-digital-time">
                  <span>{String(ntuData.hourNumber).padStart(2, '0')}</span>
                  <span style={{ opacity: sec % 2 === 0 ? 1 : 0.35, margin: '0 4px', transition: 'opacity 0.2s', color: 'var(--gold-secondary)' }}>:</span>
                  <span>{String(min).padStart(2, '0')}</span>
                  <span style={{ fontSize: '24px', opacity: 0.85, marginLeft: '6px', color: 'var(--text-mins)', verticalAlign: 'middle' }}>
                    :{String(sec).padStart(2, '0')}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '22px',
                    color: 'var(--gold-secondary)',
                    letterSpacing: '1.5px',
                    marginTop: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    textShadow: '0 0 16px rgba(212, 175, 55, 0.45)'
                  }}
                >
                  {ntuData.horaNtu}
                </div>
                <div style={{ fontSize: '16px', color: '#C5A059', fontWeight: 600, letterSpacing: '1px', marginTop: '4px' }}>
                  {ntuData.nomeNtu}
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 24px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    borderRadius: '20px',
                    border: '1px solid var(--line-color)',
                    fontSize: '14px',
                    color: 'var(--date-color)',
                    textAlign: 'center',
                    fontWeight: 600,
                    letterSpacing: '1px'
                  }}
                >
                  <div>{ntuData.dataNtu}</div>
                  <div style={{ fontSize: '14px', color: 'var(--gold-secondary)', fontWeight: 700, letterSpacing: '1.5px', marginTop: '6px' }}>
                    {ntuData.diaSemanaLower}
                  </div>
                </div>
              </div>
            )}

            {/* Visualização 2: Mostrador Analógico Dikenga Estilo StandBy com Hora e Data NTU */}
            {standbyClockType === 'analog' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '32px',
                  flexWrap: 'wrap',
                  width: '100%',
                  padding: '10px 0'
                }}
              >
                {/* Mostrador Redondo com Ponteiros Animados e Geometria Sagrada */}
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                  <svg viewBox="0 0 200 200" width="180" height="180" style={{ filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.35))' }}>
                    <circle cx="100" cy="100" r="94" fill="#060606" stroke="var(--gold-secondary)" strokeWidth="2.5" />
                    <circle cx="100" cy="100" r="88" fill="none" stroke="var(--line-color)" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Geometria Sagrada Saber: Kalunga e Mwamba */}
                    <line x1="100" y1="16" x2="100" y2="184" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="1.2" />
                    <line x1="16" y1="100" x2="184" y2="100" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="1.2" />

                    <text x="100" y="32" fill="var(--gold-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">12 • TUKULA</text>
                    <text x="180" y="104" fill="var(--gold-primary)" fontSize="9" fontWeight="bold" textAnchor="end">LUVEMBA</text>
                    <text x="100" y="174" fill="var(--gold-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">6 • MUSONI</text>
                    <text x="20" y="104" fill="var(--gold-primary)" fontSize="9" fontWeight="bold" textAnchor="start">KALA</text>

                    <line
                      x1="100"
                      y1="100"
                      x2="100"
                      y2="50"
                      stroke="var(--gold-primary)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      transform={`rotate(${hrDeg} 100 100)`}
                    />

                    <line
                      x1="100"
                      y1="100"
                      x2="100"
                      y2="34"
                      stroke="var(--gold-secondary)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      transform={`rotate(${minDeg} 100 100)`}
                    />

                    <line
                      x1="100"
                      y1="115"
                      x2="100"
                      y2="28"
                      stroke="#FCEEBA"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      transform={`rotate(${secDeg} 100 100)`}
                    />

                    <circle cx="100" cy="100" r="5" fill="var(--gold-secondary)" stroke="#050505" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Painel Lateral Cósmico com Hora e Data NTU Exclusivas */}
                <div style={{ textAlign: 'left', minWidth: '190px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-mins)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
                    TEMPO CÓSMICO NTU
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--gold-secondary)', margin: '6px 0', lineHeight: 1.2 }}>
                    {ntuData.horaNtu}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-mins)', marginBottom: '8px' }}>
                    {String(min).padStart(2, '0')} minutos • {String(sec).padStart(2, '0')} segundos
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--date-color)', fontWeight: 600, borderTop: '1px solid var(--line-color)', paddingTop: '8px', lineHeight: 1.4 }}>
                    <div>{ntuData.dataNtu}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gold-secondary)', fontWeight: 700, letterSpacing: '1.5px', marginTop: '4px' }}>
                      {ntuData.diaSemanaUpper}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alternador de Estilos StandBy */}
            <div className="standby-switch-bar">
              <button
                className={`standby-tab-btn ${standbyClockType === 'digital' ? 'active' : ''}`}
                onClick={() => setStandbyClockType('digital')}
              >
                Digital Imperial
              </button>
              <button
                className={`standby-tab-btn ${standbyClockType === 'analog' ? 'active' : ''}`}
                onClick={() => setStandbyClockType('analog')}
              >
                Mostrador Dikenga
              </button>
            </div>

            {/* Créditos Obrigatórios no Modo StandBy */}
            <div style={{ fontSize: '9px', color: 'var(--credit-color)', textAlign: 'center', marginTop: '14px', lineHeight: 1.45 }}>
              <div>Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi</div>
              <div style={{ marginTop: '2px', opacity: 0.9 }}>
                Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE WIDGETS PARA O ECRÃ PRINCIPAL DO TELEMÓVEL
          ==================================================================== */}
      {showWidgetModal && (
        <div className="widget-modal-overlay">
          <div className="widget-modal-content">
            <button
              className="standby-close-btn"
              onClick={() => setShowWidgetModal(false)}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '17px', color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
              WIDGETS NO ECRÃ PRINCIPAL
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-mins)', marginBottom: '14px' }}>
              Exiba o tempo cósmico Kongo diretamente no ecrã de início do seu telemóvel.
            </p>

            {/* Seletor de Modelo de Widget */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px' }}>
              <button
                className={`standby-tab-btn ${selectedWidgetType === '4x2' ? 'active' : ''}`}
                onClick={() => setSelectedWidgetType('4x2')}
              >
                Widget Panorâmico (4x2)
              </button>
              <button
                className={`standby-tab-btn ${selectedWidgetType === '2x2' ? 'active' : ''}`}
                onClick={() => setSelectedWidgetType('2x2')}
              >
                Widget Quadrado (2x2)
              </button>
            </div>

            {/* Pré-visualização do Widget 4x2 */}
            {selectedWidgetType === '4x2' && (
              <div className="widget-preview-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gold-secondary)', fontWeight: 'bold', letterSpacing: '1px' }}>
                    RELÓGIO KONGO
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-mins)' }}>
                    ⚡ {batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : '100%'}
                  </span>
                </div>

                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--gold-primary)', lineHeight: 1 }}>
                  {digitalHh}:{digitalMm}
                </div>

                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--gold-secondary)', margin: '6px 0 2px' }}>
                  {ntuData.horaNtu}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--date-color)' }}>
                  {ntuData.dataNtu}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gold-secondary)', fontWeight: 'bold', marginTop: '3px' }}>
                  {ntuData.diaSemanaUpper}
                </div>
              </div>
            )}

            {/* Pré-visualização do Widget 2x2 */}
            {selectedWidgetType === '2x2' && (
              <div className="widget-preview-card" style={{ maxWidth: '200px', margin: '12px auto', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>
                  R. KONGO
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                  {digitalHh}:{digitalMm}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gold-secondary)', fontWeight: 'bold' }}>
                  {ntuData.hourNumber}ª HORA
                </div>
                <div style={{ fontSize: '9px', color: 'var(--date-color)', marginTop: '4px' }}>
                  {ntuData.lua} • {ntuData.jornadaOrdinal}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--gold-secondary)', fontWeight: 'bold', marginTop: '2px' }}>
                  {ntuData.diaSemanaUpper}
                </div>
              </div>
            )}

            {/* Ações e Instruções */}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleAddWidget}
                style={{
                  backgroundColor: 'var(--gold-secondary)',
                  color: '#050505',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  marginBottom: '10px'
                }}
              >
                📌 Adicionar Widget ao Ecrã Inicial
              </button>

              {widgetInstalledToast && (
                <div
                  style={{
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid var(--gold-secondary)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    color: 'var(--gold-primary)',
                    marginBottom: '10px'
                  }}
                >
                  ✓ No Android: Toque sem soltar no seu ecrã inicial &gt; Escolha <strong>Widgets</strong> &gt; Selecione <strong>Relógio Kongo</strong>.
                </div>
              )}

              <p style={{ fontSize: '11px', color: 'var(--text-mins)', lineHeight: 1.4 }}>
                Ao instalar como aplicação ou gerar o APK final, o widget nativo de tempo cósmico fica permanentemente disponível no seletor de widgets do telemóvel.
              </p>

              {/* Créditos Obrigatórios no Modal de Widgets */}
              <div style={{ fontSize: '10px', color: 'var(--credit-color)', textAlign: 'center', marginTop: '14px', lineHeight: 1.45 }}>
                <div>Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi</div>
                <div style={{ marginTop: '2px', opacity: 0.9 }}>
                  Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DA GEOMETRIA SAGRADA SABER (DIKENGA DIA KONGO)
          ==================================================================== */}
      {showSacredGeometryModal && (
        <div className="widget-modal-overlay">
          <div className="widget-modal-content" style={{ maxWidth: '440px' }}>
            <button
              className="standby-close-btn"
              onClick={() => setShowSacredGeometryModal(false)}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '16px', color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '1px' }}>
              GEOMETRIA SAGRADA • SABER
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-mins)', marginBottom: '14px' }}>
              Cosmograma Dikenga Dia Kongo & Contagem Temporal N'TU (Ciclo de 0 a 12 Horas)
            </p>

            {/* Representação Gráfica Sacra do Cosmograma Saber */}
            <div style={{ margin: '0 auto 14px', maxWidth: '240px' }}>
              <svg viewBox="0 0 240 240" width="100%" height="auto" style={{ filter: 'drop-shadow(0 0 16px rgba(212, 175, 55, 0.4))' }}>
                {/* Círculo Cósmico Sagrado (Ndingi / Kalunga) */}
                <circle cx="120" cy="120" r="110" fill="#050505" stroke="var(--gold-secondary)" strokeWidth="2.5" />
                <circle cx="120" cy="120" r="102" fill="none" stroke="var(--line-color)" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="120" cy="120" r="72" fill="none" stroke="rgba(212, 175, 55, 0.2)" strokeWidth="1" />

                {/* Eixo Kalunga (Horizontal) - Limiar entre Ku Nseke (físico) e Ku Mpemba (ancestral) */}
                <line x1="10" y1="120" x2="230" y2="120" stroke="var(--gold-secondary)" strokeWidth="2" strokeDasharray="6 3" />
                {/* Eixo Mwamba (Vertical) - Caminho do Poder Espiritual */}
                <line x1="120" y1="10" x2="120" y2="230" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />

                {/* Marcadores dos 4 Quadrantes Sagrados do Saber */}
                {/* 1. TUKULA (Zénite / 12h do ciclo N'TU / Meio-dia) */}
                <circle cx="120" cy="22" r="8" fill="#F0C63E" stroke="#050505" strokeWidth="2" />
                <text x="120" y="42" fill="var(--gold-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">TUKULA (12H / 6ª DIA)</text>

                {/* 2. LUVEMBA (Ocaso / 18h / 0ª Hora da Noite) */}
                <circle cx="218" cy="120" r="8" fill="#FFFAC4" stroke="#050505" strokeWidth="2" />
                <text x="175" y="136" fill="var(--gold-primary)" fontSize="9" fontWeight="bold" textAnchor="middle">LUVEMBA (0H N)</text>

                {/* 3. MUSONI (Nadir / 00h / 6ª Hora da Noite) */}
                <circle cx="120" cy="218" r="8" fill="#D4AF37" stroke="#050505" strokeWidth="2" />
                <text x="120" y="206" fill="var(--gold-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">MUSONI (6ª NOITE)</text>

                {/* 4. KALA (Alvorada / 06h / 0ª Hora do Dia) */}
                <circle cx="22" cy="120" r="8" fill="#DFBE91" stroke="#050505" strokeWidth="2" />
                <text x="65" y="136" fill="var(--gold-primary)" fontSize="9" fontWeight="bold" textAnchor="middle">KALA (0H D)</text>

                {/* Espiral Sagrada de Concepção e Renascimento */}
                <path
                  d="M 120 120 C 135 105, 150 90, 160 120 C 170 150, 140 180, 100 170 C 60 160, 50 110, 80 80 C 105 55, 165 55, 190 95"
                  fill="none"
                  stroke="var(--gold-secondary)"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  opacity="0.8"
                />

                {/* Centro Sagrado (V-Cross / Ponto N'TU) */}
                <circle cx="120" cy="120" r="5" fill="var(--gold-primary)" stroke="#050505" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Explicação da Geometria Sagrada e Temporalidade */}
            <div style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text-mins)', lineHeight: 1.5, background: 'rgba(212, 175, 55, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line-color)' }}>
              <div style={{ color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>
                ✦ A Contagem Temporal N'TU (0 a 12 Horas):
              </div>
              <p style={{ marginBottom: '8px' }}>
                O dia cósmico divide-se em dois ciclos de 0 a 12 horas: a <strong>Hora da Noite</strong> (iniciada às 18:00 no Luvemba) e a <strong>Hora do Dia</strong> (iniciada às 06:00 no Kala).
              </p>
              <div style={{ color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>
                ✦ O Ciclo Sagrado dos Dias da Semana:
              </div>
              <p>
                Apresentado logo abaixo da Lua e da jornada cósmica, segue a tradição ancestral do <strong>Primeiro Dia</strong> (Domingo) ao <strong>Sétimo Dia</strong> (Sábado).
              </p>
            </div>

            {/* Créditos Obrigatórios */}
            <div style={{ fontSize: '10px', color: 'var(--credit-color)', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
              <div>Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi</div>
              <div style={{ marginTop: '2px', opacity: 0.9 }}>
                Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--gold-secondary)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
            }}
          >
            <h2 style={{ fontSize: '16px', color: 'var(--gold-secondary)', marginBottom: '12px', fontWeight: 'bold' }}>
              Relógio Kongo • Sabedoria Ancestral
            </h2>
            <div style={{ fontSize: '15px', color: 'var(--gold-primary)', fontWeight: 'bold', margin: '8px 0' }}>
              Hora NTU: {ntuData.horaNtu}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--date-color)', marginBottom: '4px' }}>
              Data NTU: {ntuData.dataNtu}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '16px' }}>
              Ciclo Semanal: {ntuData.diaSemanaUpper}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--credit-color)', marginBottom: '20px', lineHeight: 1.5 }}>
              <div>Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi</div>
              <div style={{ marginTop: '3px' }}>
                Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setShowNotificationModal(false)}>Fechar Notificação</button>
              <button onClick={closeApp}>Fechar App</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PAINEL PRIVADO DE ADMINISTRADOR (ACESSO POR TRIPLO CLIQUE NO TÍTULO)
          ==================================================================== */}
      {showAdminPanel && (
        <div id="painelAdminModal" className="widget-modal-overlay" style={{ display: 'flex' }}>
          <div
            id="painelAdmin"
            className="widget-modal-content"
            style={{
              maxWidth: '460px',
              backgroundColor: '#121212',
              border: '2px solid #D4AF37',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.45)',
              textAlign: 'left'
            }}
          >
            <button
              className="standby-close-btn"
              onClick={() => setShowAdminPanel(false)}
              title="Fechar Painel Privado"
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>🔒</span>
              <h3 style={{ margin: 0, color: 'var(--gold-secondary)', fontSize: '16px', letterSpacing: '1.5px', textAlign: 'center' }}>
                PAINEL DE CONTROLO PRIVADO
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-mins)', marginBottom: '16px', textAlign: 'center' }}>
              Métricas exclusivas em tempo real sincronizadas via Firebase Realtime Database.
            </p>

            <div
              className="dado-estatistica"
              style={{
                margin: '14px 0',
                fontSize: '15px',
                color: 'var(--gold-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(212, 175, 55, 0.08)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.25)'
              }}
            >
              <span>📊 Total de Acessos:</span>
              <strong id="contadorVisitas" style={{ fontSize: '20px', color: 'var(--gold-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {adminStats.visitas}
              </strong>
            </div>

            <div
              className="dado-estatistica"
              style={{
                margin: '14px 0',
                fontSize: '15px',
                color: 'var(--gold-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(212, 175, 55, 0.08)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.25)'
              }}
            >
              <span>📱 Instalações WebApp (PWA):</span>
              <strong id="contadorInstalacoes" style={{ fontSize: '20px', color: 'var(--gold-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {adminStats.instalacoes}
              </strong>
            </div>

            <div style={{ background: '#080808', border: '1px solid var(--line-color)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '11px', color: 'var(--text-mins)', lineHeight: 1.5 }}>
              <div style={{ color: 'var(--gold-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>
                📡 Estado da Conexão Firebase:
              </div>
              <div>• Projeto: <strong>muindanayah-relogio-kongo</strong></div>
              <div>• Realtime DB: <strong>muindanayah-relogio-kongo-default-rtdb.firebaseio.com</strong></div>
              <div>• Modo de Registo: Silencioso e assíncrono com tolerância offline.</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button
                className="botao-fechar"
                onClick={() => setShowAdminPanel(false)}
                style={{
                  backgroundColor: 'var(--gold-secondary)',
                  color: '#050505',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  margin: 0,
                  cursor: 'pointer'
                }}
              >
                Fechar Painel
              </button>
            </div>

            {/* Créditos Obrigatórios */}
            <div style={{ fontSize: '10px', color: 'var(--credit-color)', textAlign: 'center', marginTop: '14px', lineHeight: 1.45 }}>
              <div>Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi</div>
              <div style={{ marginTop: '2px', opacity: 0.9 }}>
                Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
