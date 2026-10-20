export type StayConflictReservation = {
  id: number;
  roomId: number;
  entry: string;
  exit: string;
  status: string;
};

export function hasRemainingStayRoomConflict(input: {
  reservationId: number;
  roomId: number;
  remainingFrom: string;
  expectedExit: string;
  reservations: StayConflictReservation[];
}) {
  return input.reservations.some((reservation) =>
    reservation.id !== input.reservationId &&
    reservation.roomId === input.roomId &&
    ["Confirmada", "Hospedado"].includes(reservation.status) &&
    input.remainingFrom < reservation.exit && input.expectedExit > reservation.entry,
  );
}

export function stayNavigationEvent(stayId: number) {
  return { name: "hotel:open-stay", stayId } as const;
}
