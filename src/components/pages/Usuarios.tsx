import { useState } from "react";
import {
  type AccessProfile,
  type Account,
  useAccessControl,
} from "../../access-control";
import {
  Alert,
  Badge,
  Btn,
  Card,
  FormActions,
  FormGrid,
  FullCol,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  Tabs,
  Textarea,
} from "../ui";

type Tab = "usuarios" | "perfis" | "logs";
type ModalMode = "new" | "edit" | "view" | "profiles" | "password" | null;

const modules = [
  { id: "dashboard", label: "Dashboard" },
  { id: "hospedes", label: "Hóspedes" },
  { id: "reservas", label: "Reservas" },
  { id: "quartos", label: "Quartos" },
  { id: "checkinout", label: "Check-in / Out" },
  { id: "consumos", label: "Consumos" },
  { id: "estoque", label: "Estoque" },
  { id: "pacotes", label: "Pacotes" },
  { id: "financeiro", label: "Financeiro" },
  { id: "funcionarios", label: "Funcionários" },
  { id: "limpeza", label: "Limpeza & Manutenção" },
  { id: "eventos", label: "Eventos" },
  { id: "comunicacoes", label: "Comunicações" },
  { id: "fiscal", label: "Fiscal" },
  { id: "usuarios", label: "Usuários & Acesso" },
  { id: "relatorios", label: "Relatórios" },
];

const emptyUser = () => ({
  name: "",
  email: "",
  login: "",
  password: "",
  profileId: "",
});

const emptyProfile = () => ({
  name: "",
  description: "",
  permissions: [] as string[],
});

