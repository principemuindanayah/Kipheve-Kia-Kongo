import { useEffect, useState } from 'react';

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

function calculateNtu(date = new Date()) {
  const anchor = new Date(CFG.anchorLocal);
  const elapsed = date.getTime() - anchor.getTime();
  const jornadaIndex = Math.floor(elapsed / 86400000);
  const jornada = ((jornadaIndex % 30) + 30) % 30 + 1;
  const luaIndex = Math.floor(jornadaIndex / 30);
  const lua = LUAS[((luaIndex % 12) + 12) % 12];
  const nvula = CFG.nvula + Math.floor(jornadaIndex / 360);

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

  return {
    hourNumber,
    period,
    horaNtu: `${getOrdinal(hourNumber)} HORA ${period}`,
    jornada,
    jornadaOrdinal: getOrdinal(jornada),
    lua: lua.toUpperCase(),
    nvula,
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

    // Apresenta hora e data NTU na notificação inicial
    const timer = setTimeout(() => {
      const msg = `Relógio Kongo • Sabedoria Ancestral\n\nHora NTU: ${currentNtu.horaNtu}\nData NTU: ${currentNtu.dataNtu}\n\nBaseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi`;

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
              body: `${currentNtu.horaNtu}\n${currentNtu.dataNtu}`,
              icon: './icon.png'
            });
          } catch {}
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              try {
                new Notification("Relógio Kongo • Tempo NTU", {
                  body: `${currentNtu.horaNtu}\n${currentNtu.dataNtu}`,
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

      const hourEl = document.getElementById("hourDisplay");
      if (hourEl) {
        const newHourText = getOrdinal(ntu.hourNumber) + " HORA\n" + ntu.period;
        if (hourEl.innerText !== newHourText) {
          hourEl.innerText = newHourText;
        }
        if (lastHour !== -1 && currentHour !== lastHour) {
          hourEl.classList.remove("fade-update");
          void hourEl.offsetWidth; // trigger reflow
          hourEl.classList.add("fade-update");
        }
      }

      const minEl = document.getElementById("minDisplay");
      if (minEl) {
        minEl.innerText = String(now.getMinutes()).padStart(2, '0') + " minutos • " + String(now.getSeconds()).padStart(2, '0') + " segundos";
        if (lastMinute !== -1 && currentMinute !== lastMinute) {
          minEl.classList.remove("fade-update");
          void minEl.offsetWidth; // trigger reflow
          minEl.classList.add("fade-update");
        }
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

      lastHour = currentHour;
      lastMinute = currentMinute;

      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      const gregEl = document.getElementById("gregorianDisplay");
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
        <h1>RELÓGIO KONGO</h1>

        <div id="hourDisplay">--ª HORA<br />DA NOITE</div>
        <div id="minDisplay">-- minutos • -- segundos</div>

        <div className="line"></div>

        <div id="dateDisplay">NVULA ---- • LUA • JORNADA</div>

        <div className="line"></div>

        <div id="gregorianDisplay">--:--:--<br />--/--/----</div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={toggleTheme}>Mudar Tema</button>
          <button onClick={() => setIsStandbyActive(true)}>Modo StandBy ⚡</button>
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

        <div className="credits">Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi</div>
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
                  {ntuData.dataNtu}
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
                {/* Mostrador Redondo com Ponteiros Animados */}
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                  <svg viewBox="0 0 200 200" width="180" height="180" style={{ filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.35))' }}>
                    <circle cx="100" cy="100" r="94" fill="#060606" stroke="var(--gold-secondary)" strokeWidth="2.5" />
                    <circle cx="100" cy="100" r="88" fill="none" stroke="var(--line-color)" strokeWidth="1" strokeDasharray="3 3" />

                    <line x1="100" y1="16" x2="100" y2="184" stroke="rgba(212, 175, 55, 0.25)" strokeWidth="1" />
                    <line x1="16" y1="100" x2="184" y2="100" stroke="rgba(212, 175, 55, 0.25)" strokeWidth="1" />

                    <text x="100" y="34" fill="var(--gold-primary)" fontSize="13" fontWeight="bold" textAnchor="middle">12</text>
                    <text x="176" y="104" fill="var(--gold-primary)" fontSize="13" fontWeight="bold" textAnchor="middle">3</text>
                    <text x="100" y="174" fill="var(--gold-primary)" fontSize="13" fontWeight="bold" textAnchor="middle">6</text>
                    <text x="24" y="104" fill="var(--gold-primary)" fontSize="13" fontWeight="bold" textAnchor="middle">9</text>

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
                    {ntuData.dataNtu}
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
            <div style={{ fontSize: '14px', color: 'var(--date-color)', marginBottom: '16px' }}>
              Data NTU: {ntuData.dataNtu}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--credit-color)', marginBottom: '20px' }}>
              Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setShowNotificationModal(false)}>Fechar Notificação</button>
              <button onClick={closeApp}>Fechar App</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
