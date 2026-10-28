import { useEffect, useMemo, useState } from "react"
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
  SectionTitle,
  Select,
  Table,
  Tabs,
  Textarea,
  formatDisplayDate,
} from "../ui"
import {
  calculatePackageValue,
  countNights,
  createPackageSnapshot,
  formatMoney,
  packageEligibility,
  PAYMENT_METHODS,
  reservationBaseValue,
  today,
  useHotelOperations,
  type ContractType,
  type ReceiptStatus,
  type Reservation,
  type ReservationStatus,
} from "../HotelOperationsContext"
import { useDemoEngine } from "../demo/DemoEngineContext"

type Tab = "reservas" | "recebimentos"
type ReservationModal = "new" | "edit" | "view" | "cancel" | null
type ReceiptModal = "new" | "view" | null

const validStatuses: ReservationStatus[] = [
  "Pendente",
  "Confirmada",
  "Hospedado",
  "Concluída",
  "Cancelada",
]
const emptyReservation = {
  clientId: "",
  guest: "",
  companions: "",
  entry: "",
  exit: "",
  category: "Standard",
  roomId: "",
  guests: "1",
  status: "Pendente" as ReservationStatus,
  contractType: "Tarifa convencional" as ContractType,
  packageId: "",
  notes: "",
}
const emptyReceipt = () => ({
  reservationId: "",
  date: today(),
  value: "",
  method: "pix",
  notes: "",
})
const mockReceipt = (reservationId = "") => ({
  reservationId,
  date: today(),
  value: "250",
  method: "pix",
  notes: "Recebimento de exemplo para demonstração.",
})
const mockQuickClient = {
  name: "Rafael Monteiro Demo",
  cpf: "111.444.777-35",
  email: "rafael.demo@pacaasnovos.com.br",
  phone: "(69) 99321-7788",
}

