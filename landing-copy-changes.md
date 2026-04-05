# Landing — документация правок для pre-launch рекламы

**Контекст:**
- Аудитория 20–50 лет, преимущественно сфера услуг и ивент-бизнес
- Часть аудитории запускает рекламу (Meta, Google Ads, рекомендации — любой источник)
- Часть делегирует рекламу специалистам и не разбирается в деталях
- Часть вообще не использует рекламу и получает клиентов через сарафанное радио
- Задача лендинга: показать что OWO ускоряет внутренние операции — ответ клиенту,
  офферта, договор, ведение от заявки до закрытия — и собрать записи в early access
- Язык: польский (PL), EN как fallback
- CTA везде: "Zapisz się żeby uzyskać wcześniejszy dostęp"

---

## 1. `src/app/page.tsx` — порядок секций

**Проблема:** `AccessSection` и `UseCases` стоят перед `SurveySection`.
Холодный трафик видит много контента до формы и уходит.

**Изменение:**

```
// БЫЛО
<Hero />
<PainSection />
<SolutionSection />
<HowItWorks />
<AccessSection />
<UseCases />
<SurveySection />
<FinalCTA />

// СТАЛО
<Hero />
<PainSection />
<SolutionSection />
<HowItWorks />
<SurveySection />       ← поднять выше
<AccessSection />
<UseCases />
<FinalCTA />
```

---

## 2. `src/config/landing.ts` — все текстовые правки

### 2.1 `tagline`

```
// БЫЛО
"CRM для малого бизнеса"

// СТАЛО (PL)
"CRM dla małego biznesu · Wczesny dostęp"
```

---

### 2.2 `nav.cta`

```
// БЫЛО
"Начать бесплатно"

// СТАЛО (PL)
"Zapisz się na wcześniejszy dostęp"
```

---

### 2.3 `hero.title`

```
// БЫЛО
["Заявки — в CRM.", "Письма — сами.", "Клиенты — не теряются."]

// СТАЛО (PL)
["Zgłoszenie.", "Oferta. Umowa.", "Bez chaosu."]
```

Три строки показывают весь операционный путь клиента — от заявки до закрытия.
Это понятно любому владельцу бизнеса независимо от источника клиентов.

---

### 2.4 `hero.subtitle`

```
// БЫЛО
"OWO CRM собирает лидов из Google Sheets и форм на сайте, автоматически
отправляет письма и показывает воронку продаж в удобном интерфейсе.
Браузер или Telegram — как удобно."

// СТАЛО (PL)
"Klient się zgłasza — i zaczyna się chaos. Kto odpisuje? Kiedy wysłać ofertę?
Gdzie jest umowa? OWO CRM prowadzi klienta od pierwszego kontaktu do zamknięcia:
szybka odpowiedź, gotowa oferta, automatyczne wiadomości, wszystko w jednym miejscu."
```

Убраны упоминания Google Sheets, Meta, рекламы — фокус на операционном процессе
который узнают все: услуги, ивенты, рекомендации.

---

### 2.5 `hero.primaryCta`

```
// БЫЛО
"Начать бесплатно"

// СТАЛО (PL)
"Zapisz się żeby uzyskać wcześniejszy dostęp"
```

---

### 2.6 `hero.secondaryCta`

```
// БЫЛО
"Посмотреть как работает ↓"

// СТАЛО (PL)
"Jak to działa? ↓"
```

---

### 2.7 `hero.trustLine`

```
// БЫЛО
"Работает в браузере и как Telegram Mini App · Бесплатный пробный период"

// СТАЛО (PL)
"Działa w przeglądarce i na telefonie · Bezpłatny dostęp dla pierwszych uczestników"
```

Убрать "Telegram Mini App" — заменить на нейтральное "na telefonie".

---

### 2.8 `pain.title`

```
// БЫЛО
"Звучит знакомо?"

// СТАЛО (PL)
"Brzmi znajomo?"
```

---

### 2.9 `pain.cards` — три карточки

