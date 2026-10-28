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
} from "../ui"
import {
  formatMoney,
  today,
  useHotelOperations,
  type CleaningStatus,
  type MaintenanceStatus,
  type Room,
  type RoomCategory,
  type RoomStatus,
} from "../HotelOperationsContext"
import { useDemoEngine } from "../demo/DemoEngineContext"

type Tab = "painel" | "lista" | "categorias"
type RoomModal = "new" | "edit" | "view" | null
type CategoryModal = "new" | "edit" | "view" | null

const roomStatuses: RoomStatus[] = [
  "Livre",
  "Ocupado",
  "Em manutenção",
  "Reservado",
]
const emptyRoom = {
  number: "",
  floor: "1",
  category: "Standard",
  capacity: "2",
  status: "Livre" as RoomStatus,
  cleaningStatus: "Limpo" as CleaningStatus,
  maintenanceStatus: "Disponível" as MaintenanceStatus,
  rate: "250",
  notes: "",
  accessibility: false,
  view: "",
  bedType: "Casal",
  balcony: false,
  minibar: true,
  airConditioning: true,
}
const emptyCategory = {
  name: "",
  description: "",
  capacity: "2",
  rate: "",
  notes: "",
}
const mockRoom = {
  number: "309",
  floor: "3",
  category: "Luxo",
  capacity: "2",
  status: "Livre" as RoomStatus,
  cleaningStatus: "Limpo" as CleaningStatus,
  maintenanceStatus: "Disponível" as MaintenanceStatus,
  rate: "420",
  notes: "Quarto preparado para demonstração, com vista frontal.",
  accessibility: false,
  view: "Jardim",
  bedType: "Queen",
  balcony: true,
  minibar: true,
  airConditioning: true,
}
const mockCategory = {
  name: "Executivo Demo",
  description:
    "Categoria exemplo para apresentação, com mesa de trabalho e café incluso.",
  capacity: "2",
  rate: "390",
  notes: "Usada somente para demonstração do cadastro.",
}

