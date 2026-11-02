"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

interface Challenge {
  name: string;
  xp: number;
  type: "checkbox" | "number";
}

interface Category {
  category: string;
  challenges: Challenge[];
}

const formatCategoryName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

import confetti from "canvas-confetti";

export default function FormPage() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Form State
  const [email, setEmail] = useState("");

  // scores: { [challengeName]: { xp: number, label: string } }
  const [scores, setScores] = useState<Record<string, { xp: number; label: string }>>({});
  const [revealSurprise, setRevealSurprise] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"next"|"prev">("next");
  const [popupInfo, setPopupInfo] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const isSurprise = categories[step - 2]?.category?.toLowerCase()?.includes("surpresa");
    if (isSurprise) {
      setRevealSurprise(false);
      
      const duration = 2500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ["#FFD700", "#FFC107", "#FFB300", "#FF8F00", "#FFE066"],
          zIndex: 9999
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ["#FFD700", "#FFC107", "#FFB300", "#FF8F00", "#FFE066"],
          zIndex: 9999
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      const timeout = setTimeout(() => {
        setRevealSurprise(true);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [step, categories]);

  useEffect(() => {
    const init = async () => {
      try {
        const [configRes, challengesRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/challenges")
        ]);

        let formOpenDay = 0;
        if (configRes.ok) {
          const config = await configRes.json();
          formOpenDay = parseInt(config.DIA_ABERTURA_FORM, 10) || 0;
        }
        setIsOpen(new Date().getDay() === formOpenDay);

        if (challengesRes.ok) {
          const data = await challengesRes.json();
          setCategories(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsFadingOut(true);
        setTimeout(() => setFetching(false), 500);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem("playerEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  if (isOpen === null || fetching) return (
    <div className={`${styles.container} ${isFadingOut ? styles.fadeOutOpacity : styles.fadeInOpacity}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '15vh' }}>
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.skeletonBox} style={{ width: '60%', height: '35px', marginBottom: '1.5rem', borderRadius: '4px' }}></div>
        <div className={styles.skeletonBox} style={{ width: '35%', height: '14px', borderRadius: '4px', marginBottom: '0.2rem' }}></div>
        <div className={styles.skeletonBox} style={{ width: '100%', height: '55px', borderRadius: '8px', marginBottom: '1.5rem' }}></div>
        <div className={styles.skeletonBox} style={{ width: '100%', height: '50px', borderRadius: '8px', marginTop: '1rem' }}></div>
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.closedMessage}`}>
          <h2 className="glow-text">PORTAL FECHADO</h2>
          <p style={{ marginTop: "1rem", color: "#fff", lineHeight: "1.5" }}>
            As missões só ficam disponíveis aos domingos (00:00 às 23:59).
          </p>
          <div style={{ marginTop: "2rem" }}>
            <Link href="/" className="sci-btn">VOLTAR AO INÍCIO</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!email.trim()) {
        setPopupInfo({ title: "Atenção", message: "Identificação obrigatória!" });
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch("/api/verify-player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        
        if (!data.valid) {
          if (data.reason === "not_found") {
            setPopupInfo({ title: "ACESSO NEGADO", message: "E-mail não encontrado na base de jogadores. Verifique a digitação ou fale com um líder." });
          } else if (data.reason === "already_submitted") {
            setPopupInfo({ title: "OOOPS", message: "Você já enviou seus desafios. Volte domingo que vem." });
          } else {
            setPopupInfo({ title: "Erro", message: "Erro na verificação. Tente novamente." });
          }
          setLoading(false);
          return;
        }
        
        localStorage.setItem("playerEmail", email.trim());
      } catch (e) {
        console.error(e);
        setPopupInfo({ title: "Erro de Conexão", message: "Erro na comunicação com o servidor." });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    
    setDirection("next");
    setIsTransitioning(true);
    
    // Animate out first (300ms), then instantly scroll to top and swap content
    setTimeout(() => {
      setRevealSurprise(false);
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = () => {
    setDirection("prev");
    setIsTransitioning(true);
    
    // Animate out first (300ms), then instantly scroll to top and swap content
    setTimeout(() => {
      setRevealSurprise(false);
      setStep((s) => s - 1);
      window.scrollTo(0, 0);
      setIsTransitioning(false);
    }, 300);
  };

  const handleCheckbox = (name: string, xp: number, checked: boolean) => {
    setScores((prev) => {
      const newScores = { ...prev };
      if (checked) {
        newScores[name] = { xp, label: `Concluído (${xp} XP)` };
        const isSurprise = categories[step - 2]?.category?.toLowerCase()?.includes("surpresa");
        if (isSurprise) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ["#FFD700", "#FFC107", "#FFB300", "#FF8F00", "#FFE066"],
            zIndex: 9999
          });
        }
      } else {
        delete newScores[name];
      }
      return newScores;
    });
  };

  const handleNumber = (name: string, xpPerItem: number, count: number) => {
    if (count < 0) count = 0;
    setScores((prev) => {
      const newScores = { ...prev };
      if (count > 0) {
        newScores[name] = { xp: count * xpPerItem, label: `${count} vezes (${count * xpPerItem} XP)` };
        const isSurprise = categories[step - 2]?.category?.toLowerCase()?.includes("surpresa");
        if (isSurprise) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ["#FFD700", "#FFC107", "#FFB300", "#FF8F00", "#FFE066"],
            zIndex: 9999
          });
        }
      } else {
        delete newScores[name];
      }
      return newScores;
    });
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((acc, curr) => acc + curr.xp, 0);
  };

  const formatDetails = () => {
    const details: Record<string, string> = {};
    for (const [key, val] of Object.entries(scores)) {
      details[key] = val.label;
    }
    return details;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const totalXp = calculateTotal();
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          totalXp,
          details: formatDetails(),
        })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setPopupInfo({ title: "Erro", message: "Falha na transmissão. Tente novamente." });
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setPopupInfo({ title: "Erro de Conexão", message: "Ocorreu um erro ao conectar com o servidor." });
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${styles.container} ${styles.animContainer} ${styles.slideInRight}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#88ff00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <p style={{ color: '#ffffff', fontSize: '1.2rem', lineHeight: '1.5', margin: '0 0 1rem 0', textAlign: 'center', maxWidth: '300px' }}>
          Seus desafios foram enviados!
        </p>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 3rem 0', textAlign: 'center', maxWidth: '300px' }}>
          Você poderá conferir sua posição no ranking amanhã.
        </p>

        <Link href="/" className={styles.sciBtnGreen} style={{ flex: 'none', padding: '0.8rem 3rem', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', textDecoration: 'none' }}>
          OK
        </Link>
        
      </div>
    );
  }

  // +2 because Step 1 is Login, and Last Step is Summary
  const totalSteps = categories.length + 2;

  const isSurpriseActive = categories[step - 2]?.category?.toLowerCase()?.includes("surpresa");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <h1 className={styles.title}>DESAFIOS</h1>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              ESTÁGIO <span className={styles.stepNum}>{step}</span> DE <span className={styles.stepNum}>{totalSteps}</span>
            </span>
            <span className={styles.progressPercentage}>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          </div>
        </div>
      </header>

      <div className={styles.formBox}>
        <div className={`${styles.animContainer} ${isTransitioning ? (direction === 'next' ? styles.slideOutLeft : styles.slideOutRight) : (direction === 'next' ? styles.slideInRight : styles.slideInLeft)}`}>
        {step === 1 && (
          <div>
            <h2 className={styles.stepTitle}>Identificação do Jogador</h2>
            <div className={styles.formGroup} style={{ marginBottom: "0.8rem" }}>
              <label>E-MAIL (OBRIGATÓRIO)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jovem@igreja.com" />
            </div>
          </div>
        )}

        {categories.map((cat, idx) => {
          const catStep = idx + 2;
          if (step !== catStep) return null;

          const isSurprise = cat.category?.toLowerCase()?.includes("surpresa");
          return (
            <div key={cat.category} className={isSurprise ? styles.surpriseContainer : ""}>
              <h2 className={`${styles.stepTitle} ${isSurprise ? styles.surpriseStepTitle : ""}`}>
                {formatCategoryName(cat.category)}
              </h2>
              
              <div className={isSurprise ? (revealSurprise ? styles.suspenseReveal : styles.suspenseBlur) : ""}>
                {cat.challenges.map((c) => (
                  c.type === "checkbox" ? (
                    <label key={c.name} className={`${styles.checkboxGroup} ${isSurprise ? styles.surpriseChallengeCard : ""}`}>
                      <input type="checkbox" checked={!!scores[c.name]} onChange={(e) => handleCheckbox(c.name, c.xp, e.target.checked)} />
                      <div className={styles.infoWrapper}>
                        <span className={styles.challengeLabel}>{c.name}</span>
                        <span className={styles.xpBadge}>+{c.xp} XP</span>
                      </div>
                    </label>
                  ) : (
                    <div key={c.name} className={`${styles.numberGroup} ${scores[c.name] ? styles.activeNumberCard : ""} ${isSurprise ? styles.surpriseChallengeCard : ""}`}>
                      <div className={styles.infoWrapper}>
                        <span className={styles.challengeLabel}>{c.name}</span>
                        <span className={styles.xpBadge}>+{c.xp} XP / un</span>
                      </div>
                      <div className={styles.quantitySelectors}>
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                          const currentCount = scores[c.name] ? Math.round(scores[c.name].xp / c.xp) : 0;
                          const isSelected = currentCount === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              className={`${styles.quantityBtn} ${isSelected ? styles.quantityBtnActive : ""}`}
                              onClick={() => handleNumber(c.name, c.xp, isSelected ? 0 : num)}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          );
        })}

        {step === totalSteps && (
          <div>
            <div style={{ padding: "1rem 0" }}>
              
              <div className={styles.summaryBox}>
                <h4 style={{ marginBottom: "1rem", color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Desafios Cumpridos</h4>
                {Object.entries(scores).length > 0 ? (
                  <ul className={styles.summaryList}>
                    {Object.entries(scores).map(([name]) => (
                      <li key={name} className={styles.summaryItem}>
                        <span className={styles.summaryName}>{name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "2rem 0" }}>Nenhum desafio registrado nesta semana.</p>
                )}
              </div>
              
            </div>
          </div>
        )}
        </div>

        <div className={`${styles.actions} ${step === 1 ? styles.loginActions : ''}`}>
          {step > 1 && (
            <button className={styles.sciBtnSecondary} onClick={handlePrev} disabled={loading}>
              {"< RETORNAR"}
            </button>
          )}

          {step < totalSteps ? (
            <button className={isSurpriseActive ? styles.sciBtnYellow : styles.sciBtnGreen} onClick={handleNext} disabled={loading}>
              {loading && step === 1 ? "VERIFICANDO..." : "PROSSEGUIR >"}
            </button>
          ) : (
            <button className={styles.sciBtnGreen} onClick={handleSubmit} disabled={loading}>
              {loading ? "SINCRONIZANDO..." : "CONCLUIR MISSÃO"}
            </button>
          )}
        </div>
      </div>

      {popupInfo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>{popupInfo.title}</h3>
            <p className={styles.modalMessage}>{popupInfo.message}</p>
            <button className={styles.sciBtnSecondary} onClick={() => setPopupInfo(null)} style={{ marginTop: '0.2rem' }}>
              FECHAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
