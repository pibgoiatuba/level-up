"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  photo_url: string;
  totalXp: number;
  submissionCount: number;
}

interface ChallengeItem {
  id: string;
  category: string;
  name: string;
  xp: number;
  type: "checkbox" | "number";
  display_order: number;
}

interface SubmissionItem {
  id: string;
  member_id?: string;
  email: string;
  week: string;
  total_xp: number;
  details_text: string | null;
  submission_date: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"members" | "challenges" | "configs" | "submissions">("members");

  // Data states
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search filters
  const [memberSearch, setMemberSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");

  // Member Modal State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhotoUrl, setMemberPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Challenge Modal State
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeItem | null>(null);
  const [challengeCategory, setChallengeCategory] = useState("");
  const [challengeName, setChallengeName] = useState("");
  const [challengeXp, setChallengeXp] = useState<number>(50);
  const [challengeType, setChallengeType] = useState<"checkbox" | "number">("checkbox");
  const [challengeOrder, setChallengeOrder] = useState<number>(0);
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [challengeError, setChallengeError] = useState("");

  // Submission Modal State (EDIT SUBMISSION)
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubmissionItem | null>(null);
  const [subEmail, setSubEmail] = useState("");
  const [subWeek, setSubWeek] = useState("");
  const [subXp, setSubXp] = useState<number>(0);
  const [subDate, setSubDate] = useState("");
  const [subDetails, setSubDetails] = useState("");
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subError, setSubError] = useState("");

  // Config State
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Expanded submission details
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // Check auth status on load
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          loadAllData();
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [membersRes, challengesRes, configsRes, subsRes] = await Promise.all([
        fetch("/api/admin/members"),
        fetch("/api/admin/challenges"),
        fetch("/api/admin/configs"),
        fetch("/api/admin/submissions"),
      ]);