export default function Quartos() {
  const {
    rooms,
    setRooms,
    categories,
    setCategories,
    reservations,
    setReservations,
  } = useHotelOperations()
  const [tab, setTab] = useState<Tab>("painel")
  const [roomModal, setRoomModal] = useState<RoomModal>(null)
  const [categoryModal, setCategoryModal] = useState<CategoryModal>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(
    null,
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [page, setPage] = useState(1)
  const [roomForm, setRoomForm] = useState(emptyRoom)
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const demo = useDemoEngine()

  useEffect(() => {
    const command = demo.activeCommand
    if (
      !command ||
      command.target !== "quartos" ||
      command.command !== "inspect-room"
    )
      return
    const room = rooms.find((item) => item.id === demo.scenario?.ids.roomId)
    if (!room) {
      demo.resolveCommand(command.id, {
        status: "error",
        message: "Quarto elegível do cenário não encontrado.",
      })
      return
    }
    setTab("lista")
    setSearch(room.number)
    setStatusFilter("")
    setCategoryFilter("")
    setSelectedRoom(room)
    setRoomModal("view")
    demo.resolveCommand(command.id, {
      status: "running",
      message: `Consulta do quarto ${room.number} aberta para conferir ocupação, limpeza e manutenção.`,
    })
  }, [demo.activeCommand])

  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          (!search || room.number.includes(search)) &&
          (!statusFilter || room.status === statusFilter) &&
          (!categoryFilter || room.category === categoryFilter),
      ),
    [rooms, search, statusFilter, categoryFilter],
  )
  const paginatedRooms = filteredRooms.slice((page - 1) * 20, page * 20)
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / 20))

  const openNewRoom = () => {
    setSelectedRoom(null)
    setRoomForm(mockRoom)
    setRoomModal("new")
  }
  const openEditRoom = (room: Room) => {
    setSelectedRoom(room)
    setRoomForm({
      number: room.number,
      floor: room.floor,
      category: room.category,
      capacity: String(room.capacity),
      status: room.status,
      cleaningStatus: room.cleaningStatus,
      maintenanceStatus: room.maintenanceStatus,
      rate: String(room.rate),
      notes: room.notes,
      accessibility: room.accessibility,
      view: room.view,
      bedType: room.bedType,
      balcony: room.balcony,
      minibar: room.minibar,
      airConditioning: room.airConditioning,
    })
    setRoomModal("edit")
  }

  const saveRoom = () => {
    if (
      !roomForm.number ||
      !roomForm.floor ||
      !roomForm.category ||
      !roomForm.capacity
    )
      return
    const operationalStatus: RoomStatus =
      roomForm.maintenanceStatus === "Bloqueado"
        ? "Em manutenção"
        : selectedRoom?.occupancyStatus === "Ocupado"
          ? "Ocupado"
          : "Livre"
    const roomData = {
      number: roomForm.number,
      floor: roomForm.floor,
      category: roomForm.category,
      capacity: Number(roomForm.capacity),
      status: operationalStatus,
      cleaningStatus: roomForm.cleaningStatus,
      maintenanceStatus: roomForm.maintenanceStatus,
      rate: Number(roomForm.rate),
      notes: roomForm.notes,
      accessibility: roomForm.accessibility,
      view: roomForm.view,
      bedType: roomForm.bedType,
      balcony: roomForm.balcony,
      minibar: roomForm.minibar,
      airConditioning: roomForm.airConditioning,
    }
    if (roomModal === "new")
      setRooms((current) => [
        ...current,
        {
          id: Math.max(0, ...current.map((item) => item.id)) + 1,
          occupancyStatus: "Livre",
          ...roomData,
        },
      ])
    if (roomModal === "edit" && selectedRoom)
      setRooms((current) =>
        current.map((item) =>
          item.id === selectedRoom.id ? { ...item, ...roomData } : item,
        ),
      )
    setRoomModal(null)
  }

  const openCategory = (category: RoomCategory, mode: CategoryModal) => {
    setSelectedCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description,
      capacity: String(category.capacity),
      rate: String(category.rate),
      notes: category.notes,
    })
    setCategoryModal(mode)
  }

  const saveCategory = () => {
    if (!categoryForm.name || !categoryForm.capacity || !categoryForm.rate)
      return
    const data = {
      name: categoryForm.name,
      description: categoryForm.description,
      capacity: Number(categoryForm.capacity),
      rate: Number(categoryForm.rate),
      notes: categoryForm.notes,
    }
    if (categoryModal === "new")
      setCategories((current) => [
        ...current,
        { id: Math.max(...current.map((item) => item.id)) + 1, ...data },
      ])
    if (categoryModal === "edit" && selectedCategory) {
      setCategories((current) =>
        current.map((item) =>
          item.id === selectedCategory.id ? { ...item, ...data } : item,
        ),
      )
      setRooms((current) =>
        current.map((room) =>
          room.category === selectedCategory.name
            ? { ...room, category: data.name }
            : room,
        ),
      )
      setReservations((current) =>
        current.map((reservation) =>
          reservation.category === selectedCategory.name
            ? { ...reservation, category: data.name }
            : reservation,
        ),
      )
    }
    setCategoryModal(null)
  }

  const roomStatusStyle: Record<RoomStatus, {
    background: string
    border: string
  }> = {
    Livre: { background: "var(--ok-bg)", border: "var(--ok-fg)" },
    Ocupado: { background: "var(--info-bg)", border: "var(--info-fg)" },
    "Em manutenção": { background: "var(--warn-bg)", border: "var(--warn-fg)" },
    Reservado: {
      background: "var(--reserved-bg)",
      border: "var(--reserved-fg)",
    },
  }

  const nextReservationFor = (room: Room) =>
    reservations
      .filter(
        (reservation) =>
          reservation.roomId === room.id &&
          reservation.entry >= today() &&
          ["Pendente", "Confirmada"].includes(reservation.status),
      )
      .sort((first, second) => first.entry.localeCompare(second.entry))[0]

  return (
    <div className="ops-page">
      <PageHeader
        title="Quartos"
        actions={
          tab === "categorias" ? (
            <Btn
              onClick={() => {
                setSelectedCategory(null)
                setCategoryForm(mockCategory)
                setCategoryModal("new")
              }}
            >
              + Nova Categoria
            </Btn>
          ) : (
            <Btn onClick={openNewRoom}>+ Cadastrar Quarto</Btn>
          )
        }
      />
      <Tabs
        tabs={[
          { id: "painel", label: "Painel visual" },
          { id: "lista", label: "Consulta de quartos" },
          { id: "categorias", label: "Categorias de Quarto" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "painel" && (
        <Card>
          <SectionTitle>Mapa de quartos</SectionTitle>
          <div className="status-legend">
            {roomStatuses.map((status) => (
              <span key={status}>
                <i style={{ background: roomStatusStyle[status].border }} />
                {status}
              </span>
            ))}
          </div>
          <div className="room-grid">
            {rooms.map((room) => (
              <button
                key={room.id}
                className="room-tile"
                onClick={() => {
                  setSelectedRoom(room)
                  setRoomModal("view")
                }}
                style={{
                  background: roomStatusStyle[room.status].background,
                  border: `1px solid ${roomStatusStyle[room.status].border}`,
                }}
              >
                <strong>{room.number}</strong>
                <span>{room.category}</span>
                <Badge label={room.occupancyStatus} />
                <span>
                  {room.cleaningStatus} · {room.maintenanceStatus}
                </span>
                <span>
                  {nextReservationFor(room)
                    ? `Próxima: ${nextReservationFor(room)?.entry}`
                    : "Sem próxima reserva"}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {tab === "lista" && (
        <Card>
          <div className="ops-filters">
            <div className="ops-filter-search">
              <Input
                label="Buscar por número"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Ex.: 205"
              />
            </div>
            <div className="ops-filter">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Todos</option>
                {roomStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </div>
            <div className="ops-filter">
              <Select
                label="Categoria"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id}>{category.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <Table
            headers={[
              "Número",
              "Categoria",
              "Ocupação",
              "Limpeza",
              "Manutenção",
              "Próxima reserva",
              "Tarifa",
              "Ações",
            ]}
            rows={paginatedRooms.map((room) => [
              room.number,
              room.category,
              <Badge label={room.occupancyStatus} />,
              <Badge label={room.cleaningStatus} />,
              <Badge label={room.maintenanceStatus} />,
              nextReservationFor(room)?.entry ?? "—",
              formatMoney(room.rate),
              <div className="table-actions">
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelectedRoom(room)
                    setRoomModal("view")
                  }}
                >
                  Consultar
                </Btn>
                <Btn
                  small
                  variant="secondary"
                  onClick={() => openEditRoom(room)}
                >
                  Atualizar
                </Btn>
                <Btn
                  small
                  variant="danger"
                  disabled={
                    room.occupancyStatus === "Ocupado" ||
                    reservations.some(
                      (reservation) =>
                        reservation.roomId === room.id &&
                        !["Cancelada", "Concluída"].includes(
                          reservation.status,
                        ),
                    )
                  }
                  onClick={() =>
                    setRooms((current) =>
                      current.filter((item) => item.id !== room.id),
                    )
                  }
                >
                  Excluir
                </Btn>
              </div>,
            ])}
          />
          <div className="pagination">
            <span>
              {filteredRooms.length === 0
                ? "0"
                : `${(page - 1) * 20 + 1}–${Math.min(page * 20, filteredRooms.length)}`}{" "}
              de {filteredRooms.length} quartos
            </span>
            <div>
              <Btn
                small
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Btn>
              <Btn
                small
                variant="ghost"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {tab === "categorias" && (
        <Card>
          <Table
            headers={[
              "Nome",
              "Descrição",
              "Capacidade padrão",
              "Tarifa padrão",
              "Quartos vinculados",
              "Ações",
            ]}
            rows={categories.map((category) => {
              const linked = rooms.filter(
                (room) => room.category === category.name,
              ).length
              return [
                category.name,
                category.description,
                `${category.capacity} hóspedes`,
                formatMoney(category.rate),
                String(linked),
                <div className="table-actions">
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => openCategory(category, "view")}
                  >
                    Consultar
                  </Btn>
                  <Btn
                    small
                    variant="secondary"
                    onClick={() => openCategory(category, "edit")}
                  >
                    Atualizar
                  </Btn>
                  <Btn
                    small
                    variant="danger"
                    disabled={linked > 0}
                    onClick={() =>
                      setCategories((current) =>
                        current.filter((item) => item.id !== category.id),
                      )
                    }
                  >
                    Excluir
                  </Btn>
                </div>,
              ]
            })}
          />
          <Alert type="info">
            Categorias com quartos vinculados não podem ser excluídas.
          </Alert>
        </Card>
      )}

      {(roomModal === "new" || roomModal === "edit") && (
        <Modal
          wide
          title={
            roomModal === "new"
              ? "Cadastrar Quarto"
              : `Atualizar Quarto ${selectedRoom?.number}`
          }
          onClose={() => setRoomModal(null)}
          footer={
            <>
              <FormActions>
                <Btn variant="ghost" onClick={() => setRoomModal(null)}>
                  Cancelar
                </Btn>
                <Btn
                  disabled={
                    !roomForm.number ||
                    !roomForm.floor ||
                    !roomForm.category ||
                    !roomForm.capacity
                  }
                  onClick={saveRoom}
                >
                  {roomModal === "new" ? "Salvar" : "Atualizar"}
                </Btn>
              </FormActions>
            </>
          }
          intent="create"
          size="lg"
          description="Informe a identificação, a categoria e as características da acomodação."
        >
          <SectionTitle>Dados do quarto</SectionTitle>
          <FormGrid cols={2}>
            <Input
              label="Número *"
              value={roomForm.number}
              onChange={(event) =>
                setRoomForm({ ...roomForm, number: event.target.value })
              }
            />
            <Input
              label="Andar *"
              value={roomForm.floor}
              onChange={(event) =>
                setRoomForm({ ...roomForm, floor: event.target.value })
              }
            />
            <Select
              label="Categoria *"
              value={roomForm.category}
              onChange={(event) => {
                const category = categories.find(
                  (item) => item.name === event.target.value,
                )
                setRoomForm({
                  ...roomForm,
                  category: event.target.value,
                  capacity: String(category?.capacity ?? roomForm.capacity),
                  rate: String(category?.rate ?? roomForm.rate),
                })
              }}
            >
              {categories.map((category) => (
                <option key={category.id}>{category.name}</option>
              ))}
            </Select>
            <Input
              label="Capacidade *"
              type="number"
              min="1"
              value={roomForm.capacity}
              onChange={(event) =>
                setRoomForm({ ...roomForm, capacity: event.target.value })
              }
            />
            <Select
              label="Limpeza *"
              value={roomForm.cleaningStatus}
              onChange={(event) =>
                setRoomForm({
                  ...roomForm,
                  cleaningStatus: event.target.value as CleaningStatus,
                })
              }
            >
              <option>Limpo</option>
              <option>Sujo</option>
              <option>Em limpeza</option>
            </Select>
            <Select
              label="Manutenção *"
              value={roomForm.maintenanceStatus}
              onChange={(event) =>
                setRoomForm({
                  ...roomForm,
                  maintenanceStatus: event.target.value as MaintenanceStatus,
                })
              }
            >
              <option>Disponível</option>
              <option>Bloqueado</option>
            </Select>
            <Input
              label="Tarifa"
              type="number"
              min="0"
              step="0.01"
              value={roomForm.rate}
              onChange={(event) =>
                setRoomForm({ ...roomForm, rate: event.target.value })
              }
              currency
            />
            <FullCol>
              <Textarea
                label="Observações"
                value={roomForm.notes}
                onChange={(event) =>
                  setRoomForm({ ...roomForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {roomModal === "edit" &&
            (selectedRoom?.status === "Ocupado" ||
              selectedRoom?.status === "Reservado") && (
              <p className="inline-state">
                O status atual é controlado pela reserva ou hospedagem ativa.
                Alterações manuais são restritas à Recepção e Governança.
              </p>
            )}
          <SectionTitle>Características adicionais</SectionTitle>
          <FormGrid cols={3}>
            <Input
              label="Vista"
              value={roomForm.view}
              onChange={(event) =>
                setRoomForm({ ...roomForm, view: event.target.value })
              }
            />
            <Select
              label="Tipo de cama"
              value={roomForm.bedType}
              onChange={(event) =>
                setRoomForm({ ...roomForm, bedType: event.target.value })
              }
            >
              <option>Solteiro</option>
              <option>Casal</option>
              <option>Queen</option>
              <option>King</option>
            </Select>
            <Check
              label="Acessibilidade"
              checked={roomForm.accessibility}
              onChange={(checked) =>
                setRoomForm({ ...roomForm, accessibility: checked })
              }
            />
            <Check
              label="Varanda"
              checked={roomForm.balcony}
              onChange={(checked) =>
                setRoomForm({ ...roomForm, balcony: checked })
              }
            />
            <Check
              label="Frigobar"
              checked={roomForm.minibar}
              onChange={(checked) =>
                setRoomForm({ ...roomForm, minibar: checked })
              }
            />
            <Check
              label="Ar-condicionado"
              checked={roomForm.airConditioning}
              onChange={(checked) =>
                setRoomForm({ ...roomForm, airConditioning: checked })
              }
            />
          </FormGrid>
        </Modal>
      )}

      {roomModal === "view" && selectedRoom && (
        <Modal
          title={`Quarto ${selectedRoom.number}`}
          onClose={() => setRoomModal(null)}
        >
          <div className="detail-list">
            <Detail label="Número" value={selectedRoom.number} />
            <Detail label="Andar" value={selectedRoom.floor} />
            <Detail label="Categoria" value={selectedRoom.category} />
            <Detail
              label="Capacidade"
              value={`${selectedRoom.capacity} hóspedes`}
            />
            <Detail label="Ocupação" value={selectedRoom.occupancyStatus} />
            <Detail label="Limpeza" value={selectedRoom.cleaningStatus} />
            <Detail label="Manutenção" value={selectedRoom.maintenanceStatus} />
            <Detail
              label="Próxima reserva"
              value={nextReservationFor(selectedRoom)?.entry ?? "Nenhuma"}
            />
            <Detail label="Tarifa" value={formatMoney(selectedRoom.rate)} />
            <Detail
              label="Características"
              value={[
                selectedRoom.accessibility && "Acessível",
                selectedRoom.view && `Vista ${selectedRoom.view}`,
                selectedRoom.bedType,
                selectedRoom.balcony && "Varanda",
                selectedRoom.minibar && "Frigobar",
                selectedRoom.airConditioning && "Ar-condicionado",
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <Detail label="Observações" value={selectedRoom.notes || "—"} />
          </div>
          <FormActions>
            <Btn variant="ghost" onClick={() => setRoomModal(null)}>
              Fechar
            </Btn>
            <Btn variant="secondary" onClick={() => openEditRoom(selectedRoom)}>
              Atualizar
            </Btn>
          </FormActions>
        </Modal>
      )}

      {(categoryModal === "new" || categoryModal === "edit") && (
        <Modal
          title={
            categoryModal === "new"
              ? "Cadastrar Categoria de Quarto"
              : "Atualizar Categoria de Quarto"
          }
          onClose={() => setCategoryModal(null)}
          footer={
            <>
              <FormActions>
                <Btn variant="ghost" onClick={() => setCategoryModal(null)}>
                  Cancelar
                </Btn>
                <Btn
                  disabled={
                    !categoryForm.name ||
                    !categoryForm.capacity ||
                    !categoryForm.rate
                  }
                  onClick={saveCategory}
                >
                  {categoryModal === "new" ? "Salvar" : "Atualizar"}
                </Btn>
              </FormActions>
            </>
          }
          intent="create"
          size="md"
          description="Defina a capacidade e a tarifa padrão da categoria."
        >
          <FormGrid cols={2}>
            <FullCol>
              <Input
                label="Nome *"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, name: event.target.value })
                }
              />
            </FullCol>
            <FullCol>
              <Textarea
                label="Descrição"
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: event.target.value,
                  })
                }
              />
            </FullCol>
            <Input
              label="Capacidade padrão *"
              type="number"
              min="1"
              value={categoryForm.capacity}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  capacity: event.target.value,
                })
              }
            />
            <Input
              label="Tarifa padrão *"
              type="number"
              min="0"
              step="0.01"
              value={categoryForm.rate}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, rate: event.target.value })
              }
              currency
            />
            <FullCol>
              <Textarea
                label="Observações"
                value={categoryForm.notes}
                onChange={(event) =>
                  setCategoryForm({
                    ...categoryForm,
                    notes: event.target.value,
                  })
                }
              />
            </FullCol>
          </FormGrid>
        </Modal>
      )}

      {categoryModal === "view" && selectedCategory && (
        <Modal
          title={selectedCategory.name}
          onClose={() => setCategoryModal(null)}
        >
          <div className="detail-list">
            <Detail label="Descrição" value={selectedCategory.description} />
            <Detail
              label="Capacidade padrão"
              value={`${selectedCategory.capacity} hóspedes`}
            />
            <Detail
              label="Tarifa padrão"
              value={formatMoney(selectedCategory.rate)}
            />
            <Detail label="Observações" value={selectedCategory.notes || "—"} />
          </div>
          {rooms.some((room) => room.category === selectedCategory.name) && (
            <Alert type="warning">
              Não é possível excluir esta categoria porque existem quartos
              vinculados.
            </Alert>
          )}
          <FormActions>
            <Btn variant="ghost" onClick={() => setCategoryModal(null)}>
              Fechar
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => openCategory(selectedCategory, "edit")}
            >
              Atualizar
            </Btn>
          </FormActions>
        </Modal>
      )}
    </div>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="check-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  )
}