**Карточка 1:**
```
// БЫЛО
title: "Лиды теряются в таблице"
body:  "Google Sheet растёт, строки перемешиваются. Непонятно, кому нужно
        перезвонить, кто уже купил, а кто ждёт ответа вторую неделю."

// СТАЛО (PL)
title: "Zgłoszenia giną w chaosie"
body:  "Klient pisze — odpowiadasz za dwa dni. Albo zapominasz.
        Nie wiadomo kto jest na jakim etapie, kto czeka na ofertę,
        a kto już poszedł do konkurencji."
```

Убраны Google Sheet и таблицы — боль сформулирована через потерю клиента,
которую узнает любой владелец бизнеса.

---

**Карточка 2:**
```
// БЫЛО
title: "Письма отправляются вручную"
body:  "Каждый раз копипастить шаблон, подставлять имя, не забыть отправить.
        Это занимает время и всё равно что-то упускается."

// СТАЛО (PL)
title: "Oferta, maile, umowy — wszystko ręcznie"
body:  "Za każdym razem od nowa: kopiujesz tekst, wpisujesz dane klienta,
        wysyłasz. Albo zapominasz. To zabiera czas, który mógłbyś poświęcić
        na klientów."
```

---

**Карточка 3:**
```
// БУЛО
title: "Воронка непрозрачна"
body:  "Сколько заявок пришло в этом месяце? Сколько конвертировалось?
        Где теряются клиенты? Ответа нет — только ощущение что что-то не так."

// СТАЛО (PL)
title: "Nie wiesz gdzie tracisz klientów"
body:  "Ile zapytań przyszło w tym miesiącu? Ile zostało klientami?
        Na jakim etapie odpadają? Nie ma jednej odpowiedzi —
        tylko poczucie że coś gdzieś ucieka."
```

---

### 2.10 `solution.title`

```
// БЫЛО
"OWO CRM берёт рутину на себя"

// СТАЛО (PL)
"OWO CRM przejmuje rutynę. Ty zajmujesz się klientami."
```

---

### 2.11 `solution.subtitle`

```
// БЫЛО
"Подключи источники лидов, настрой автоответы — и занимайся делом, а не таблицами."

// СТАЛО (PL)
"Podłącz swoje źródło zgłoszeń, ustaw automatyczne wiadomości i szablony
— i zajmij się klientami, nie papierologią."
```

"Źródło zgłoszeń" — нейтральная формулировка, не привязанная к рекламе.

---

### 2.12 `solution.features` — три фичи

**Фича 1 (import):**
```
// БЫЛО
title: "Твой Google Sheet → живая CRM за 5 минут"
body:  "Вставь ссылку на таблицу, укажи какая колонка — это имя, телефон, email.
        OWO подтянет всех клиентов и будет синхронизировать изменения."
note:  "Поддержка любых вкладок и структур"

// СТАЛО (PL)
title: "Wszystkie zgłoszenia w jednym miejscu"
body:  "Formularz na stronie, polecenia, reklama, arkusz — skąd klient by nie przyszedł,
        trafia do jednej listy. Widzisz kto czeka, kto jest w toku, kto wymaga
        pilnej odpowiedzi."
note:  "Działa z każdym źródłem zgłoszeń"
```

Убраны Google Sheet и Meta как единственные источники — теперь любой источник.

---

**Фича 2 (email):**
```
// БЫЛО
title: "Письма уходят сами — в нужный момент"
body:  "Настрой триггеры: когда лид переходит в статус «Заявка принята» — клиент
        получает письмо. Когда сделка закрыта — получает подтверждение.
        Без участия менеджера."
note:  "Шаблоны с персонализацией"

// СТАЛО (PL)
title: "Oferta i potwierdzenie wysyłają się same"
body:  "Klient się zgłasza — dostaje automatyczne potwierdzenie.
        Przechodzi do kolejnego etapu — dostaje ofertę z jego danymi.
        Nie musisz nic robić ręcznie."
note:  "Szablony z danymi klienta"
```

Убрать "триггеры" — объяснить через конкретный сценарий.

---