      if (membersRes.ok) setMembers(await membersRes.json());
      if (challengesRes.ok) setChallenges(await challengesRes.json());
      if (configsRes.ok) setConfigs(await configsRes.json());
      if (subsRes.ok) setSubmissions(await subsRes.json());
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        loadAllData();
      } else {
        setLoginError(data.error || "Senha inválida");
      }
    } catch {
      setLoginError("Erro ao autenticar");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  // --- MEMBER ACTIONS ---
  const openNewMemberModal = () => {
    setEditingMember(null);
    setMemberName("");
    setMemberEmail("");
    setMemberPhotoUrl("");
    setPhotoPreview("");
    setSelectedPhotoFile(null);
    setMemberError("");
    setMemberModalOpen(true);
  };

  const openEditMemberModal = (m: MemberItem) => {
    setEditingMember(m);
    setMemberName(m.name);
    setMemberEmail(m.email);
    setMemberPhotoUrl(m.photo_url || "");
    setPhotoPreview(m.photo_url || "");
    setSelectedPhotoFile(null);
    setMemberError("");
    setMemberModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberSubmitting(true);
    setMemberError("");

    try {
      let finalPhotoUrl = memberPhotoUrl;

      if (selectedPhotoFile) {
        const formData = new FormData();
        formData.append("file", selectedPhotoFile);

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Falha no upload da foto");
        }

        const uploadData = await uploadRes.json();
        finalPhotoUrl = uploadData.url;
      }

      const payload = {
        id: editingMember?.id,
        name: memberName,
        email: memberEmail,
        photo_url: finalPhotoUrl,
      };

      const method = editingMember ? "PUT" : "POST";
      const res = await fetch("/api/admin/members", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar participante");
      }

      setMemberModalOpen(false);
      loadAllData();
    } catch (err) {
      setMemberError((err as Error).message);
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleDeleteMember = async (m: MemberItem) => {
    if (!confirm(`Tem certeza que deseja excluir o participante ${m.name}? Todas as submissões dele serão apagadas.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/members?id=${m.id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((item) => item.id !== m.id));
      } else {
        alert("Erro ao excluir participante");
      }
    } catch {
      alert("Erro ao excluir participante");
    }
  };

  // --- CHALLENGE ACTIONS ---
  const openNewChallengeModal = () => {
    setEditingChallenge(null);
    setChallengeCategory("🧠 Autodisciplina Intelectual");
    setChallengeName("");
    setChallengeXp(50);
    setChallengeType("checkbox");
    setChallengeOrder(challenges.length + 1);
    setChallengeError("");
    setChallengeModalOpen(true);
  };

  const openEditChallengeModal = (c: ChallengeItem) => {
    setEditingChallenge(c);
    setChallengeCategory(c.category);
    setChallengeName(c.name);
    setChallengeXp(c.xp);
    setChallengeType(c.type);
    setChallengeOrder(c.display_order);
    setChallengeError("");
    setChallengeModalOpen(true);
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setChallengeSubmitting(true);
    setChallengeError("");

    try {
      const payload = {
        id: editingChallenge?.id,
        category: challengeCategory,
        name: challengeName,
        xp: challengeXp,
        type: challengeType,
        display_order: challengeOrder,
      };

      const method = editingChallenge ? "PUT" : "POST";
      const res = await fetch("/api/admin/challenges", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar desafio");

      setChallengeModalOpen(false);
      loadAllData();
    } catch (err) {
      setChallengeError((err as Error).message);
    } finally {
      setChallengeSubmitting(false);
    }
  };

  const handleDeleteChallenge = async (c: ChallengeItem) => {
    if (!confirm(`Excluir o desafio "${c.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/challenges?id=${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setChallenges((prev) => prev.filter((item) => item.id !== c.id));
      } else {
        alert("Erro ao excluir desafio");
      }
    } catch {
      alert("Erro ao excluir desafio");
    }
  };

  // --- CONFIG ACTIONS ---
  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigSuccess(false);

    try {
      const res = await fetch("/api/admin/configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs),
      });

      if (res.ok) {
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 3500);
      } else {
        alert("Erro ao salvar configurações");
      }
    } catch {
      alert("Erro ao salvar configurações");
    } finally {
      setConfigSaving(false);
    }
  };

  // --- SUBMISSIONS ACTIONS (EDIT & DELETE) ---
  const openEditSubmissionModal = (s: SubmissionItem) => {
    setEditingSub(s);
    setSubEmail(s.email);
    setSubWeek(s.week);
    setSubXp(s.total_xp);
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const dateObj = new Date(s.submission_date);
    const localIso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setSubDate(localIso);
    setSubDetails(s.details_text || "");
    setSubError("");
    setSubModalOpen(true);
  };

  const handleSaveSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setSubSubmitting(true);
    setSubError("");

    try {
      const payload = {
        id: editingSub.id,
        email: subEmail,
        week: subWeek,
        total_xp: subXp,
        submission_date: subDate ? new Date(subDate).toISOString() : editingSub.submission_date,
        details_text: subDetails,
      };

      const res = await fetch("/api/admin/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar envio");

      setSubModalOpen(false);
      loadAllData();
    } catch (err) {
      setSubError((err as Error).message);
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (s: SubmissionItem) => {
    if (!confirm(`Excluir o envio de ${s.email} (${s.week}) no valor de ${s.total_xp} XP?`)) return;

    try {
      const res = await fetch(`/api/admin/submissions?id=${s.id}`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((item) => item.id !== s.id));
        loadAllData();
      } else {
        alert("Erro ao excluir envio");
      }
    } catch {
      alert("Erro ao excluir envio");
    }
  };

  // Filtered lists
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredSubs = submissions.filter(
    (s) =>
      s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
      s.week.toLowerCase().includes(subSearch.toLowerCase())
  );

  // --- LOADING AUTH STATE ---
  if (isAuthenticated === null) {
    return (
      <div className={styles.adminRoot}>
        <div className={styles.container} style={{ textAlign: "center", paddingTop: "25vh" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className={styles.adminRoot}>
        <div className={styles.container}>
          <div className={styles.loginWrapper}>
            <div className={styles.loginCard}>
              <h1 className={styles.loginTitle}>Painel de Administração</h1>
              <p className={styles.loginSubtitle}>Digite a senha para acessar o gerenciamento</p>

              {loginError && <div className={styles.errorMessage}>{loginError}</div>}

              <form onSubmit={handleLogin}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ textAlign: "left" }}>
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    className={styles.formInput}
                    placeholder="Sua senha..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`${styles.actionButton} ${styles.loginBtn}`}
                  disabled={loginLoading}
                >
                  {loginLoading ? "Entrando..." : "Entrar no Painel"}
                </button>
              </form>

              <div style={{ marginTop: "1.5rem" }}>
                <Link href="/" style={{ color: "#64748b", fontSize: "0.85rem", textDecoration: "none" }}>
                  ← Voltar para o jogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN PANEL ---
  return (
    <div className={styles.adminRoot}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.brand}>
            <h1 className={styles.logoTitle}>Level Up</h1>
            <span className={styles.badgeAdmin}>Painel de Controle</span>
          </div>

          <div className={styles.headerActions}>
            <Link href="/" className={styles.navButton}>
              Ver Jogo
            </Link>
            <Link href="/ranking" className={styles.navButton}>
              Ver Ranking
            </Link>
            <button onClick={handleLogout} className={`${styles.navButton} ${styles.logoutButton}`}>
              Sair
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${activeTab === "members" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Participantes ({members.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "submissions" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("submissions")}
          >
            Envios ({submissions.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "challenges" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("challenges")}
          >
            Desafios ({challenges.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "configs" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("configs")}
          >
            Configurações
          </button>
        </nav>

        {loadingData && (
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Atualizando dados...
          </p>
        )}

        {/* --- TAB 1: MEMBERS --- */}
        {activeTab === "members" && (
          <section>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Participantes</h2>
              </div>
              <button onClick={openNewMemberModal} className={styles.actionButton}>
                + Novo Participante
              </button>
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Buscar por nome ou e-mail..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            <div className={styles.grid}>
              {filteredMembers.map((m) => (
                <div key={m.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarWrapper}>
                      <img
                        src={m.photo_url || `/profiles/${m.name.toLowerCase()}.webp`}
                        alt={m.name}
                        className={styles.avatarImg}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/profiles/pablo.webp";
                        }}
                      />
                    </div>
                    <div className={styles.memberInfo}>
                      <h3 className={styles.memberName}>{m.name}</h3>
                      <p className={styles.memberEmail}>{m.email}</p>
                    </div>
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <div className={styles.statLabel}>Total XP</div>
                      <div className={styles.statValue}>{m.totalXp.toLocaleString("pt-BR")}</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statLabel}>Envios</div>
                      <div className={styles.statValue} style={{ color: "#94a3b8" }}>
                        {m.submissionCount}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Link
                      href={`/history?player=${encodeURIComponent(m.name.toLowerCase())}`}
                      className={styles.btnSmall}
                      target="_blank"
                    >
                      Histórico ↗
                    </Link>
                    <button onClick={() => openEditMemberModal(m)} className={styles.btnSmall}>
                      Editar
                    </button>
                    <button onClick={() => handleDeleteMember(m)} className={`${styles.btnSmall} ${styles.btnSmallDanger}`}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- TAB 2: SUBMISSIONS (WITH EDIT!) --- */}
        {activeTab === "submissions" && (
          <section>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Histórico de Envios</h2>
              </div>
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Filtrar por e-mail ou semana..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
              />
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Participante</th>
                    <th>Semana</th>
                    <th>Pontos</th>
                    <th>Detalhes</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {new Date(s.submission_date).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </td>
                      <td style={{ fontWeight: 500, color: "#f8fafc" }}>{s.email}</td>
                      <td>
                        <span className={styles.badgeWeek}>{s.week}</span>
                      </td>
                      <td>
                        <span className={styles.xpHighlight}>+{s.total_xp} XP</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setExpandedSubId(expandedSubId === s.id ? null : s.id)}
                          className={styles.btnSmall}
                        >
                          {expandedSubId === s.id ? "Fechar" : "Ver tarefas"}
                        </button>
                        {expandedSubId === s.id && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              background: "#0b0f19",
                              padding: "0.75rem",
                              borderRadius: "6px",
                              border: "1px solid #1f2937",
                              whiteSpace: "pre-wrap",
                              fontSize: "0.8rem",
                              color: "#cbd5e1",
                            }}
                          >
                            {s.details_text || "Sem detalhes"}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => openEditSubmissionModal(s)}
                          className={styles.btnSmall}
                          style={{ marginRight: "0.4rem" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(s)}
                          className={`${styles.btnSmall} ${styles.btnSmallDanger}`}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* --- TAB 3: CHALLENGES --- */}
        {activeTab === "challenges" && (
          <section>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Catálogo de Desafios</h2>
              </div>
              <button onClick={openNewChallengeModal} className={styles.actionButton}>
                + Novo Desafio
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Nome do Desafio</th>
                    <th>XP</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{c.category}</td>
                      <td>{c.name}</td>
                      <td>
                        <span className={styles.xpHighlight}>+{c.xp} XP</span>
                      </td>
                      <td>
                        <span className={c.type === "number" ? styles.badgeNumber : styles.badgeCheckbox}>
                          {c.type === "number" ? "Quantidade" : "Checkbox"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => openEditChallengeModal(c)}
                          className={styles.btnSmall}
                          style={{ marginRight: "0.4rem" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteChallenge(c)}
                          className={`${styles.btnSmall} ${styles.btnSmallDanger}`}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* --- TAB 4: CONFIGS --- */}
        {activeTab === "configs" && (
          <section style={{ maxWidth: "600px" }}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Configurações do Jogo</h2>
              </div>
            </div>

            {configSuccess && (
              <div className={styles.successMessage}>
                Configurações salvas com sucesso!
              </div>
            )}

            <form onSubmit={handleSaveConfigs} className={styles.card}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dia de Abertura do Formulário</label>
                <select
                  className={styles.formSelect}
                  value={configs.DIA_ABERTURA_FORM || "0"}
                  onChange={(e) => setConfigs({ ...configs, DIA_ABERTURA_FORM: e.target.value })}
                >
                  <option value="0">Domingo (0)</option>
                  <option value="1">Segunda-feira (1)</option>
                  <option value="2">Terça-feira (2)</option>
                  <option value="3">Quarta-feira (3)</option>
                  <option value="4">Quinta-feira (4)</option>
                  <option value="5">Sexta-feira (5)</option>
                  <option value="6">Sábado (6)</option>
                </select>
                <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                  Dia em que o formulário fica aberto para envio de pontos.
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dia de Atualização do Ranking</label>
                <select
                  className={styles.formSelect}
                  value={configs.DIA_ATUALIZACAO_RANKING || "1"}
                  onChange={(e) => setConfigs({ ...configs, DIA_ATUALIZACAO_RANKING: e.target.value })}
                >
                  <option value="0">Domingo (0)</option>
                  <option value="1">Segunda-feira (1)</option>
                  <option value="2">Terça-feira (2)</option>
                  <option value="3">Quarta-feira (3)</option>
                  <option value="4">Quinta-feira (4)</option>
                  <option value="5">Sexta-feira (5)</option>
                  <option value="6">Sábado (6)</option>
                </select>
                <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                  Dia em que os pontos são revelados no ranking público.
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data de Início do Jogo</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={configs.DATA_INICIO_JOGO || "2026-05-18"}
                  onChange={(e) => setConfigs({ ...configs, DATA_INICIO_JOGO: e.target.value })}
                  required
                />
                <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                  Data base usada para contar as semanas do jogo (Semana 1, 2...).
                </small>
              </div>

              <button
                type="submit"
                className={styles.actionButton}
                disabled={configSaving}
                style={{ marginTop: "0.75rem", alignSelf: "flex-start" }}
              >
                {configSaving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </form>
          </section>
        )}

        {/* --- MODAL: EDIT SUBMISSION --- */}
        {subModalOpen && editingSub && (
          <div className={styles.modalOverlay} onClick={() => setSubModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Editar Envio de Pontos</h3>
                <button className={styles.closeButton} onClick={() => setSubModalOpen(false)}>
                  ✕
                </button>
              </div>

              {subError && <div className={styles.errorMessage}>{subError}</div>}

              <form onSubmit={handleSaveSubmission}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Participante</label>
                  <div
                    style={{
                      background: "#0b0f19",
                      border: "1px solid #1f2937",
                      borderRadius: "6px",
                      padding: "0.6rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#f8fafc" }}>
                      {members.find((m) => m.email.toLowerCase() === subEmail.toLowerCase())?.name || subEmail}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      ({subEmail})
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.formLabel}>Semana</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ex: SEMANA 1"
                      value={subWeek}
                      onChange={(e) => setSubWeek(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.formLabel}>Total de XP</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={subXp}
                      onChange={(e) => setSubXp(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Data e Hora do Envio</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={subDate}
                    onChange={(e) => setSubDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Detalhes das Tarefas Concluídas</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Desafio: Concluído (XP)..."
                    value={subDetails}
                    onChange={(e) => setSubDetails(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => setSubModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.actionButton} disabled={subSubmitting}>
                    {subSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: MEMBER (CREATE / EDIT) --- */}
        {memberModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setMemberModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingMember ? "Editar Participante" : "Novo Participante"}
                </h3>
                <button className={styles.closeButton} onClick={() => setMemberModalOpen(false)}>
                  ✕
                </button>
              </div>

              {memberError && <div className={styles.errorMessage}>{memberError}</div>}

              <form onSubmit={handleSaveMember}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome Completo / Apelido</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ex: Pablo"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>E-mail</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="Ex: pablo@gmail.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Foto do Participante (Supabase Storage)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleFileChange}
                  />

                  <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
                    {photoPreview ? (
                      <div className={styles.previewWrapper}>
                        <img src={photoPreview} alt="Preview" className={styles.previewImage} />
                      </div>
                    ) : (
                      <div style={{ fontSize: "1.5rem" }}>📷</div>
                    )}
                    <div>
                      <strong style={{ color: "#38bdf8", fontSize: "0.85rem" }}>
                        {selectedPhotoFile ? selectedPhotoFile.name : "Clique para selecionar uma imagem"}
                      </strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                        JPG, PNG ou WEBP (Salvo no Supabase Storage)
                      </div>
                    </div>
                  </div>

                  {memberPhotoUrl && !selectedPhotoFile && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                      URL atual: <span style={{ color: "#94a3b8" }}>{memberPhotoUrl}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => setMemberModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.actionButton} disabled={memberSubmitting}>
                    {memberSubmitting ? "Salvando..." : "Salvar Participante"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: CHALLENGE (CREATE / EDIT) --- */}
        {challengeModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setChallengeModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingChallenge ? "Editar Desafio" : "Novo Desafio"}
                </h3>
                <button className={styles.closeButton} onClick={() => setChallengeModalOpen(false)}>
                  ✕
                </button>
              </div>

              {challengeError && <div className={styles.errorMessage}>{challengeError}</div>}

              <form onSubmit={handleSaveChallenge}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Categoria</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ex: 🧠 Autodisciplina Intelectual"
                    value={challengeCategory}
                    onChange={(e) => setChallengeCategory(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome do Desafio</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ex: Ler a Bíblia"
                    value={challengeName}
                    onChange={(e) => setChallengeName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.formLabel}>Pontos (XP)</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={challengeXp}
                      onChange={(e) => setChallengeXp(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.formLabel}>Tipo</label>
                    <select
                      className={styles.formSelect}
                      value={challengeType}
                      onChange={(e) => setChallengeType(e.target.value as "checkbox" | "number")}
                    >
                      <option value="checkbox">Checkbox (Sim/Não)</option>
                      <option value="number">Quantidade (Numérico)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ordem de Exibição</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={challengeOrder}
                    onChange={(e) => setChallengeOrder(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => setChallengeModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.actionButton} disabled={challengeSubmitting}>
                    {challengeSubmitting ? "Salvando..." : "Salvar Desafio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
