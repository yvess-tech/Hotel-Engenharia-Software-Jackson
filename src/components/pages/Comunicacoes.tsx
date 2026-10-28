import { useEffect, useRef, useState } from "react"

import { useAccessControl } from "../../access-control"

import {
  useHotelOperations,
  type Communication,
  type CommunicationChannel,
  type CommunicationNature,
} from "../HotelOperationsContext"

import {
  FormSection,
  Alert,
  Badge,
  Btn,
  Card,
  FormActions,
  FormGrid,
  FullCol,
  Input,
  KpiCard,
  Modal,
  PageHeader,
  SectionTitle,
  Select,
  Table,
  Tabs,
  Textarea,
} from "../ui"

type Tab = "comunicacoes" | "integracoes"

type Channel = CommunicationChannel

type Nature = CommunicationNature

type ModalMode = "new" | "view" | null

interface Integration {
  channel: Channel

  provider: string

  mode: "API" | "Webhook"

  endpoint: string

  status: "Ativa" | "Inativa"

  lastCheck: string
}

const templates: Record<string, {
  subject: string
  message: string
  trigger: string
  nature: Nature
}> = {
  "Confirmação de reserva": {
    subject: "Sua reserva no Hotel Pacaas Novos está confirmada",

    message:
      "Olá, {{nome}}. Sua reserva {{reserva}} está confirmada. Esperamos você em {{checkin}}.",

    trigger: "Reserva confirmada",

    nature: "Transacional",
  },

  "Lembrete de check-in": {
    subject: "Seu check-in está próximo",

    message:
      "Olá, {{nome}}. Seu check-in no Hotel Pacaas Novos será em {{checkin}}. Estamos preparando tudo para sua chegada.",

    trigger: "24 horas antes do check-in",

    nature: "Transacional",
  },

  "Agradecimento pós-estadia": {
    subject: "Obrigado por se hospedar conosco",

    message:
      "Olá, {{nome}}. Agradecemos sua estadia no Hotel Pacaas Novos e esperamos receber você novamente.",

    trigger: "2 horas após o check-out",

    nature: "Transacional",
  },

  "Pesquisa de satisfação": {
    subject: "Conte como foi sua experiência",

    message:
      "Olá, {{nome}}. Sua opinião é importante. Responda nossa pesquisa de satisfação: {{link_pesquisa}}.",

    trigger: "1 dia após o check-out",

    nature: "Transacional",
  },

  "Oferta personalizada": {
    subject: "Uma oferta especial para sua próxima estadia",

    message:
      "Olá, {{nome}}. Preparamos uma condição especial para sua próxima visita ao Hotel Pacaas Novos.",

    trigger: "Campanha segmentada",

    nature: "Promocional",
  },
}

const integrations: Integration[] = [
  {
    channel: "E-mail",

    provider: "SendGrid",

    mode: "API",

    endpoint: "/v3/mail/send",

    status: "Ativa",

    lastCheck: "2026-09-13T09:55",
  },

  {
    channel: "SMS",

    provider: "Infobip",

    mode: "API",

    endpoint: "/sms/2/text/advanced",

    status: "Ativa",

    lastCheck: "2026-09-13T09:54",
  },

  {
    channel: "WhatsApp",

    provider: "n8n",

    mode: "Webhook",

    endpoint: "/webhook/hotel-whatsapp",

    status: "Ativa",

    lastCheck: "2026-09-13T09:53",
  },
]