**Фича 3 (sources):**
```
// БЫЛО
title: "Лиды из всех источников в одном месте"
body:  "Google Sheets, форма на твоём сайте, ручное добавление — все заявки
        попадают в единую воронку. Больше ничего не теряется."
note:  "Форма с сайта"
badge: "Скоро"

// СТАЛО (PL)
title: "Klient pod kontrolą od A do Z"
body:  "Od pierwszego kontaktu do podpisanej umowy — widzisz każdy krok.
        Notatki, historia wiadomości, zadania, dokumenty — wszystko przy kliencie,
        nic się nie gubi."
note:  "Pełna historia klienta"
badge: "Wkrótce"
```

---

### 2.13 `howItWorks.title`

```
// БЫЛО
"Три шага до работающей CRM"

// СТАЛО (PL)
"Trzy kroki i system działa"
```

---

### 2.14 `howItWorks.steps`

**Шаг 1:**
```
// БЫЛО
title: "Подключи Google Sheet"
body:  "Вставь ссылку. OWO читает заголовки колонок и предлагает готовый маппинг.
        Ты только подтверждаешь."

// СТАЛО (PL)
title: "Dodaj swoje zgłoszenia"
body:  "Wgraj listę klientów, podłącz formularz ze strony lub dodaj ręcznie.
        OWO rozpoznaje dane i od razu pokazuje wszystkich w jednym widoku."
```

Убраны Google Sheet и маппинг.

---

**Шаг 2:**
```
// БЫЛО
title: "Настрой воронку под себя"
body:  "Создай стадии: «Новый», «Переговоры», «Оплата», «Закрыт».
        Свои названия, свои цвета. Настрой автоматические письма для каждого этапа."

// СТАЛО (PL)
title: "Ustaw etapy swojego procesu"
body:  "Stwórz etapy które pasują do Twojego biznesu: Nowy, W kontakcie,
        Oferta wysłana, Zamknięty. Do każdego możesz dodać automatyczną
        wiadomość lub szablon dokumentu."
```

---

**Шаг 3:**
```
// БЫЛО
title: "Работай — система сделает остальное"
body:  "Добавляй лидов, двигай по воронке. Письма уходят сами.
        Команда видит общую картину. Ты видишь аналитику."

// СТАЛО (PL)
title: "Pracuj — system robi resztę"
body:  "Przesuwaj klientów przez etapy. Potwierdzenia i oferty wysyłają się same.
        Widzisz kto czeka na odpowiedź i ile zapytań zostało klientami."
```

---

### 2.15 `access.title`

```
// БЫЛО
"Работай там, где удобно"

// СТАЛО (PL)
"Działa tam, gdzie już jesteś"
```

---

### 2.16 `access.browser`

```
// БЫЛО
title: "Полная версия в браузере"
body:  "Все функции, удобный интерфейс, большой экран.
        Открываешь как обычный сайт — никакой установки."

// СТАЛО (PL)
title: "Pełna wersja w przeglądarce"
body:  "Otwierasz jak zwykłą stronę — bez instalowania czegokolwiek.
        Wszystkie funkcje, duży ekran, wygodny widok."
```

---

### 2.17 `access.telegram`

```
// БЫЛО
title: "Mini App в Telegram"
body:  "Для тех кто работает с телефона. Уведомления о новых лидах,
        быстрый ответ на задачи — прямо в Telegram."

// СТАЛО (PL)
title: "Wersja mobilna — Telegram lub WhatsApp"
body:  "Dla tych, którzy wolą telefon. Powiadomienia o nowych zgłoszeniach
        i szybki podgląd klientów — bez otwierania laptopa."
```

Убрать "Mini App", добавить WhatsApp — снижает барьер для тех кто не использует Telegram.

---

### 2.18 `useCases.title`

```
// БЫЛО
"Подходит для любого бизнеса с входящими заявками"

// СТАЛО (PL)
"Dla każdego, kto prowadzi klientów i chce robić to sprawniej"
```

