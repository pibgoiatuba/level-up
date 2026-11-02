"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

interface HistoryItem {
  name: string;
  result: string;
  date: string;
}

interface WeekHistory {
  week: string;
  weekTotal: number;
  items: HistoryItem[];
}

interface Profile {
  name: string;
  photoUrl: string;
  totalXp: number;
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const playerName = searchParams.get("player");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<WeekHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!playerName) {
        setError("Jogador não especificado.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/history?player=${encodeURIComponent(playerName)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setHistory(data.history);
        } else {
          const errData = await res.json();
          setError(errData.error || "Erro ao buscar histórico");
        }
      } catch (error) {
        console.error("Erro ao buscar histórico", error);
        setError("Falha na conexão com o servidor.");
      } finally {
        setIsFadingOut(true);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchHistory();
  }, [playerName]);

  if (loading) {
    return (
      <div className={`${styles.container} ${isFadingOut ? styles.fadeOutOpacity : styles.fadeInOpacity}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh' }}>
        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1rem' }}>
          {/* Header Title */}
          <div className={styles.skeletonBox} style={{ width: '50%', height: '30px', margin: '0 auto 2rem auto' }}></div>
          
          {/* Profile */}
          <div className={styles.profileSection} style={{ marginBottom: '2rem' }}>
            <div className={styles.skeletonBox} style={{ width: '70px', height: '70px', borderRadius: '50%', marginRight: '1.25rem', flexShrink: 0 }}></div>
            <div className={styles.profileInfo} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className={styles.skeletonBox} style={{ width: '60%', height: '24px', marginBottom: '0.5rem' }}></div>
              <div className={styles.skeletonBox} style={{ width: '30%', height: '16px' }}></div>
            </div>
          </div>
          
          {/* List Items */}
          <div className={styles.skeletonBox} style={{ width: '100%', height: '150px' }}></div>
          <div className={styles.skeletonBox} style={{ width: '100%', height: '150px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.topBar}>
            <Link href="/ranking" className={styles.iconBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </Link>
            <h1 className={styles.title}>HISTÓRICO</h1>
          </div>
        </header>
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>{error || "Jogador não encontrado."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles.fadeInUpOpacity}`}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <Link href="/ranking" className={styles.iconBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </Link>
          <h1 className={styles.title}>HISTÓRICO</h1>
        </div>
      </header>

      <section className={styles.profileSection}>
        <div className={styles.photoWrapper}>
          <img src="/frames/rank-default.webp" alt="Frame" className={styles.frameOverlay} />
          <img src={profile.photoUrl} alt={profile.name} className={styles.profilePhoto} />
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{profile.name}</h2>
          <div className={styles.profileXp}>{profile.totalXp} XP</div>
        </div>
      </section>

      <section className={styles.historyContainer}>
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '2rem' }}>
            Nenhum XP registrado ainda.
          </p>
        ) : (
          history.map((weekBlock, wIdx) => (
            <div key={weekBlock.week} className={styles.weekBlock} style={{ animationDelay: `${wIdx * 0.1}s` }}>
              <div className={styles.weekHeader}>
                <h3 className={styles.weekTitle}>{weekBlock.week}</h3>
                <span className={styles.weekTotalXp}>{weekBlock.weekTotal} XP</span>
              </div>
              <div className={styles.itemList}>
                {weekBlock.items.map((item, iIdx) => (
                  <div key={iIdx} className={styles.historyItem}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemResult}>{item.result}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className={styles.container} style={{ minHeight: '100vh', backgroundColor: '#050505' }}></div>}>
      <HistoryContent />
    </Suspense>
  );
}
