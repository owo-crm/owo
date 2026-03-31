export const availableSheetHeaders = [
  "Imię i nazwisko",
  "Telefon kontaktowy",
  "Adres e-mail",
  "Miasto",
  "Data wydarzenia",
  "Typ wydarzenia",
  "Wiadomość od leada",
  "Budżet",
  "Źródło reklamy",
];

export const mappingFields = [
  { key: "name", label: "Client name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "event_date", label: "Event date" },
  { key: "event_type", label: "Event type" },
  { key: "notes", label: "Notes / lead message" },
] as const;

export const suggestedMapping: Record<string, string> = {
  name: "Imię i nazwisko",
  phone: "Telefon kontaktowy",
  email: "Adres e-mail",
  city: "Miasto",
  event_date: "Data wydarzenia",
  event_type: "Typ wydarzenia",
  notes: "Wiadomość od leada",
};