function formatDate(value?: string) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function passwordIsValid(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export default function Usuarios() {
  const {
    accounts,
    profiles,
    logs,
    activeAccount,
    setAccounts,
    setProfiles,
    registerLog,
  } = useAccessControl();
  const [tab, setTab] = useState<Tab>("usuarios");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [userForm, setUserForm] = useState(emptyUser());
  const [profileForm, setProfileForm] = useState(emptyProfile());
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmation: "" });
  const [logFilters, setLogFilters] = useState({
    userId: "",
    module: "",
    result: "",
    start: "",
    end: "",
  });

  const selectedUser = accounts.find((account) => account.id === selectedId);
  const selectedProfile = profiles.find((profile) => profile.id === selectedId);
  const actor = activeAccount
    ? { id: activeAccount.id, name: activeAccount.name }
    : undefined;

  const profileNames = (account: Account) => {
    const names = profiles
      .filter((profile) => account.profileIds.includes(profile.id))
      .map((profile) => profile.name);
    return names.length ? names.join(", ") : "Sem perfil";
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setError("");
  };

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    setSearch("");
    setStatusFilter("");
    setNotice("");
    closeModal();
  };

  const openNew = () => {
    setSelectedId(null);
    setError("");
    if (tab === "usuarios") setUserForm(emptyUser());
    else setProfileForm(emptyProfile());
    setModalMode("new");
  };

  const openView = (id: number) => {
    setSelectedId(id);
    setModalMode("view");
  };

  const openEdit = (id: number) => {
    setSelectedId(id);
    setError("");
    if (tab === "usuarios") {
      const account = accounts.find((item) => item.id === id);
      if (!account) return;
      setUserForm({
        name: account.name,
        email: account.email,
        login: account.login,
        password: "",
        profileId: "",
      });
    } else {
      const profile = profiles.find((item) => item.id === id);
      if (!profile) return;
      setProfileForm({
        name: profile.name,
        description: profile.description,
        permissions: profile.permissions,
      });
    }
    setModalMode("edit");
  };

  const saveUser = () => {
    setError("");
    if (
      !userForm.name ||
      !userForm.email ||
      !userForm.login ||
      (modalMode === "new" && (!userForm.password || !userForm.profileId))
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    const duplicated = accounts.some(
      (account) =>
        account.id !== selectedId &&
        (account.email.toLowerCase() === userForm.email.toLowerCase() ||
          account.login.toLowerCase() === userForm.login.toLowerCase()),
    );
    if (duplicated) {
      setError("O e-mail ou login informado já está em uso.");
      return;
    }
    if (modalMode === "new" && !passwordIsValid(userForm.password)) {
      setError("A senha deve ter ao menos 8 caracteres, com maiúscula, minúscula e número.");
      return;
    }
    if (modalMode === "new") {
      const account: Account = {
        id: Date.now(),
        name: userForm.name,
        email: userForm.email,
        login: userForm.login,
        password: userForm.password,
        profileIds: [Number(userForm.profileId)],
        status: "Ativo",
        passwordUpdatedAt: new Date().toISOString(),
      };
      setAccounts((current) => [account, ...current]);
      registerLog(
        "Usuário cadastrado",
        "Usuários & Acesso",
        `${account.name} (${account.login}).`,
        "Sucesso",
        actor,
      );
    } else if (selectedId) {
      setAccounts((current) =>
        current.map((account) =>
          account.id === selectedId
            ? {
                ...account,
                name: userForm.name,
                email: userForm.email,
                login: userForm.login,
              }
            : account,
        ),
      );
      registerLog(
        "Usuário atualizado",
        "Usuários & Acesso",
        userForm.name,
        "Sucesso",
        actor,
      );
    }
    closeModal();
  };

  const saveProfile = () => {
    setError("");
    if (!profileForm.name || !profileForm.description || !profileForm.permissions.length) {
      setError("Informe nome, descrição e ao menos uma permissão.");
      return;
    }
    const duplicate = profiles.some(
      (profile) =>
        profile.id !== selectedId &&
        profile.name.toLowerCase() === profileForm.name.toLowerCase(),
    );
    if (duplicate) {
      setError("Já existe um perfil com este nome.");
      return;
    }
    if (modalMode === "new") {
      const profile: AccessProfile = {
        id: Date.now(),
        ...profileForm,
        status: "Ativo",
      };
      setProfiles((current) => [profile, ...current]);
      registerLog(
        "Perfil cadastrado",
        "Usuários & Acesso",
        profile.name,
        "Sucesso",
        actor,
      );
    } else if (selectedId) {
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === selectedId ? { ...profile, ...profileForm } : profile,
        ),
      );
      registerLog(
        "Perfil atualizado",
        "Usuários & Acesso",
        profileForm.name,
        "Sucesso",
        actor,
      );
    }
    closeModal();
  };

  const inactivateUser = (account: Account) => {
    if (account.id === activeAccount?.id) {
      setNotice("O usuário da sessão atual não pode ser inativado.");
      return;
    }
    setAccounts((current) =>
      current.map((item) =>
        item.id === account.id ? { ...item, status: "Inativo" } : item,
      ),
    );
    registerLog(
      "Usuário inativado",
      "Usuários & Acesso",
      account.name,
      "Sucesso",
      actor,
    );
    setNotice(`${account.name} foi inativado.`);
  };

  const inactivateProfile = (profile: AccessProfile) => {
    const activeAssociations = accounts.filter(
      (account) => account.status === "Ativo" && account.profileIds.includes(profile.id),
    );
    if (activeAssociations.length) {
      setNotice(
        `Remova ${activeAssociations.length} usuário(s) ativo(s) deste perfil antes de inativá-lo.`,
      );
      return;
    }
    setProfiles((current) =>
      current.map((item) =>
        item.id === profile.id ? { ...item, status: "Inativo" } : item,
      ),
    );
    registerLog(
      "Perfil inativado",
      "Usuários & Acesso",
      profile.name,
      "Sucesso",
      actor,
    );
  };

  const toggleProfile = (profile: AccessProfile) => {
    if (!selectedUser) return;
    const associated = selectedUser.profileIds.includes(profile.id);
    if (associated && selectedUser.profileIds.length === 1) {
      setError("O usuário deve permanecer associado a pelo menos um perfil.");
      return;
    }
    setError("");
    setAccounts((current) =>
      current.map((account) =>
        account.id === selectedUser.id
          ? {
              ...account,
              profileIds: associated
                ? account.profileIds.filter((id) => id !== profile.id)
                : [...account.profileIds, profile.id],
            }
          : account,
      ),
    );
    registerLog(
      associated ? "Perfil removido do usuário" : "Perfil associado ao usuário",
      "Usuários & Acesso",
      `${selectedUser.name}: ${profile.name}.`,
      "Sucesso",
      actor,
    );
  };

  const updatePassword = () => {
    if (!selectedUser) return;
    if (!passwordIsValid(passwordForm.password)) {
      setError("A senha deve ter ao menos 8 caracteres, com maiúscula, minúscula e número.");
      return;
    }
    if (passwordForm.password !== passwordForm.confirmation) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    if (passwordForm.password === selectedUser.password) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }
    setAccounts((current) =>
      current.map((account) =>
        account.id === selectedUser.id
          ? {
              ...account,
              password: passwordForm.password,
              passwordUpdatedAt: new Date().toISOString(),
            }
          : account,
      ),
    );
    registerLog(
      "Senha atualizada",
      "Usuários & Acesso",
      `Senha de ${selectedUser.name} atualizada pelo administrador.`,
      "Sucesso",
      actor,
    );
    closeModal();
  };

  const normalizedSearch = search.toLowerCase();
  const filteredAccounts = accounts.filter(
    (account) =>
      (!normalizedSearch ||
        account.name.toLowerCase().includes(normalizedSearch) ||
        account.email.toLowerCase().includes(normalizedSearch) ||
        account.login.toLowerCase().includes(normalizedSearch)) &&
      (!statusFilter || account.status === statusFilter),
  );
  const filteredProfiles = profiles.filter(
    (profile) =>
      (!normalizedSearch || profile.name.toLowerCase().includes(normalizedSearch)) &&
      (!statusFilter || profile.status === statusFilter),
  );
  const filteredLogs = logs.filter((log) => {
    const date = log.dateTime.slice(0, 10);
    return (
      (!logFilters.userId || log.userId === Number(logFilters.userId)) &&
      (!logFilters.module || log.module === logFilters.module) &&
      (!logFilters.result || log.result === logFilters.result) &&
      (!logFilters.start || date >= logFilters.start) &&
      (!logFilters.end || date <= logFilters.end)
    );
  });

  const activeUsers = accounts.filter((account) => account.status === "Ativo").length;
  const activeProfiles = profiles.filter((profile) => profile.status === "Ativo").length;
  const failedLogins = logs.filter(
    (log) => log.operation === "Autenticação" && log.result === "Falha",
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários & Acesso — RF115 a RF130"
        actions={
          tab !== "logs" ? (
            <Btn onClick={openNew}>
              {tab === "usuarios" ? "Novo usuário" : "Novo perfil de acesso"}
            </Btn>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Usuários ativos" value={String(activeUsers)} />
        <Metric label="Perfis ativos" value={String(activeProfiles)} />
        <Metric label="Operações registradas" value={String(logs.length)} />
        <Metric label="Acessos com falha" value={String(failedLogins)} />
      </div>

      <Tabs
        tabs={[
          { id: "usuarios", label: "Usuários" },
          { id: "perfis", label: "Perfis de acesso" },
          { id: "logs", label: "Logs de operação" },
        ]}
        active={tab}
        onChange={changeTab}
      />

      {notice && <Alert type="warning">{notice}</Alert>}

      {tab !== "logs" && (
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px]">
            <Input
              label="Buscar"
              placeholder={tab === "usuarios" ? "Nome, e-mail ou login" : "Nome do perfil"}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </Select>
          </div>

          {tab === "usuarios" ? (
            <Table
              headers={["Usuário", "Login", "Perfis", "Último acesso", "Status", "Ações"]}
              rows={filteredAccounts.map((account) => [
                <div>
                  <p className="font-bold text-primary">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.email}</p>
                </div>,
                account.login,
                profileNames(account),
                formatDate(account.lastAccess),
                <Badge
                  label={account.status}
                  color={account.status === "Ativo" ? "green" : "gray"}
                />,
                <div className="flex flex-wrap gap-1">
                  <Btn small variant="ghost" onClick={() => openView(account.id)}>
                    Consultar
                  </Btn>
                  {account.status === "Ativo" && (
                    <>
                      <Btn small variant="ghost" onClick={() => openEdit(account.id)}>
                        Atualizar
                      </Btn>
                      <Btn
                        small
                        variant="secondary"
                        onClick={() => {
                          setSelectedId(account.id);
                          setError("");
                          setModalMode("profiles");
                        }}
                      >
                        Perfis
                      </Btn>
                      <Btn
                        small
                        variant="secondary"
                        onClick={() => {
                          setSelectedId(account.id);
                          setPasswordForm({ password: "", confirmation: "" });
                          setError("");
                          setModalMode("password");
                        }}
                      >
                        Atualizar senha
                      </Btn>
                      <Btn small variant="danger" onClick={() => inactivateUser(account)}>
                        Inativar
                      </Btn>
                    </>
                  )}
                </div>,
              ])}
            />
          ) : (
            <Table
              headers={["Perfil", "Descrição", "Permissões", "Usuários", "Status", "Ações"]}
              rows={filteredProfiles.map((profile) => [
                profile.name,
                profile.description,
                `${profile.permissions.length} módulos`,
                accounts.filter((account) => account.profileIds.includes(profile.id)).length,
                <Badge
                  label={profile.status}
                  color={profile.status === "Ativo" ? "green" : "gray"}
                />,
                <div className="flex flex-wrap gap-1">
                  <Btn small variant="ghost" onClick={() => openView(profile.id)}>
                    Consultar
                  </Btn>
                  {profile.status === "Ativo" && (
                    <>
                      <Btn small variant="ghost" onClick={() => openEdit(profile.id)}>
                        Atualizar
                      </Btn>
                      <Btn small variant="danger" onClick={() => inactivateProfile(profile)}>
                        Inativar
                      </Btn>
                    </>
                  )}
                </div>,
              ])}
            />
          )}
        </Card>
      )}

      {tab === "logs" && (
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              label="Usuário"
              value={logFilters.userId}
              onChange={(event) =>
                setLogFilters((current) => ({ ...current, userId: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <Select
              label="Módulo"
              value={logFilters.module}
              onChange={(event) =>
                setLogFilters((current) => ({ ...current, module: event.target.value }))
              }
            >
              <option value="">Todos</option>
              <option>Sistema</option>
              <option>Usuários & Acesso</option>
              <option>Check-in / Out</option>
            </Select>
            <Select
              label="Resultado"
              value={logFilters.result}
              onChange={(event) =>
                setLogFilters((current) => ({ ...current, result: event.target.value }))
              }
            >
              <option value="">Todos</option>
              <option>Sucesso</option>
              <option>Falha</option>
            </Select>
            <Input
              label="Data inicial"
              type="date"
              value={logFilters.start}
              onChange={(event) =>
                setLogFilters((current) => ({ ...current, start: event.target.value }))
              }
            />
            <Input
              label="Data final"
              type="date"
              value={logFilters.end}
              onChange={(event) =>
                setLogFilters((current) => ({ ...current, end: event.target.value }))
              }
            />
          </div>
          <Table
            headers={["Data e hora", "Usuário", "Operação", "Módulo", "Detalhes", "Resultado", "IP"]}
            rows={filteredLogs.map((log) => [
              formatDate(log.dateTime),
              log.userName,
              log.operation,
              log.module,
              log.details,
              <Badge
                label={log.result}
                color={log.result === "Sucesso" ? "green" : "red"}
              />,
              log.ip,
            ])}
          />
          <div className="mt-4">
            <Alert type="info">
              Logs são registros insert-only e não podem ser alterados ou excluídos.
            </Alert>
          </div>
        </Card>
      )}

      {(modalMode === "new" || modalMode === "edit") && tab === "usuarios" && (
        <Modal
          wide
          title={modalMode === "new" ? "Cadastrar usuário" : "Atualizar usuário"}
          onClose={closeModal}
        >
          <FormGrid cols={2}>
            <Input
              label="Nome completo *"
              value={userForm.name}
              onChange={(event) =>
                setUserForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              label="E-mail *"
              type="email"
              value={userForm.email}
              onChange={(event) =>
                setUserForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <Input
              label="Login *"
              value={userForm.login}
              onChange={(event) =>
                setUserForm((current) => ({ ...current, login: event.target.value }))
              }
            />
            {modalMode === "new" && (
              <>
                <Input
                  label="Senha inicial *"
                  type="password"
                  helpText="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
                <Select
                  label="Perfil inicial *"
                  value={userForm.profileId}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      profileId: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {profiles
                    .filter((profile) => profile.status === "Ativo")
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                </Select>
              </>
            )}
            {error && (
              <FullCol>
                <Alert type="error">{error}</Alert>
              </FullCol>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>Voltar</Btn>
              <Btn onClick={saveUser}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {(modalMode === "new" || modalMode === "edit") && tab === "perfis" && (
        <Modal
          wide
          title={modalMode === "new" ? "Cadastrar perfil de acesso" : "Atualizar perfil de acesso"}
          onClose={closeModal}
        >
          <FormGrid cols={2}>
            <Input
              label="Nome do perfil *"
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <FullCol>
              <Textarea
                label="Descrição *"
                value={profileForm.description}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </FullCol>
            <FullCol>
              <Select
                label="Módulos permitidos *"
                multiple
                size={10}
                value={profileForm.permissions}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    permissions: Array.from(
                      event.target.selectedOptions,
                      (option) => option.value,
                    ),
                  }))
                }
              >
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.label}
                  </option>
                ))}
              </Select>
            </FullCol>
            {error && (
              <FullCol>
                <Alert type="error">{error}</Alert>
              </FullCol>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>Voltar</Btn>
              <Btn onClick={saveProfile}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {modalMode === "profiles" && selectedUser && (
        <Modal wide title={`Perfis de ${selectedUser.name}`} onClose={closeModal}>
          <div className="space-y-3">
            {profiles
              .filter((profile) => profile.status === "Ativo")
              .map((profile) => {
                const associated = selectedUser.profileIds.includes(profile.id);
                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between gap-4 rounded-lg bg-surface p-3"
                  >
                    <div>
                      <p className="font-bold text-primary">{profile.name}</p>
                      <p className="text-sm text-gray-600">{profile.description}</p>
                    </div>
                    <Btn
                      small
                      variant={associated ? "danger" : "secondary"}
                      onClick={() => toggleProfile(profile)}
                    >
                      {associated ? "Remover perfil" : "Associar perfil"}
                    </Btn>
                  </div>
                );
              })}
            {error && <Alert type="error">{error}</Alert>}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>Concluir</Btn>
            </FormActions>
          </div>
        </Modal>
      )}

      {modalMode === "password" && selectedUser && (
        <Modal title={`Atualizar senha — ${selectedUser.name}`} onClose={closeModal}>
          <div className="space-y-4">
            <Alert type="info">
              A nova senha deve ter ao menos 8 caracteres, com maiúscula, minúscula e número.
            </Alert>
            <Input
              label="Nova senha *"
              type="password"
              value={passwordForm.password}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
            <Input
              label="Confirmar nova senha *"
              type="password"
              value={passwordForm.confirmation}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmation: event.target.value,
                }))
              }
            />
            {error && <Alert type="error">{error}</Alert>}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>Voltar</Btn>
              <Btn onClick={updatePassword}>Atualizar senha</Btn>
            </FormActions>
          </div>
        </Modal>
      )}

      {modalMode === "view" && (
        <Modal wide title="Consultar registro" onClose={closeModal}>
          <div className="space-y-4">
            {tab === "usuarios" && selectedUser && (
              <FormGrid cols={2}>
                <Info label="Nome" value={selectedUser.name} />
                <Info label="Status" value={selectedUser.status} />
                <Info label="E-mail" value={selectedUser.email} />
                <Info label="Login" value={selectedUser.login} />
                <Info label="Último acesso" value={formatDate(selectedUser.lastAccess)} />
                <Info label="Senha atualizada em" value={formatDate(selectedUser.passwordUpdatedAt)} />
                <FullCol>
                  <Info label="Perfis associados" value={profileNames(selectedUser)} />
                </FullCol>
              </FormGrid>
            )}
            {tab === "perfis" && selectedProfile && (
              <FormGrid cols={2}>
                <Info label="Perfil" value={selectedProfile.name} />
                <Info label="Status" value={selectedProfile.status} />
                <FullCol>
                  <Info label="Descrição" value={selectedProfile.description} />
                </FullCol>
                <FullCol>
                  <Info
                    label="Módulos permitidos"
                    value={modules
                      .filter((module) => selectedProfile.permissions.includes(module.id))
                      .map((module) => module.label)
                      .join(", ")}
                  />
                </FullCol>
              </FormGrid>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>Fechar</Btn>
            </FormActions>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-h-24">
      <p className="text-xs font-bold uppercase tracking-wider text-primary/70">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-primary/70">{label}</p>
      <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
  );
}
