"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Member } from "@/types";

export default function RankingPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [rankingType, setRankingType] = useState<"global" | "semanal">("global");

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch("/api/ranking");
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (error) {
        console.error("Erro ao buscar ranking", error);
      } finally {
        setIsFadingOut(true);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div className={`${styles.container} ${isFadingOut ? styles.fadeOutOpacity : styles.fadeInOpacity}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh' }}>
        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1rem' }}>
          {/* Header Title */}
          <div className={styles.skeletonBox} style={{ width: '50%', height: '30px', margin: '0 auto 2rem auto' }}></div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className={styles.skeletonBox} style={{ flex: 1, height: '40px' }}></div>
            <div className={styles.skeletonBox} style={{ flex: 1, height: '40px' }}></div>
          </div>
          
          {/* Podium */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '3rem', height: '180px' }}>
            <div className={styles.skeletonBox} style={{ width: '80px', height: '120px' }}></div>
            <div className={styles.skeletonBox} style={{ width: '90px', height: '160px' }}></div>
            <div className={styles.skeletonBox} style={{ width: '80px', height: '100px' }}></div>
          </div>
          
          {/* List Items */}
          <div className={styles.skeletonBox} style={{ width: '100%', height: '60px' }}></div>
          <div className={styles.skeletonBox} style={{ width: '100%', height: '60px' }}></div>
          <div className={styles.skeletonBox} style={{ width: '100%', height: '60px' }}></div>
        </div>
      </div>
    );
  }

  // Dynamically sort members based on the selected ranking type
  const sortedMembers = [...members].sort((a, b) => {
    if (rankingType === "global") {
      return b.totalXp - a.totalXp;
    } else {
      return (b.weeklyXp || 0) - (a.weeklyXp || 0);
    }
  });

  // Check if everyone is 0 XP for the selected ranking
  const isAllZeroXp = sortedMembers.every(m => rankingType === "global" ? m.totalXp === 0 : (m.weeklyXp || 0) === 0);

  const emptyPodiumMember = {
    name: "-",
    email: "-",
    photoUrl: "",
    totalXp: 0,
    weeklyXp: 0,
  };

  const top3 = isAllZeroXp ? [emptyPodiumMember, emptyPodiumMember, emptyPodiumMember] : sortedMembers.slice(0, 3);
  const rest = isAllZeroXp ? sortedMembers : sortedMembers.slice(3);



  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${styles.stagger1}`}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.iconBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </Link>
          <h1 className={styles.title}>RANKING</h1>
        </div>
      </header>

      <div className={`${styles.switchContainer} ${styles.stagger2}`}>
        <button 
          className={`${styles.switchButton} ${rankingType === "global" ? styles.switchButtonActive : ""}`}
          onClick={() => setRankingType("global")}
        >
          GLOBAL
        </button>
        <button 
          className={`${styles.switchButton} ${rankingType === "semanal" ? styles.switchButtonActive : ""}`}
          onClick={() => setRankingType("semanal")}
        >
          SEMANAL
        </button>
      </div>

      <div key={rankingType} style={{ width: "100%" }}>
        {top3.length > 0 && (
          <div className={`${styles.podium} ${styles.stagger3}`}>
          {/* Segundo Lugar (Esquerda) */}
          {top3[1] && (
            <div className={`${styles.podiumItem} ${styles.rank2}`}>
              <div className={styles.podiumLabel}>2º</div>
              {isAllZeroXp || !top3[1].email || top3[1].email === "-" ? (
                <div className={styles.photoWrapper}>
                  <img src="/frames/rank2.webp" alt="Frame" className={styles.frameOverlay} />
                  <div className={styles.questionMark}>?</div>
                </div>
              ) : (
                <Link href={`/history?player=${encodeURIComponent(top3[1].name)}`} className={styles.photoWrapper} style={{ textDecoration: 'none' }}>
                  <img src="/frames/rank2.webp" alt="Frame" className={styles.frameOverlay} />
                  <img src={top3[1].photoUrl} alt={top3[1].name} className={styles.podiumPhoto} />
                </Link>
              )}
              <div className={styles.podiumName}>{top3[1].name}</div>
              <div className={styles.podiumXp}>{rankingType === "global" ? top3[1].totalXp : (top3[1].weeklyXp || 0)} XP</div>
            </div>
          )}

          {/* Primeiro Lugar (Centro) */}
          {top3[0] && (
            <div className={`${styles.podiumItem} ${styles.rank1}`}>
              <div className={styles.podiumLabel}>1º</div>
              {isAllZeroXp || !top3[0].email || top3[0].email === "-" ? (
                <div className={styles.photoWrapper}>
                  <img src="/frames/rank1.webp" alt="Frame" className={styles.frameOverlay} />
                  <div className={styles.questionMark}>?</div>
                </div>
              ) : (
                <Link href={`/history?player=${encodeURIComponent(top3[0].name)}`} className={styles.photoWrapper} style={{ textDecoration: 'none' }}>
                  <img src="/frames/rank1.webp" alt="Frame" className={styles.frameOverlay} />
                  <img src={top3[0].photoUrl} alt={top3[0].name} className={styles.podiumPhoto} />
                </Link>
              )}
              <div className={styles.podiumName}>{top3[0].name}</div>
              <div className={styles.podiumXp}>{rankingType === "global" ? top3[0].totalXp : (top3[0].weeklyXp || 0)} XP</div>
            </div>
          )}

          {/* Terceiro Lugar (Direita) */}
          {top3[2] && (
            <div className={`${styles.podiumItem} ${styles.rank3}`}>
              <div className={styles.podiumLabel}>3º</div>
              {isAllZeroXp || !top3[2].email || top3[2].email === "-" ? (
                <div className={styles.photoWrapper}>
                  <img src="/frames/rank3.webp" alt="Frame" className={styles.frameOverlay} />
                  <div className={styles.questionMark}>?</div>
                </div>
              ) : (
                <Link href={`/history?player=${encodeURIComponent(top3[2].name)}`} className={styles.photoWrapper} style={{ textDecoration: 'none' }}>
                  <img src="/frames/rank3.webp" alt="Frame" className={styles.frameOverlay} />
                  <img src={top3[2].photoUrl} alt={top3[2].name} className={styles.podiumPhoto} />
                </Link>
              )}
              <div className={styles.podiumName}>{top3[2].name}</div>
              <div className={styles.podiumXp}>{rankingType === "global" ? top3[2].totalXp : (top3[2].weeklyXp || 0)} XP</div>
            </div>
          )}
          </div>
        )}

        <div className={`${styles.list} ${styles.stagger4}`}>
          {rest.map((member, index) => {
          const globalRank = index + 4;
          const displayXp = rankingType === "global" ? member.totalXp : (member.weeklyXp || 0);
          
          return (
            <div key={member.email || index} className={styles.listItem}>
              {!isAllZeroXp && (
                <div className={styles.listRankWrapper}>
                  <span className={styles.listRank}>{globalRank}</span>
                </div>
              )}
              
              {isAllZeroXp || !member.email || member.email === "-" ? (
                <div className={styles.listPhotoWrapper}>
                  <img src="/frames/rank-default.webp" alt="Frame" className={styles.listFrameOverlay} />
                  <div className={styles.questionMark}>?</div>
                </div>
              ) : (
                <Link href={`/history?player=${encodeURIComponent(member.name)}`} className={styles.listPhotoWrapper} style={{ textDecoration: 'none' }}>
                  <img src="/frames/rank-default.webp" alt="Frame" className={styles.listFrameOverlay} />
                  <img src={member.photoUrl} alt={member.name} className={styles.listPhoto} />
                </Link>
              )}

              <div className={styles.listInfo}>
                <div className={styles.listText}>
                  <span className={styles.listName}>{member.name}</span>
                </div>
                <span className={styles.listXp}>{displayXp} XP</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