const initialCommunications: Communication[] = [
  {
    id: 1,

    code: "COM-0418",

    type: "Confirmação de reserva",

    recipient: "Ana Souza",

    destination: "ana.souza@email.com",

    channel: "E-mail",

    nature: "Transacional",

    subject: "Sua reserva no Hotel Pacaas Novos está confirmada",

    message: "Olá, Ana. Sua reserva RSV-2048 está confirmada para 20/09/2026.",

    trigger: "Reserva confirmada · RSV-2048",

    scheduledAt: "2026-09-13T10:00",

    status: "Enviada",

    queued: false,

    attempts: 1,

    provider: "SendGrid",

    endpoint: "/v3/mail/send",

    createdAt: "2026-09-13T09:59",

    sentAt: "2026-09-13T10:00",

    externalId: "sg_92f1a4e7",
  },

  {
    id: 2,

    code: "COM-0419",

    type: "Lembrete de check-in",

    recipient: "Maria Costa",

    destination: "+5569992104480",

    channel: "SMS",

    nature: "Transacional",

    subject: "Seu check-in está próximo",

    message: "Olá, Maria. Seu check-in será amanhã, a partir das 14h.",

    trigger: "24 horas antes do check-in · RSV-2051",

    scheduledAt: "2026-09-13T18:00",

    status: "Pendente",

    queued: true,

    attempts: 0,

    provider: "Infobip",

    endpoint: "/sms/2/text/advanced",

    createdAt: "2026-09-13T10:05",
  },

  {
    id: 3,

    code: "COM-0416",

    type: "Agradecimento pós-estadia",

    recipient: "João Silva",

    destination: "joao.silva@email.com",

    channel: "E-mail",

    nature: "Transacional",

    subject: "Obrigado por se hospedar conosco",

    message: "Olá, João. Agradecemos sua estadia no Hotel Pacaas Novos.",

    trigger: "2 horas após o check-out · RSV-2012",

    scheduledAt: "2026-09-12T11:30",

    status: "Enviada",

    queued: false,

    attempts: 1,

    provider: "SendGrid",

    endpoint: "/v3/mail/send",

    createdAt: "2026-09-12T09:30",

    sentAt: "2026-09-12T11:30",

    externalId: "sg_821e0c32",
  },

  {
    id: 4,

    code: "COM-0411",

    type: "Oferta personalizada",

    recipient: "Pedro Lima",

    destination: "+5569998702241",

    channel: "WhatsApp",

    nature: "Promocional",

    subject: "Uma oferta especial para sua próxima estadia",

    message:
      "Olá, Pedro. Preparamos uma condição especial para sua próxima visita. Para não receber ofertas, acesse o link de descadastro.",

    trigger: "Campanha hóspedes recorrentes",

    scheduledAt: "2026-09-11T09:00",

    status: "Falha",

    queued: false,

    attempts: 3,

    provider: "n8n",

    endpoint: "/webhook/hotel-whatsapp",

    createdAt: "2026-09-11T08:55",

    error: "Webhook retornou HTTP 502.",

    unsubscribeUrl: "https://hotel.example/descadastro/tk_0411",
  },
]

const emptyForm = () => {
  const template = templates["Confirmação de reserva"]

  return {
    type: "Confirmação de reserva",

    recipient: "",

    destination: "",

    channel: "E-mail" as Channel,

    nature: template.nature,

    subject: template.subject,

    message: template.message,

    trigger: template.trigger,

    scheduledAt: "",
  }
}

const mockForm = () => ({
  ...emptyForm(),

  recipient: "Mariana Ferreira",

  destination: "mariana.ferreira.demo@pacaasnovos.com.br",

  scheduledAt: new Date().toISOString().slice(0, 16),
})

function formatDate(value?: string) {
  if (!value) return "—"

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  })
}

function integrationFor(channel: Channel) {
  return integrations.find((integration) => integration.channel === channel)!
}

