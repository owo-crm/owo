export type AdminUser = {
  id: string;
  name: string;
  telegramId: string;
  username: string;
  language: string;
  businesses: number;
  status: "active" | "watch";
  joinedAt: string;
};

export const adminUsers: AdminUser[] = [
  {
    id: "u1",
    name: "Adrian Kowalski",
    telegramId: "123456789",
    username: "@adrianbarowo",
    language: "PL",
    businesses: 3,
    status: "active",
    joinedAt: "24 Mar 2026",
  },
  {
    id: "u2",
    name: "Kasia Nowak",
    telegramId: "991245771",
    username: "@kasia.crm",
    language: "EN",
    businesses: 1,
    status: "active",
    joinedAt: "23 Mar 2026",
  },
  {
    id: "u3",
    name: "Marek Test",
    telegramId: "551100880",
    username: "@marek_test",
    language: "PL",
    businesses: 0,
    status: "watch",
    joinedAt: "22 Mar 2026",
  }
];
