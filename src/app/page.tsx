"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

// SVG Components

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"></path>
  </svg>
);

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let formOpenDay = 0;

    const calculateTime = () => {
      const now = new Date();
      
      if (now.getDay() === formOpenDay) {
        setIsFormOpen(true);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const diff = endOfDay.getTime() - now.getTime();
        
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60),
        });
        return;
      }

      setIsFormOpen(false);
      // Calculate next open day
      const daysUntilNext = (formOpenDay + 7 - now.getDay()) % 7;
      const nextOpenDate = new Date(now);
      nextOpenDate.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
      nextOpenDate.setHours(0, 0, 0, 0);

      const diff = nextOpenDate.getTime() - now.getTime();
      
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    // 1. Inicia o timer e libera a UI instantaneamente com o valor padrão (0 = Domingo)
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    
    setIsFadingOut(true);
    setTimeout(() => setLoading(false), 500);

    // 2. Busca a configuração no fundo. Quando chegar, recalcula.
    fetch("/api/config")
      .then(res => res.ok ? res.json() : null)
      .then(config => {
        if (config) {
          formOpenDay = parseInt(config.DIA_ABERTURA_FORM, 10) || 0;
          calculateTime();
        }
      })
      .catch(console.error);

    return () => clearInterval(interval);
  }, []);



  if (loading) {
    return (
      <div className={`${styles.container} ${isFadingOut ? styles.fadeOutOpacity : styles.fadeInOpacity}`} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--background)', zIndex: 9999 }}>
        <Image src="/logo.png" alt="Level Up Logo" width={160} height={160} style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxWidth: '80vw' }} className={styles.pulseLogo} priority />
      </div>
    );
  }

  return (
    <main className={styles.mainLayout}>
      <div className={styles.contentWrapper}>
        <div className={`${styles.timerSection} ${isFormOpen ? styles.timerAlert : ''} ${styles.stagger1}`}>
          <div className={styles.timerHeader}>
            <div className={styles.headerLineLeft}></div>
            <span>{isFormOpen ? 'OS DESAFIOS FECHAM EM' : 'OS DESAFIOS ABREM EM'}</span>
            <div className={styles.headerLineRight}></div>
          </div>
          
          {timeLeft ? (
            <div className={styles.countdownRow}>
              <div className={styles.timeBlock}>
                <div className={styles.timeValueBlock}>
                  {String(timeLeft.d).padStart(2, "0").split('').map((char, i) => (
                    <span key={i} className={styles.timeDigit}>{char}</span>
                  ))}
                </div>
                <span className={styles.timeLabel}>DIAS</span>
              </div>
              <div className={styles.separator}>
                <div className={styles.separatorDot}></div>
              </div>
              <div className={styles.timeBlock}>
                <div className={styles.timeValueBlock}>
                  {String(timeLeft.h).padStart(2, "0").split('').map((char, i) => (
                    <span key={i} className={styles.timeDigit}>{char}</span>
                  ))}
                </div>
                <span className={styles.timeLabel}>HORAS</span>
              </div>
              <div className={styles.separator}>
                <div className={styles.separatorDot}></div>
              </div>
              <div className={styles.timeBlock}>
                <div className={styles.timeValueBlock}>
                  {String(timeLeft.m).padStart(2, "0").split('').map((char, i) => (
                    <span key={i} className={styles.timeDigit}>{char}</span>
                  ))}
                </div>
                <span className={styles.timeLabel}>MINUTOS</span>
              </div>
              <div className={styles.separator}>
                <div className={styles.separatorDot}></div>
              </div>
              <div className={styles.timeBlock}>
                <div className={styles.timeValueBlock}>
                  {String(timeLeft.s).padStart(2, "0").split('').map((char, i) => (
                    <span key={i} className={styles.timeDigit}>{char}</span>
                  ))}
                </div>
                <span className={styles.timeLabel}>SEGUNDOS</span>
              </div>
            </div>
          ) : (
            <div className={styles.loadingTimer}>CALCULANDO...</div>
          )}
          <div className={styles.timerBottomGlow}></div>
        </div>

        <div className={styles.cardsSection}>
          <div className={`${styles.heroSection} ${styles.stagger2}`}>
            <img src="/logo.png" alt="Level Up" className={styles.logo} />
          </div>
          <div className={styles.stagger3}>
            {isFormOpen ? (
              <Link href="/form" className={`${styles.actionCard} ${styles.cardMissoes}`}>
                <div className={styles.cardIcon}>
                  <TargetIcon />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>DESAFIOS</span>
                  <span className={styles.cardSubtitle}>CONCLUA DESAFIOS E GANHE XP</span>
                </div>
              </Link>
            ) : (
              <div className={`${styles.actionCard} ${styles.cardMissoes} ${styles.disabled}`}>
                <div className={styles.cardIcon}>
                  <TargetIcon />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>DESAFIOS</span>
                  <span className={styles.cardSubtitle}>DISPONÍVEL AOS DOMINGOS</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.stagger4}>
            <Link href="/ranking" className={`${styles.actionCard} ${styles.cardRanking}`}>
              <div className={styles.cardIcon}>
                <CrownIcon />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>RANKING</span>
                <span className={styles.cardSubtitle}>CONFIRA SUA POSIÇÃO NO JOGO</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