export default function Comunicacoes() {
  const { activeAccount, registerLog } = useAccessControl()

  const { communications, setCommunications } = useHotelOperations()

  const [tab, setTab] = useState<Tab>("comunicacoes")

  const [modalMode, setModalMode] = useState<ModalMode>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [form, setForm] = useState(emptyForm())

  const [search, setSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState("")

  const [channelFilter, setChannelFilter] = useState("")

  const [error, setError] = useState("")

  const [notice, setNotice] = useState("")

  const processingIds = useRef(new Set<number>())

  const selectedCommunication = communications.find(
    (communication) => communication.id === selectedId,
  )

  const actor = activeAccount
    ? { id: activeAccount.id, name: activeAccount.name }
    : undefined

  useEffect(() => {
    const queueWorker = window.setInterval(() => {
      const now = new Date().toISOString().slice(0, 16)

      const due = communications.filter(
        (communication) =>
          communication.status === "Pendente" &&
          communication.queued &&
          communication.scheduledAt <= now &&
          !processingIds.current.has(communication.id),
      )

      due.forEach((communication) => {
        processingIds.current.add(communication.id)

        window.setTimeout(() => {
          const shouldFail =
            communication.destination.toLowerCase().includes("falha") ||
            integrationFor(communication.channel).status !== "Ativa"

          setCommunications((current) =>
            current.map((item) =>
              item.id === communication.id
                ? {
                    ...item,

                    queued: false,

                    attempts: item.attempts + 1,

                    status: shouldFail ? "Falha" : "Enviada",

                    sentAt: shouldFail ? undefined : new Date().toISOString(),

                    externalId: shouldFail
                      ? undefined
                      : `${
                          item.channel === "E-mail"
                            ? "sg"
                            : item.channel === "SMS"
                              ? "ib"
                              : "n8n"
                        }_${Date.now()}`,

                    error: shouldFail
                      ? "O serviço externo não confirmou o recebimento."
                      : undefined,
                  }
                : item,
            ),
          )

          registerLog(
            shouldFail
              ? "Falha no envio de comunicação"
              : "Comunicação enviada",

            "Comunicações",

            `${communication.code} via ${communication.provider}.`,

            shouldFail ? "Falha" : "Sucesso",

            actor,
          )

          processingIds.current.delete(communication.id)
        }, 1200)
      })
    }, 500)

    return () => window.clearInterval(queueWorker)
  }, [communications, registerLog, actor])

  const closeModal = () => {
    setModalMode(null)

    setSelectedId(null)

    setError("")
  }

  const openNew = () => {
    setForm(mockForm())

    setError("")

    setModalMode("new")
  }

  const applyTemplate = (type: string) => {
    const template = templates[type]

    setForm((current) => ({
      ...current,

      type,

      nature: template.nature,

      subject: template.subject,

      message: template.message,

      trigger: template.trigger,
    }))
  }

  const validateForm = () => {
    if (
      !form.type ||
      !form.recipient ||
      !form.destination ||
      !form.subject ||
      !form.message
    ) {
      setError("Preencha destinatário, contato, assunto e mensagem.")

      return false
    }

    if (form.channel === "E-mail" && !form.destination.includes("@")) {
      setError("Informe um endereço de e-mail válido.")

      return false
    }

    if (
      (form.channel === "SMS" || form.channel === "WhatsApp") &&
      form.destination.replace(/\D/g, "").length < 10
    ) {
      setError("Informe um telefone válido, incluindo DDD.")

      return false
    }

    if (integrationFor(form.channel).status !== "Ativa") {
      setError(`A integração de ${form.channel} está indisponível.`)

      return false
    }

    return true
  }

  const saveCommunication = (send: boolean) => {
    setError("")

    if (!validateForm()) return

    const integration = integrationFor(form.channel)

    const id = Date.now()

    const code = `COM-${String(419 + communications.length).padStart(4, "0")}`

    const unsubscribeUrl =
      form.nature === "Promocional"
        ? `https://hotel.example/descadastro/tk_${id}`
        : undefined

    const optOutText =
      form.nature === "Promocional"
        ? `\n\nNão deseja receber ofertas? Descadastre-se: ${unsubscribeUrl}`
        : ""

    const communication: Communication = {
      id,

      code,

      type: form.type,

      recipient: form.recipient,

      destination: form.destination,

      channel: form.channel,

      nature: form.nature,

      subject: form.subject,

      message: `${form.message}${optOutText}`,

      trigger: form.trigger || "Registro manual",

      scheduledAt:
        form.scheduledAt || (send ? new Date().toISOString().slice(0, 16) : ""),

      status: "Pendente",

      queued: send,

      attempts: 0,

      provider: integration.provider,

      endpoint: integration.endpoint,

      createdAt: new Date().toISOString(),

      unsubscribeUrl,
    }

    setCommunications((current) => [communication, ...current])

    registerLog(
      send ? "Comunicação adicionada à fila" : "Comunicação registrada",

      "Comunicações",

      `${code} · ${form.channel} · ${form.recipient}.`,

      "Sucesso",

      actor,
    )

    setNotice(
      send
        ? `${code} foi adicionado à fila. Você pode continuar usando o sistema.`
        : `${code} foi registrado como pendente.`,
    )

    closeModal()
  }

  const queueCommunication = (communication: Communication) => {
    setCommunications((current) =>
      current.map((item) =>
        item.id === communication.id
          ? {
              ...item,

              status: "Pendente",

              queued: true,

              scheduledAt:
                item.scheduledAt &&
                item.scheduledAt > new Date().toISOString().slice(0, 16)
                  ? item.scheduledAt
                  : new Date().toISOString().slice(0, 16),

              error: undefined,
            }
          : item,
      ),
    )

    setNotice(`${communication.code} foi adicionado à fila assíncrona.`)

    registerLog(
      communication.status === "Falha"
        ? "Reenvio de comunicação solicitado"
        : "Envio de comunicação solicitado",

      "Comunicações",

      `${communication.code} via ${communication.provider}.`,

      "Sucesso",

      actor,
    )
  }

  const filteredCommunications = communications.filter((communication) => {
    const term = search.toLowerCase()

    return (
      (!term ||
        communication.code.toLowerCase().includes(term) ||
        communication.recipient.toLowerCase().includes(term) ||
        communication.type.toLowerCase().includes(term)) &&
      (!statusFilter || communication.status === statusFilter) &&
      (!channelFilter || communication.channel === channelFilter)
    )
  })

  const sentCount = communications.filter(
    (communication) => communication.status === "Enviada",
  ).length

  const pendingCount = communications.filter(
    (communication) => communication.status === "Pendente",
  ).length

  const failedCount = communications.filter(
    (communication) => communication.status === "Falha",
  ).length

  const queueCount = communications.filter(
    (communication) => communication.queued,
  ).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Comunicações"
        actions={
          tab === "comunicacoes" ? (
            <Btn onClick={openNew}>+ Nova comunicação</Btn>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Enviadas"
          value={String(sentCount)}
          icon="badge-check"
        />
        <KpiCard
          label="Pendentes"
          value={String(pendingCount)}
          icon="circle-pause"
        />
        <KpiCard
          label="Com falha"
          value={String(failedCount)}
          icon="octagon-alert"
          tone={failedCount ? "danger" : "default"}
        />
        <KpiCard
          label="Na fila agora"
          value={String(queueCount)}
          icon="arrow-left-right"
        />
      </div>

      <Tabs
        tabs={[
          { id: "comunicacoes", label: "Comunicações" },

          { id: "integracoes", label: "Integrações externas" },
        ]}
        active={tab}
        onChange={(nextTab) => {
          setTab(nextTab)

          setNotice("")
        }}
      />

      {notice && <Alert type="success">{notice}</Alert>}

      {tab === "comunicacoes" && (
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Input
              label="Buscar"
              placeholder="Código, tipo ou destinatário"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option>Enviada</option>
              <option>Pendente</option>
              <option>Falha</option>
            </Select>
            <Select
              label="Canal"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option>E-mail</option>
              <option>SMS</option>
              <option>WhatsApp</option>
            </Select>
          </div>

          <Table
            headers={[
              "Código",
              "Comunicação",
              "Destinatário",
              "Canal",
              "Agendamento",
              "Provedor",
              "Status",
              "Ações",
            ]}
            rows={filteredCommunications.map((communication) => [
              communication.code,

              <div>
                <p className="font-bold text-primary">{communication.type}</p>
                <p className="text-xs text-gray-500">
                  {communication.nature} · {communication.trigger}
                </p>
              </div>,

              <div>
                <p>{communication.recipient}</p>
                <p className="text-xs text-gray-500">
                  {communication.destination}
                </p>
              </div>,

              communication.channel,

              communication.scheduledAt
                ? formatDate(communication.scheduledAt)
                : "Não agendado",

              communication.provider,

              <div>
                <Badge
                  label={communication.status}
                  color={
                    communication.status === "Enviada"
                      ? "green"
                      : communication.status === "Falha"
                        ? "red"
                        : "yellow"
                  }
                />
                {communication.queued && (
                  <p className="mt-1 text-xs text-gray-500">
                    Na fila assíncrona
                  </p>
                )}
              </div>,

              <div className="flex flex-wrap gap-1">
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelectedId(communication.id)

                    setModalMode("view")
                  }}
                >
                  Consultar
                </Btn>
                {communication.status !== "Enviada" &&
                  !communication.queued && (
                    <Btn
                      small
                      variant="secondary"
                      onClick={() => queueCommunication(communication)}
                    >
                      {communication.status === "Falha" ? "Reenviar" : "Enviar"}
                    </Btn>
                  )}
              </div>,
            ])}
          />

          <div className="mt-4">
            <Alert type="info">
              Os disparos são processados em segundo plano. A tela permanece
              disponível enquanto a fila envia as mensagens.
            </Alert>
          </div>
        </Card>
      )}

      {tab === "integracoes" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.channel}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary/70">
                    {integration.channel}
                  </p>
                  <p className="mt-1 text-xl font-bold text-primary">
                    {integration.provider}
                  </p>
                </div>
                <Badge
                  label={integration.status}
                  color={integration.status === "Ativa" ? "green" : "gray"}
                />
              </div>
              <div className="mt-5 space-y-3">
                <Info label="Integração" value={integration.mode} />
                <Info label="Endpoint" value={integration.endpoint} />
                <Info
                  label="Última verificação"
                  value={formatDate(integration.lastCheck)}
                />
              </div>
            </Card>
          ))}
          <div className="lg:col-span-3">
            <Alert type="info">
              As credenciais dos provedores devem permanecer no backend. O
              frontend envia apenas a solicitação para a API ou webhook
              configurado.
            </Alert>
          </div>
        </div>
      )}

      {modalMode === "new" && (
        <Modal
          wide
          title="Registrar comunicação"
          onClose={closeModal}
          footer={
            <>
              {error && (
                <FullCol>
                  <Alert type="error">{error}</Alert>
                </FullCol>
              )}
              <FormActions>
                <Btn variant="ghost" onClick={closeModal}>
                  Voltar
                </Btn>
                <Btn
                  variant="secondary"
                  onClick={() => saveCommunication(false)}
                >
                  Apenas registrar
                </Btn>
                <Btn onClick={() => saveCommunication(true)}>
                  Registrar e enviar
                </Btn>
              </FormActions>
            </>
          }
          intent="create"
          size="lg"
          description="Escolha o destinatário, o canal e o conteúdo antes de registrar o envio."
        >
          <FormGrid cols={2}>
            <FullCol>
              <FormSection title="Destinatário e canal">
                <FormGrid cols={2}>
                  <Select
                    label="Tipo de comunicação *"
                    value={form.type}
                    onChange={(event) => applyTemplate(event.target.value)}
                  >
                    {Object.keys(templates).map((template) => (
                      <option key={template}>{template}</option>
                    ))}
                  </Select>
                  <Select
                    label="Canal *"
                    value={form.channel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        channel: event.target.value as Channel,
                      }))
                    }
                  >
                    <option>E-mail</option>
                    <option>SMS</option>
                    <option>WhatsApp</option>
                  </Select>
                  <Input
                    label="Destinatário *"
                    value={form.recipient}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recipient: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label={
                      form.channel === "E-mail"
                        ? "E-mail de destino *"
                        : "Telefone de destino *"
                    }
                    placeholder={
                      form.channel === "E-mail"
                        ? "cliente@email.com"
                        : "(00) 00000-0000"
                    }
                    value={form.destination}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        destination: event.target.value,
                      }))
                    }
                  />
                </FormGrid>
              </FormSection>
            </FullCol>
            <FullCol>
              <FormSection title="Agendamento e finalidade">
                <FormGrid cols={2}>
                  <Select
                    label="Natureza"
                    value={form.nature}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        nature: event.target.value as Nature,
                      }))
                    }
                  >
                    <option>Transacional</option>
                    <option>Promocional</option>
                  </Select>
                  <Input
                    label="Data e hora de envio"
                    type="datetime-local"
                    helpText="Deixe vazio para envio imediato ao adicionar à fila."
                    value={form.scheduledAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        scheduledAt: event.target.value,
                      }))
                    }
                  />
                  <FullCol>
                    <Input
                      label="Gatilho ou origem"
                      value={form.trigger}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          trigger: event.target.value,
                        }))
                      }
                    />
                  </FullCol>
                </FormGrid>
              </FormSection>
            </FullCol>
            <FullCol>
              <FormSection title="Conteúdo da comunicação">
                <FormGrid cols={2}>
                  <FullCol>
                    <Input
                      label="Assunto *"
                      value={form.subject}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }
                    />
                  </FullCol>
                  <FullCol>
                    <Textarea
                      label="Mensagem *"
                      rows={6}
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                    />
                  </FullCol>
                  {form.nature === "Promocional" && (
                    <FullCol>
                      <Alert type="warning">
                        Um link individual de descadastro será acrescentado
                        automaticamente à mensagem promocional.
                      </Alert>
                    </FullCol>
                  )}
                  <FullCol>
                    <Alert type="info">
                      Integração selecionada:{" "}
                      {integrationFor(form.channel).provider} via{" "}
                      {integrationFor(form.channel).mode}.
                    </Alert>
                  </FullCol>
                </FormGrid>
              </FormSection>
            </FullCol>
          </FormGrid>
        </Modal>
      )}

      {modalMode === "view" && selectedCommunication && (
        <Modal
          wide
          title={`Comunicação ${selectedCommunication.code}`}
          onClose={closeModal}
        >
          <div className="space-y-5">
            <FormGrid cols={2}>
              <Info label="Tipo" value={selectedCommunication.type} />
              <Info label="Status" value={selectedCommunication.status} />
              <Info
                label="Destinatário"
                value={`${selectedCommunication.recipient} · ${selectedCommunication.destination}`}
              />
              <Info label="Canal" value={selectedCommunication.channel} />
              <Info label="Natureza" value={selectedCommunication.nature} />
              <Info label="Gatilho" value={selectedCommunication.trigger} />
              <Info
                label="Agendamento"
                value={
                  selectedCommunication.scheduledAt
                    ? formatDate(selectedCommunication.scheduledAt)
                    : "Não agendado"
                }
              />
              <Info
                label="Enviado em"
                value={formatDate(selectedCommunication.sentAt)}
              />
              <Info
                label="Provedor"
                value={`${selectedCommunication.provider} · ${selectedCommunication.endpoint}`}
              />
              <Info
                label="Tentativas"
                value={String(selectedCommunication.attempts)}
              />
              <FullCol>
                <Info label="Assunto" value={selectedCommunication.subject} />
              </FullCol>
              <FullCol>
                <Info
                  label="Mensagem enviada"
                  value={selectedCommunication.message}
                />
              </FullCol>
            </FormGrid>

            {selectedCommunication.externalId && (
              <Alert type="success">
                Envio confirmado pelo provedor. Identificador externo:{" "}
                {selectedCommunication.externalId}.
              </Alert>
            )}
            {selectedCommunication.error && (
              <Alert type="error">
                Falha no envio: {selectedCommunication.error}
              </Alert>
            )}
            {selectedCommunication.unsubscribeUrl && (
              <Alert type="info">
                Descadastro promocional disponível em:{" "}
                {selectedCommunication.unsubscribeUrl}
              </Alert>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>
                Fechar
              </Btn>
            </FormActions>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-primary/70">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
        {value}
      </p>
    </div>
  )
}