export default function Reservas() {
  const {
    clients,
    rooms,
    setRooms,
    categories,
    reservations,
    receipts,
    packages,
    setReservations,
    createClient,
    registerReceipt,
    changeReceiptStatus,
    cancelReservation,
    activeReceiptsTotal,
  } = useHotelOperations()
  const [tab, setTab] = useState<Tab>("reservas")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [reservationModal, setReservationModal] =
    useState<ReservationModal>(null)
  const [receiptModal, setReceiptModal] = useState<ReceiptModal>(null)
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
    null,
  )
  const [cancelReason, setCancelReason] = useState("")
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [validation, setValidation] = useState("")
  const [form, setForm] = useState(emptyReservation)
  const [receiptForm, setReceiptForm] = useState(emptyReceipt())
  const [quickClientOpen, setQuickClientOpen] = useState(false)
  const [quickClient, setQuickClient] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
  })
  const [quickClientError, setQuickClientError] = useState("")
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [demoScenarioKey, setDemoScenarioKey] = useState("")
  const demo = useDemoEngine()

  useEffect(() => {
    const command = demo.activeCommand
    if (!command || command.target !== "reservas") return
    const scenarioKey = demo.scenario?.scenarioKey ?? ""
    if (command.command === "prefill-reservation-form") {
      const entry = today()
      const departure = new Date(`${entry}T12:00:00`)
      departure.setDate(
        departure.getDate() + Number(command.payload.nights ?? 3),
      )
      const client = clients.find(
        (item) => item.id === demo.scenario?.ids.clientId,
      )
      const room = rooms.find((item) => item.id === demo.scenario?.ids.roomId)
      const commercialPackage = packages.find(
        (item) => item.id === demo.scenario?.ids.packageId,
      )
      if (!client || !room || !commercialPackage) {
        demo.resolveCommand(command.id, {
          status: "error",
          message: "Cliente, quarto ou pacote do cenário não foi encontrado.",
        })
        return
      }
      setSelected(null)
      setDemoScenarioKey(scenarioKey)
      setForm({
        ...emptyReservation,
        clientId: String(client.id),
        guest: client.name,
        entry,
        exit: departure.toISOString().slice(0, 10),
        category: room.category,
        roomId: String(room.id),
        guests: "1",
        status: "Confirmada",
        contractType: "Pacote comercial",
        packageId: String(commercialPackage.id),
        notes: "Reserva fictícia exclusiva da demonstração operacional.",
      })
      setTab("reservas")
      setValidation("")
      setReservationModal("new")
      demo.resolveCommand(command.id, {
        status: "running",
        message:
          "Reserva preenchida. Revise disponibilidade, pacote e use Salvar Reserva.",
      })
    } else if (command.command === "prefill-deposit-form") {
      const reservation = reservations.find(
        (item) => item.id === demo.scenario?.ids.reservationId,
      )
      if (!reservation) {
        demo.resolveCommand(command.id, {
          status: "error",
          message: "Reserva do cenário não encontrada.",
        })
        return
      }
      setReceiptForm({
        reservationId: String(reservation.id),
        date: today(),
        value: String(command.payload.value),
        method: String(command.payload.method),
        notes: "Antecipação da jornada demonstrativa.",
      })
      setTab("recebimentos")
      setValidation("")
      setReceiptModal("new")
      demo.resolveCommand(command.id, {
        status: "running",
        message: "Antecipação preenchida. Use Confirmar Recebimento.",
      })
    }
  }, [demo.activeCommand])

  useEffect(() => {
    if (!form.entry || !form.exit || !form.category) return
    setCheckingAvailability(true)
    const timer = window.setTimeout(() => setCheckingAvailability(false), 350)
    return () => window.clearTimeout(timer)
  }, [form.entry, form.exit, form.category])

  const nights = countNights(form.entry, form.exit)
  const availableRooms = useMemo(() => {
    if (!form.entry || !form.exit) return []
    return rooms.filter((room) => {
      if (
        room.category !== form.category ||
        room.maintenanceStatus === "Bloqueado"
      )
        return false
      const conflict = reservations.some(
        (reservation) =>
          reservation.id !== selected?.id &&
          reservation.roomId === room.id &&
          !["Cancelada", "Concluída"].includes(reservation.status) &&
          form.entry < reservation.exit &&
          form.exit > reservation.entry,
      )
      return !conflict
    })
  }, [form.entry, form.exit, form.category, rooms, reservations, selected])

  const eligiblePackages = packages
    .filter(
      (commercialPackage) =>
        commercialPackage.active &&
        commercialPackage.validFrom <= form.entry &&
        commercialPackage.validTo >= form.exit,
    )
    .map((commercialPackage) => ({
      commercialPackage,
      eligibility: packageEligibility(
        commercialPackage,
        form.entry,
        form.exit,
        form.category,
        Number(form.guests),
      ),
    }))
  const selectedPackage = packages.find(
    (item) => item.id === Number(form.packageId),
  )
  const selectedPackageEligibility = selectedPackage
    ? packageEligibility(
        selectedPackage,
        form.entry,
        form.exit,
        form.category,
        Number(form.guests),
      )
    : null
  const selectedRoom = rooms.find((room) => room.id === Number(form.roomId))
  const dailyRate =
    selectedRoom?.rate ??
    categories.find((category) => category.name === form.category)?.rate ??
    0
  const contractedValue =
    form.contractType === "Pacote comercial" && selectedPackage
      ? calculatePackageValue(selectedPackage, nights)
      : nights * dailyRate
  const received = selected ? activeReceiptsTotal(selected.id) : 0

  const filteredReservations = reservations.filter((reservation) => {
    const query = search.toLowerCase()
    return (
      (!query ||
        reservation.code.toLowerCase().includes(query) ||
        reservation.guest.toLowerCase().includes(query) ||
        rooms
          .find((room) => room.id === reservation.roomId)
          ?.number.includes(query)) &&
      (!statusFilter || reservation.status === statusFilter)
    )
  })
  const clientQuery = clientSearch.trim().toLowerCase()
  const filteredClients = clients.filter(
    (client) =>
      client.status === "Ativo" &&
      (!clientQuery ||
        client.name.toLowerCase().includes(clientQuery) ||
        client.cpf.includes(clientSearch.trim()) ||
        client.email.toLowerCase().includes(clientQuery) ||
        client.phone.includes(clientSearch.trim())),
  )
  const selectedReceipt = receipts.find(
    (receipt) => receipt.id === selectedReceiptId,
  )
  const receiptReservation = reservations.find(
    (reservation) => reservation.id === Number(receiptForm.reservationId),
  )

  const openNew = () => {
    const entry = today()
    const exitDate = new Date(`${entry}T12:00:00`)
    exitDate.setDate(exitDate.getDate() + 2)
    const client = clients.find((item) => item.status === "Ativo") ?? clients[0]
    const category = categories[0]?.name ?? "Standard"
    const room =
      rooms.find(
        (item) =>
          item.category === category && item.maintenanceStatus !== "Bloqueado",
      ) ?? rooms[0]
    setSelected(null)
    setDemoScenarioKey("")
    setValidation("")
    setClientSearch("")
    setForm({
      ...emptyReservation,
      clientId: client ? String(client.id) : "",
      guest: client?.name ?? "",
      companions: "Carlos Monteiro",
      entry,
      exit: exitDate.toISOString().slice(0, 10),
      category: room?.category ?? category,
      roomId: room ? String(room.id) : "",
      guests: "2",
      status: "Confirmada",
      notes: "Reserva de exemplo preenchida para demonstração do cadastro.",
    })
    setReservationModal("new")
  }

  const openEdit = (reservation: Reservation) => {
    setSelected(reservation)
    setValidation("")
    setClientSearch("")
    setForm({
      clientId: String(reservation.clientId),
      guest: reservation.guest,
      companions: reservation.companions.join(", "),
      entry: reservation.entry,
      exit: reservation.exit,
      category: reservation.category,
      roomId: String(reservation.roomId),
      guests: String(reservation.guests),
      status: reservation.status,
      contractType: reservation.contractType,
      packageId: String(reservation.packageId ?? ""),
      notes: reservation.notes,
    })
    setReservationModal("edit")
  }

  const saveReservation = () => {
    const room = rooms.find((item) => item.id === Number(form.roomId))
    const client = clients.find((item) => item.id === Number(form.clientId))
    if (!client || !form.entry || !form.exit || !room || nights < 1) {
      setValidation(
        "Preencha os dados obrigatórios e informe um período válido.",
      )
      return
    }
    if (Number(form.guests) > room.capacity) {
      setValidation(
        `O quarto selecionado comporta no máximo ${room.capacity} hóspedes.`,
      )
      return
    }
    if (
      form.contractType === "Pacote comercial" &&
      (!selectedPackage || !selectedPackageEligibility?.eligible)
    ) {
      setValidation(
        selectedPackageEligibility?.reasons.join("; ") ||
          "Selecione um pacote comercial elegível.",
      )
      return
    }
    const companions = form.companions
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, Math.max(0, Number(form.guests) - 1))
    const packageSnapshot =
      selectedPackage && form.contractType === "Pacote comercial"
        ? createPackageSnapshot(selectedPackage, nights)
        : undefined
    const data = {
      clientId: client.id,
      guest: client.name,
      companions,
      entry: form.entry,
      exit: form.exit,
      category: form.category,
      roomId: room.id,
      guests: Number(form.guests),
      status: form.status,
      dailyRate: room.rate,
      contractType: form.contractType,
      contractedValue,
      packageId: selectedPackage?.id,
      packageSnapshot,
      notes: form.notes,
    }
    if (reservationModal === "new") {
      const nextId = Math.max(0, ...reservations.map((item) => item.id)) + 1
      setReservations((current) => [
        ...current,
        {
          id: nextId,
          scenarioKey: demoScenarioKey || undefined,
          code: `RES-${1000 + nextId}`,
          ...data,
        },
      ])
    } else if (selected) {
      setReservations((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                ...data,
                audit: `Atualizada em ${new Date().toLocaleString("pt-BR")}.`,
              }
            : item,
        ),
      )
      if (selected.roomId !== room.id) {
        setRooms((current) =>
          current.map((item) =>
            item.id === selected.roomId && item.status === "Reservado"
              ? { ...item, status: "Livre" }
              : item,
          ),
        )
      }
    }
    if (
      form.status === "Confirmada" &&
      form.entry <= today() &&
      form.exit > today()
    ) {
      setRooms((current) =>
        current.map((item) =>
          item.id === room.id ? { ...item, status: "Reservado" } : item,
        ),
      )
    }
    setReservationModal(null)
  }

  const saveReceipt = () => {
    const reservationId = Number(receiptForm.reservationId)
    const value = Number(receiptForm.value.replace(",", "."))
    if (!reservationId || value <= 0) return
    const result = registerReceipt({
      reservationId,
      value,
      method: receiptForm.method,
      date: receiptForm.date,
      notes: receiptForm.notes,
      responsible: "Recepção",
    })
    if (!result.ok) {
      setValidation(result.error ?? "Não foi possível registrar o recebimento.")
      return
    }
    setReceiptModal(null)
  }

  const updateReceiptStatus = (
    id: number,
    status: Exclude<ReceiptStatus, "Confirmado">,
  ) => changeReceiptStatus(id, status, "Recepção")

  const saveQuickClient = () => {
    const result = createClient({
      name: quickClient.name,
      cpf: quickClient.cpf,
      documentType: "RG",
      documentNumber: "",
      birthDate: "",
      nationality: "Brasileira",
      gender: "",
      postalCode: "",
      street: "",
      addressNumber: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      email: quickClient.email,
      phone: quickClient.phone,
      emergencyPhone: "",
      emergencyContact: "",
      preferredRoomType: "",
      preferredFloor: "",
      smoker: "Não",
      preferences: "",
    })
    if (!result.ok || !result.client) {
      setQuickClientError(
        result.error ?? "Não foi possível cadastrar o cliente.",
      )
      return
    }
    setForm((current) => ({
      ...current,
      clientId: String(result.client?.id),
      guest: result.client?.name ?? "",
    }))
    setClientSearch(result.client.name)
    setQuickClientOpen(false)
  }

  return (
    <div className="ops-page">
      <PageHeader
        title="Reservas"
        actions={
          tab === "reservas" ? (
            <Btn onClick={openNew}>+ Nova Reserva</Btn>
          ) : (
            <Btn
              onClick={() => {
                const reservation = reservations.find(
                  (item) => item.status !== "Cancelada",
                )
                setReceiptForm(
                  mockReceipt(reservation ? String(reservation.id) : ""),
                )
                setReceiptModal("new")
              }}
            >
              + Cadastrar Recebimento
            </Btn>
          )
        }
      />
      <Tabs
        tabs={[
          { id: "reservas", label: "Reservas" },
          { id: "recebimentos", label: "Recebimentos" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "reservas" && (
        <Card>
          <div className="ops-filters">
            <div className="ops-filter-search">
              <Input
                label="Pesquisar"
                placeholder="Código, hóspede ou quarto"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="ops-filter">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Todos</option>
                {validStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </div>
          </div>
          <Table
            headers={[
              "Código",
              "Responsável",
              "Período",
              "Quarto",
              "Contratação",
              "Valor",
              "Status",
              "Ações",
            ]}
            rows={filteredReservations.map((reservation) => [
              reservation.code,
              reservation.guest,
              `${formatDisplayDate(reservation.entry)} a ${formatDisplayDate(reservation.exit)}`,
              rooms.find((room) => room.id === reservation.roomId)?.number ??
                "—",
              reservation.packageSnapshot?.name ?? reservation.contractType,
              formatMoney(reservationBaseValue(reservation)),
              <Badge label={reservation.status} />,
              <div className="table-actions">
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelected(reservation)
                    setReservationModal("view")
                  }}
                >
                  Consultar
                </Btn>
                <Btn
                  small
                  variant="secondary"
                  disabled={["Hospedado", "Concluída", "Cancelada"].includes(
                    reservation.status,
                  )}
                  onClick={() => openEdit(reservation)}
                >
                  Atualizar
                </Btn>
                {!["Cancelada", "Concluída", "Hospedado"].includes(
                  reservation.status,
                ) && (
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => {
                      setSelected(reservation)
                      setCancelReason("")
                      setReservationModal("cancel")
                    }}
                  >
                    Cancelar Reserva
                  </Btn>
                )}
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "recebimentos" && (
        <Card>
          <Table
            headers={[
              "Código",
              "Reserva",
              "Hóspede",
              "Data",
              "Valor",
              "Forma",
              "Status",
              "Ações",
            ]}
            rows={receipts.map((receipt) => {
              const reservation = reservations.find(
                (item) => item.id === receipt.reservationId,
              )
              return [
                receipt.code,
                reservation?.code ?? "—",
                reservation?.guest ?? "—",
                receipt.date,
                formatMoney(receipt.value),
                receipt.method,
                <Badge label={receipt.status} />,
                <div className="table-actions">
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => {
                      setSelectedReceiptId(receipt.id)
                      setReceiptModal("view")
                    }}
                  >
                    Consultar
                  </Btn>
                  {receipt.status === "Confirmado" && (
                    <>
                      <Btn
                        small
                        variant="danger"
                        onClick={() =>
                          updateReceiptStatus(receipt.id, "Cancelado")
                        }
                      >
                        Cancelar
                      </Btn>
                      <Btn
                        small
                        variant="danger"
                        onClick={() =>
                          updateReceiptStatus(receipt.id, "Estornado")
                        }
                      >
                        Estornar
                      </Btn>
                    </>
                  )}
                </div>,
              ]
            })}
          />
        </Card>
      )}

      {(reservationModal === "new" || reservationModal === "edit") && (
        <Modal
          wide
          title={
            reservationModal === "new"
              ? "Cadastrar Reserva"
              : `Atualizar ${selected?.code}`
          }
          onClose={() => setReservationModal(null)}
        >
          <SectionTitle>Dados da reserva</SectionTitle>
          <FormGrid cols={2}>
            <FullCol>
              <div style={{ position: "relative" }}>
                <Input
                  label="Cliente responsável *"
                  placeholder="Digite nome, CPF, e-mail ou telefone"
                  value={clientPickerOpen ? clientSearch : form.guest}
                  onFocus={() => {
                    setClientPickerOpen(true)
                    setClientSearch("")
                  }}
                  onBlur={() =>
                    window.setTimeout(() => setClientPickerOpen(false), 120)
                  }
                  onChange={(event) => {
                    setClientSearch(event.target.value)
                    setClientPickerOpen(true)
                    setForm({ ...form, clientId: "", guest: "" })
                  }}
                />
                {clientPickerOpen && (
                  <div
                    style={{
                      position: "absolute",
                      zIndex: 20,
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: "4px",
                      maxHeight: "240px",
                      overflowY: "auto",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
                    }}
                  >
                    {filteredClients.length === 0 ? (
                      <div
                        style={{
                          padding: "12px",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.84rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Nenhum cliente ativo encontrado.
                      </div>
                    ) : (
                      filteredClients.slice(0, 8).map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              clientId: String(client.id),
                              guest: client.name,
                            })
                            setClientSearch(client.name)
                            setClientPickerOpen(false)
                          }}
                          style={{
                            width: "100%",
                            border: 0,
                            background: "transparent",
                            padding: "10px 12px",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            color: "var(--text-strong)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontWeight: 700,
                            }}
                          >
                            {client.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-sans)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {client.cpf}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </FullCol>
            <FullCol>
              <Btn
                variant="secondary"
                onClick={() => {
                  setQuickClient(mockQuickClient)
                  setQuickClientError("")
                  setQuickClientOpen(true)
                }}
              >
                + Cadastrar cliente sem perder a reserva
              </Btn>
            </FullCol>
            <Input
              label="Entrada *"
              type="date"
              value={form.entry}
              onChange={(event) =>
                setForm({
                  ...form,
                  entry: event.target.value,
                  roomId: "",
                  packageId: "",
                })
              }
            />
            <Input
              label="Saída *"
              type="date"
              min={form.entry}
              value={form.exit}
              onChange={(event) =>
                setForm({
                  ...form,
                  exit: event.target.value,
                  roomId: "",
                  packageId: "",
                })
              }
            />
            <Input
              label="Quantidade de hóspedes *"
              type="number"
              min="1"
              value={form.guests}
              onChange={(event) =>
                setForm({ ...form, guests: event.target.value, packageId: "" })
              }
            />
            <Select
              label="Categoria *"
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                  roomId: "",
                  packageId: "",
                })
              }
            >
              {categories.map((category) => (
                <option key={category.id}>{category.name}</option>
              ))}
            </Select>
            <Select
              label="Quarto *"
              disabled={checkingAvailability || !form.entry || !form.exit}
              value={form.roomId}
              onChange={(event) =>
                setForm({ ...form, roomId: event.target.value })
              }
            >
              <option value="">Selecione</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number} — {room.category}
                </option>
              ))}
            </Select>
            <Select
              label="Modalidade *"
              value={form.contractType}
              onChange={(event) =>
                setForm({
                  ...form,
                  contractType: event.target.value as ContractType,
                  packageId: "",
                })
              }
            >
              <option>Tarifa convencional</option>
              <option>Pacote comercial</option>
            </Select>
            <Select
              label="Status *"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as ReservationStatus,
                })
              }
            >
              {validStatuses
                .filter(
                  (status) =>
                    !["Cancelada", "Hospedado", "Concluída"].includes(status),
                )
                .map((status) => (
                  <option key={status}>{status}</option>
                ))}
            </Select>
            {form.contractType === "Pacote comercial" && (
              <FullCol>
                <Select
                  label="Pacote comercial *"
                  value={form.packageId}
                  onChange={(event) =>
                    setForm({ ...form, packageId: event.target.value })
                  }
                >
                  <option value="">Selecione um pacote elegível</option>
                  {eligiblePackages.map(
                    ({ commercialPackage, eligibility }) => (
                      <option
                        key={commercialPackage.id}
                        value={commercialPackage.id}
                        disabled={!eligibility.eligible}
                      >
                        {commercialPackage.name} —{" "}
                        {eligibility.eligible
                          ? formatMoney(
                              calculatePackageValue(commercialPackage, nights),
                            )
                          : eligibility.reasons.join(", ")}
                      </option>
                    ),
                  )}
                </Select>
              </FullCol>
            )}
            <FullCol>
              <Input
                label="Acompanhantes"
                helpText="Separe os nomes por vírgula. O responsável não deve ser repetido."
                value={form.companions}
                onChange={(event) =>
                  setForm({ ...form, companions: event.target.value })
                }
              />
            </FullCol>
            <FullCol>
              <Textarea
                label="Observações"
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {checkingAvailability && (
            <p className="inline-state">Consultando disponibilidade...</p>
          )}
          {!checkingAvailability &&
            form.entry &&
            form.exit &&
            availableRooms.length === 0 && (
              <Alert type="warning">
                Nenhum quarto compatível está disponível no período.
              </Alert>
            )}
          {selectedPackage &&
            selectedPackageEligibility &&
            !selectedPackageEligibility.eligible && (
              <Alert type="error">
                Pacote incompatível:{" "}
                {selectedPackageEligibility.reasons.join("; ")}.
              </Alert>
            )}
          {selectedPackage && selectedPackageEligibility?.eligible && (
            <Alert type="success">
              {selectedPackage.name}: {selectedPackage.benefits.join(" · ")}. As
              condições serão congeladas na reserva.
            </Alert>
          )}
          {validation && <Alert type="error">{validation}</Alert>}
          <div className="reservation-summary">
            <SectionTitle>Resumo comercial</SectionTitle>
            <div className="summary-grid">
              <Summary label="Modalidade" value={form.contractType} />
              <Summary label="Diárias" value={String(nights)} />
              <Summary label="Quarto" value={selectedRoom?.number ?? "—"} />
              <Summary
                label="Tarifa"
                value={
                  form.contractType === "Pacote comercial"
                    ? (selectedPackage?.priceRule ?? "—")
                    : formatMoney(dailyRate)
                }
              />
              <Summary
                label="Benefícios"
                value={selectedPackage?.benefits.join(", ") || "Não inclusos"}
              />
              <Summary
                label="Valor contratado"
                value={formatMoney(contractedValue)}
                strong
              />
              <Summary label="Recebimentos" value={formatMoney(received)} />
              <Summary
                label="Saldo previsto"
                value={formatMoney(Math.max(0, contractedValue - received))}
                strong
              />
            </div>
          </div>
          <FormActions>
            <Btn variant="ghost" onClick={() => setReservationModal(null)}>
              Cancelar
            </Btn>
            <Btn disabled={checkingAvailability} onClick={saveReservation}>
              {reservationModal === "new"
                ? "Salvar Reserva"
                : "Atualizar Reserva"}
            </Btn>
          </FormActions>
        </Modal>
      )}

      {reservationModal === "view" && selected && (
        <Modal
          wide
          title={`Reserva ${selected.code}`}
          onClose={() => setReservationModal(null)}
        >
          <ReservationDetails
            reservation={selected}
            roomNumber={
              rooms.find((room) => room.id === selected.roomId)?.number ?? "—"
            }
            received={activeReceiptsTotal(selected.id)}
          />
          {selected.audit && (
            <Alert type="info">Auditoria: {selected.audit}</Alert>
          )}
          <FormActions>
            <Btn variant="ghost" onClick={() => setReservationModal(null)}>
              Fechar
            </Btn>
          </FormActions>
        </Modal>
      )}
      {reservationModal === "cancel" && selected && (
        <Modal
          title="Cancelar Reserva"
          onClose={() => setReservationModal(null)}
        >
          <ReservationDetails
            reservation={selected}
            roomNumber={
              rooms.find((room) => room.id === selected.roomId)?.number ?? "—"
            }
            received={activeReceiptsTotal(selected.id)}
          />
          <Alert type="warning">A reserva será preservada no histórico.</Alert>
          <Textarea
            label="Motivo *"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
          <FormActions>
            <Btn variant="ghost" onClick={() => setReservationModal(null)}>
              Voltar
            </Btn>
            <Btn
              disabled={!cancelReason.trim()}
              onClick={() => {
                cancelReservation(selected.id, cancelReason)
                setReservationModal(null)
              }}
            >
              Confirmar Cancelamento
            </Btn>
          </FormActions>
        </Modal>
      )}
      {receiptModal === "new" && (
        <Modal
          title="Cadastrar Recebimento"
          onClose={() => setReceiptModal(null)}
        >
          <FormGrid cols={2}>
            <FullCol>
              <Select
                label="Reserva *"
                value={receiptForm.reservationId}
                onChange={(event) =>
                  setReceiptForm({
                    ...receiptForm,
                    reservationId: event.target.value,
                  })
                }
              >
                <option value="">Selecione</option>
                {reservations
                  .filter((item) => item.status !== "Cancelada")
                  .map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.code} — {reservation.guest}
                    </option>
                  ))}
              </Select>
            </FullCol>
            <FullCol>
              <Input
                label="Hóspede"
                value={receiptReservation?.guest ?? ""}
                readOnly
              />
            </FullCol>
            <Input
              label="Data *"
              type="date"
              value={receiptForm.date}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, date: event.target.value })
              }
            />
            <Input
              label="Valor *"
              type="number"
              min="0.01"
              step="0.01"
              value={receiptForm.value}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, value: event.target.value })
              }
            />
            <Select
              label="Forma *"
              value={receiptForm.method}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, method: event.target.value })
              }
            >
              <option>PIX</option>
              <option>Cartão de crédito</option>
              <option>Cartão de débito</option>
              <option>Dinheiro</option>
              <option>Transferência</option>
            </Select>
            <FullCol>
              <Textarea
                label="Observação"
                value={receiptForm.notes}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          <FormActions>
            <Btn variant="ghost" onClick={() => setReceiptModal(null)}>
              Cancelar
            </Btn>
            <Btn onClick={saveReceipt}>Confirmar Recebimento</Btn>
          </FormActions>
        </Modal>
      )}
      {receiptModal === "view" && selectedReceipt && (
        <Modal
          title={`Recebimento ${selectedReceipt.code}`}
          onClose={() => setReceiptModal(null)}
        >
          <div className="detail-list">
            <Summary
              label="Reserva"
              value={
                reservations.find(
                  (item) => item.id === selectedReceipt.reservationId,
                )?.code ?? "—"
              }
            />
            <Summary
              label="Data"
              value={formatDisplayDate(selectedReceipt.date)}
            />
            <Summary
              label="Valor"
              value={formatMoney(selectedReceipt.value)}
              strong
            />
            <Summary label="Forma" value={selectedReceipt.method} />
            <Summary label="Status" value={selectedReceipt.status} />
          </div>
          <FormActions>
            <Btn variant="ghost" onClick={() => setReceiptModal(null)}>
              Fechar
            </Btn>
          </FormActions>
        </Modal>
      )}
      {quickClientOpen && (
        <Modal
          title="Cadastro rápido de cliente"
          onClose={() => setQuickClientOpen(false)}
        >
          <FormGrid cols={2}>
            <FullCol>
              <Input
                label="Nome completo *"
                value={quickClient.name}
                onChange={(event) =>
                  setQuickClient({ ...quickClient, name: event.target.value })
                }
              />
            </FullCol>
            <Input
              label="CPF *"
              placeholder="000.000.000-00"
              value={quickClient.cpf}
              onChange={(event) =>
                setQuickClient({ ...quickClient, cpf: event.target.value })
              }
            />
            <Input
              label="Telefone"
              value={quickClient.phone}
              onChange={(event) =>
                setQuickClient({ ...quickClient, phone: event.target.value })
              }
            />
            <FullCol>
              <Input
                label="E-mail"
                type="email"
                value={quickClient.email}
                onChange={(event) =>
                  setQuickClient({ ...quickClient, email: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {quickClientError && <Alert type="error">{quickClientError}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setQuickClientOpen(false)}>
              Cancelar
            </Btn>
            <Btn onClick={saveQuickClient}>Cadastrar e selecionar</Btn>
          </FormActions>
        </Modal>
      )}
    </div>
  )
}

function Summary({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong className={strong ? "summary-strong" : ""}>{value}</strong>
    </div>
  )
}

function ReservationDetails({
  reservation,
  roomNumber,
  received,
}: {
  reservation: Reservation
  roomNumber: string
  received: number
}) {
  return (
    <div className="detail-list">
      <Summary label="Código" value={reservation.code} />
      <Summary label="Responsável" value={reservation.guest} />
      <Summary
        label="Acompanhantes"
        value={reservation.companions.join(", ") || "Nenhum"}
      />
      <Summary
        label="Período"
        value={`${formatDisplayDate(reservation.entry)} a ${formatDisplayDate(reservation.exit)}`}
      />
      <Summary label="Quarto" value={roomNumber} />
      <Summary
        label="Contratação"
        value={reservation.packageSnapshot?.name ?? reservation.contractType}
      />
      <Summary
        label="Benefícios"
        value={
          reservation.packageSnapshot?.benefits.join(", ") || "Não inclusos"
        }
      />
      <Summary
        label="Valor contratado"
        value={formatMoney(reservationBaseValue(reservation))}
        strong
      />
      <Summary label="Recebimentos" value={formatMoney(received)} />
      <Summary label="Status" value={reservation.status} />
    </div>
  )
}