Убрать привязку к "входящим заявкам из рекламы" — формулировка охватывает
рекомендации, сарафанное радио, любой источник.

---

### 2.19 `useCases.items`

```
// БЫЛО (RU)
"Агентства и консалтинг", "Фотографы и видеографы",
"Ивент-организаторы", "Салоны и мастера",
"Студии и тренеры", "Малый бизнес с продажами"

// СТАЛО (PL)
"Agencje eventowe", "Fotografowie i videografowie",
"Organizatorzy imprez", "Salony i specjaliści",
"Studia i trenerzy", "Małe firmy usługowe"
```

---

### 2.20 `finalCta.title`

```
// БЫЛО
"Готов перестать терять клиентов?"

// СТАЛО (PL)
"Pierwsze miejsca na wcześniejszy dostęp są otwarte"
```

---

### 2.21 `finalCta.subtitle`

```
// БЫЛО
"Подключи Google Sheet, и через 5 минут у тебя будет живая CRM
с автоматическими письмами."

// СТАЛО (PL)
"Zapisz się, zanim ruszymy. Pierwsi uczestnicy otrzymają dostęp za darmo
i pomogą nam dostosować system do ich procesu."
```

---

### 2.22 `finalCta.button`

```
// БЫЛО
"Начать бесплатно →"

// СТАЛО (PL)
"Zapisz się żeby uzyskać wcześniejszy dostęp →"
```

---

### 2.23 `finalCta.note`

```
// БЫЛО
"Браузер или Telegram · Бесплатный пробный период · Без кредитной карты"

// СТАЛО (PL)
"Przeglądarka lub telefon · Bezpłatny dostęp dla pierwszych · Bez karty kredytowej"
```

---

### 2.24 `footer.note`

```
// БЫЛО
"© 2025 OWO CRM"

// СТАЛО
"© 2026 OWO CRM"
```

---

## 3. `src/config/survey-i18n.ts` — тексты опроса

### 3.1 Заголовок

```
// БЫЛО (EN)
"Early access survey"

// СТАЛО (EN)
"Join the early access list"

// БЫЛО (PL)
"Ankieta early access"

// СТАЛО (PL)
"Dołącz do listy wcześniejszego dostępu"
```

---

### 3.2 Подзаголовок

```
// БЫЛО (EN)
"5 quick steps for early access qualification. It takes about 2 minutes."

// СТАЛО (EN)
"Two minutes — and you're on the list. We'll reach out before launch."

// БЫЛО (PL)
"5 krótkich kroków kwalifikacyjnych do early access. Zajmie to około 2 minut."

// СТАЛО (PL)
"Dwie minuty — i jesteś na liście. Odezwiemy się przed startem."
```

---

### 3.3 Сообщение после отправки — заголовок (PL)

```
// БЫЛО
"Dziekujemy, zapis zostal przyjety"

// СТАЛО
"Dziękujemy — jesteś na liście"
```

---

### 3.4 Сообщение после отправки — текст (PL)

```
// БЫЛО
"Twoje odpowiedzi zostały zapisane. Skontaktujemy się po weryfikacji."

// СТАЛО
"Zapisaliśmy Twoje zgłoszenie. Odezwiemy się przed startem z informacją o dostępie."
```

---

## 4. `src/components/landing/Hero.tsx` — структурная правка

### Pre-launch badge

Добавить между tagline (`<p className="mb-4 ...">`) и `<h1>`.

**Текст (PL):**
```
"Wkrótce startujemy — zapisz się pierwszy"
```

**Примерные классы:**
```
inline-flex items-center gap-2 rounded-full border border-[#6b7ff0]/35
bg-[#6b7ff0]/12 px-3 py-1 text-xs text-[#aeb9ff] mb-4
```

---

## 5. Чего не менять

- Визуальные компоненты (карточки лидов в Hero, иллюстрации в SolutionSection).
- Структуру survey-формы — 5 шагов с вопросами оставить, менять только заголовок и subtitle.
- Цветовую схему и анимации.
- `acquisitionChannel` в опросе — варианты источников оставить как есть.
