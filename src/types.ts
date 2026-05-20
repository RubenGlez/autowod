export type ButtonText =
  | 'Borrar'
  | 'Finalizada'
  | 'Cambiar'
  | 'Entrenar'
  | 'Avisar';

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type ReservationPreferences = Record<WeekDay, string | null>;

export type TerminalBookingStatus =
  | 'booked'
  | 'waitlisted'
  | 'finished'
  | 'different-time';

export type BookingState = Record<string, TerminalBookingStatus>;

export interface ReservationResult {
  success: boolean;
  message: string;
  weekDay: string;
  date?: string;
  time?: string;
  state?: ButtonText;
}
