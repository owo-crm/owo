# Barowo CRM — Полная UI/UX Спецификация для Codex

> Этот документ описывает каждый экран, каждый попап, каждую кнопку и каждый элемент интерфейса.
> Читается как единственный источник истины по визуальному устройству приложения.
> Приложение работает внутри Telegram Mini App. Главный экран — телефон. Десктоп — вторичен.

---

## ЧАСТЬ 0. ДИЗАЙН-СИСТЕМА

### 0.1 Цветовая палитра

```
--bg:           #0f0f12   /* фон всего приложения — глубокий антрацит */
--surface:      #1c1c21   /* карточки, попапы, панели — темный сланец */
--surface-2:    #26262d   /* вторичные элементы поверх surface — чуть светлее */
--surface-3:    #2e2e37   /* hover-состояния, input focus bg */
--accent:       #a855f7   /* фиолетовый/аметист — главный акцент */
--accent-dim:   #7c3aed   /* более темный фиолетовый для pressed-состояний */
--accent-glow:  rgba(168, 85, 247, 0.15)  /* свечение вокруг accent-элементов */
--accent-border: rgba(168, 85, 247, 0.35) /* полупрозрачная рамка accent */
--text-primary: #ffffff   /* имена, заголовки, важные цифры */
--text-secondary: #a1a1aa /* подписи, метки, второстепенная инфа */
--text-muted:   #52525b   /* плейсхолдеры, отключенные элементы */
--border:       rgba(255,255,255,0.07)  /* тонкие разделители */
--border-strong: rgba(255,255,255,0.12) /* рамки карточек и инпутов */
--danger:       #ef4444   /* красный для delete и ошибок */
--danger-dim:   rgba(239,68,68,0.15)   /* bg для danger-зоны */
--success:      #22c55e   /* зеленый для won/success */
--success-dim:  rgba(34,197,94,0.15)
--warning:      #f59e0b   /* желтый для pending/warning */
--warning-dim:  rgba(245,158,11,0.15)
```

### 0.2 Типографика

Шрифт единый — **Inter** (переменный, подключить через Google Fonts или локально).
Никаких засечек, никакого monospace в UI-тексте.

```
Заголовок экрана (Tab title):    font-size: 18px, font-weight: 700, color: --text-primary
Заголовок карточки (card title): font-size: 15px, font-weight: 600, color: --text-primary
Основной текст:                  font-size: 14px, font-weight: 400, color: --text-primary
Подпись / label:                 font-size: 12px, font-weight: 400, color: --text-secondary
Метка / badge:                   font-size: 11px, font-weight: 600, letter-spacing: 0.03em
Кнопка primary:                  font-size: 15px, font-weight: 600
Кнопка secondary/ghost:          font-size: 14px, font-weight: 500
Input текст:                     font-size: 15px, font-weight: 400
Placeholder:                     font-size: 15px, color: --text-muted
```

### 0.3 Отступы и геометрия

```
Боковые паддинги экрана:         16px слева и справа
Вертикальный отступ между секциями: 12px
Внутренний паддинг карточки:     14px 16px
Скругление карточки:             12px
Скругление кнопок:               10px
Скругление badge:                20px (pill)
Скругление инпутов:              10px
Высота строки в списке лида:     68-72px (удобно нажимать пальцем)
Высота Tab Bar:                  60px (+ safe area iOS снизу)
Высота Top Bar:                  56px
Высота primary кнопки:           50px
Высота secondary кнопки:         44px
Высота инпута:                   48px
Минимальная tap-зона:            44×44px (Apple HIG)
```

### 0.4 Тени и эффекты

```
Карточка:       box-shadow: 0 1px 3px rgba(0,0,0,0.4)
Попап:          box-shadow: 0 20px 60px rgba(0,0,0,0.6)
Accent кнопка:  box-shadow: 0 0 20px rgba(168,85,247,0.3)
Accent кнопка (hover): box-shadow: 0 0 30px rgba(168,85,247,0.45)
FAB:            box-shadow: 0 4px 20px rgba(168,85,247,0.45)
```

### 0.5 Анимации

```
Попапы:         translateY(100%) → translateY(0), ease-out, 260ms
Исчезновение:   opacity 0→1 + translateY(8px)→0, 180ms ease-out
Кнопка tap:     scale(0.97), 100ms
Tab switch:     мгновенно, без анимации (быстро = главное в телефоне)
Badge:          никаких анимаций, статичны
Loading:        пульсирующие skeleton-плашки цвета --surface-2
```

### 0.6 Общий принцип layout для телефона

- Контент начинается сразу под Top Bar (56px).
- Контент заканчивается над Tab Bar (60px + safe area).
- Прокручиваемая зона = экран минус Top Bar минус Tab Bar.
- FAB (кнопка "+") всегда в правом нижнем углу: right: 16px, bottom: 76px (над Tab Bar).
- Попапы — полноэкранные bottom sheets с drag-handle сверху. Никаких центрированных модальных окон.
- Алерты подтверждения — единственное исключение: centered modal, 80% ширины экрана, скруглен на 16px.

---

## ЧАСТЬ 1. TOP BAR (Верхняя панель)

Фиксированная панель высотой 56px. Фон: --bg (полупрозрачный с backdrop-filter: blur(12px) если прокрутка началась, иначе solid --bg).

### Структура Top Bar

```
[ Business Switcher ← 40% ширины ]  [ иконки справа → ]
```

**Слева:**
- Компонент Business Switcher
- Кнопка — не просто текст, а chip-элемент:
  - Высота: 32px
  - Bg: --surface
  - Border: 1px solid --border-strong
  - Border-radius: 8px
  - Padding: 0 10px 0 12px
  - Внутри: иконка building (14px, --text-secondary) + название бизнеса (13px, font-weight: 600, --text-primary, truncate до 18 символов) + chevron-down (12px, --text-muted)
  - Нажатие → попап выбора бизнеса (см. ниже)

**Справа (иконки, каждая 40×40px tap-зона, иконка 20px):**
- Иконка уведомлений (bell) — если есть непрочитанные, красная точка 8px в правом верхнем углу иконки
- Иконка профиля (circle с аватаром или инициалами) — цвет circle: --accent, текст белый 12px

---

## ЧАСТЬ 2. TAB BAR (Нижняя навигация)

Фиксированная панель высотой 60px + bottom safe area iOS.
Фон: --surface, border-top: 1px solid --border.
Содержит 5 табов (или 4, зависит от business mode).

### Табы

```
[Leads] [Tasks] [Dashboard] [Team] [Settings]
```

Каждый таб:
- Ширина: 20% от экрана (или равные части)
- Вертикальная компоновка: иконка сверху (22px) + подпись снизу (10px, font-weight: 500)
- Неактивный: иконка и подпись цвет --text-muted
- Активный: иконка и подпись цвет --accent, под иконкой точка 4px цвета --accent
- Tap-анимация: легкий scale(0.92) на 80ms

Иконки (использовать lucide-react или phosphor):
- Leads: `users` или `user-circle`
- Tasks: `check-square`
- Dashboard: `bar-chart-2`
- Team: `users-three` или `people`
- Settings: `settings` или `sliders`

---

## ЧАСТЬ 3. ВКЛАДКА LEADS

### 3.1 Заголовочная секция

Под Top Bar, внутри прокручиваемой зоны — **не фиксированная** (прокручивается вместе с содержимым):

```
Leads                                    [ + New ]
3 active · 2 won this month
```

- "Leads" — 20px, font-weight: 700, --text-primary
- Подзаголовок — 13px, --text-secondary
- Кнопка "+ New": высота 34px, bg: --accent, border-radius: 8px, padding: 0 14px, font-size: 13px, font-weight: 600, белый текст. Нет иконки, только текст. Размещена в правом углу той же строки.

### 3.2 Строка поиска

Сразу под заголовком, margin-top: 12px:

```
🔍  Search by name, phone, email...
```

- Высота: 44px
- Bg: --surface
- Border: 1px solid --border-strong
- Border-radius: 10px
- Padding: 0 14px
- Иконка поиска: 16px, --text-muted, слева
- Placeholder: --text-muted, 14px
- При фокусе: border-color меняется на --accent-border, bg: --surface-3
- Кнопка очистки (X): появляется справа только когда есть текст, иконка 16px, --text-muted

### 3.3 Строка фильтров

Горизонтальный скролл (overflow-x: auto, без скроллбара), margin-top: 10px:

```
[ All ] [ New ] [ Follow-up ] [ Won ] [ Lost ] [ +Filters ]
```

Каждый фильтр-чип:
- Высота: 32px
- Border-radius: 20px (pill)
- Padding: 0 14px
- Font-size: 13px, font-weight: 500
- Неактивный: bg: --surface, border: 1px solid --border-strong, цвет --text-secondary
- Активный: bg: --accent-glow, border: 1px solid --accent-border, цвет --accent, font-weight: 600
- Чипы кастомных стадий имеют левую цветную точку 6px того же цвета стадии
- "+ Filters" — последний чип с иконкой filter 12px слева, открывает Filter Bottom Sheet

### 3.4 Карточка лида в списке

Каждая строка — это карточка:
- Bg: --surface
- Border-radius: 12px
- Padding: 12px 14px
- Margin: 0 0 8px 0 (отступ между карточками)
- Border: 1px solid --border

**Верхняя строка карточки:**
```
[Avatar 36px] Имя Фамилия                 [Status Badge]
               📞 +48 123 456 789
               📅 12 Apr · Wedding
```

- Аватар: круг 36px, bg градиент на основе первой буквы имени (не random, детерминированный), белая буква 15px bold. Расположен слева, vertically centered к первым двум строкам.
- Имя: 15px, font-weight: 600, --text-primary
- Телефон: 13px, --text-secondary, иконка 12px
- Дата + тип: 13px, --text-secondary, иконка 12px
- Status Badge: правый верхний угол карточки. Pill 24px высотой, padding 0 10px, font-size: 11px, font-weight: 600. Цвет bg и текст берется из настроек стадии бизнеса. Если стадия is_won — зеленый, is_lost — красный, иначе — кастомный цвет с 20% opacity bg.

**Нижняя строка карточки** (если есть assignee или задачи):
```
          👤 Alex K.        📋 2 tasks
```
- 12px, --text-muted, иконки 12px
- Разделены · между собой

**Жест свайп вправо на карточке:**
- Открывается зеленая зона с иконкой ✓ (mark as called)
- **Жест свайп влево:** красная зона с иконкой 🗑️ (delete) — только для admin/owner

**Нажатие на карточку:** открывает Lead Detail Bottom Sheet.

### 3.5 FAB кнопка

- Позиция: fixed, right: 16px, bottom: 76px
- Размер: 56×56px, border-radius: 16px
- Bg: --accent
- Иконка: + (24px, белый)
- Box-shadow: 0 4px 20px rgba(168,85,247,0.45)
- Нажатие → Create Lead Bottom Sheet

### 3.6 Пустое состояние

Когда нет лидов или нет результатов поиска:
```
        [иконка users, 48px, --text-muted]
        
        No leads yet
        Import from Google Sheet or add manually
        
        [ Connect Sheet ]    [ Add Manually ]
```
- Центрировано вертикально в доступной зоне
- Заголовок: 16px, font-weight: 600, --text-primary
- Подпись: 14px, --text-secondary
- Две кнопки рядом: высота 40px, одна accent, другая ghost

---

## ЧАСТЬ 4. LEAD DETAIL BOTTOM SHEET

Открывается снизу на весь экран (или почти — оставляет 40px сверху видного фона).

### 4.1 Header Bottom Sheet

Сверху: drag handle (36×4px, --surface-3, border-radius: 2px, margin: 12px auto).

Затем:
```
←    Имя лида                     [⋮ actions]
     #a3f9c1b2 · Facebook · 3 Apr
```

- Стрелка назад: 40×40px tap-зона, иконка chevron-left 20px --text-secondary
- Имя: 18px, font-weight: 700, --text-primary
- UID + source + дата: 12px, --text-muted, цветная точка source (фиолетовая для facebook, серая для manual)
- ⋮ (more actions): 40×40px, три точки вертикальные, --text-secondary → открывает Action Sheet (Delete lead, Export, Generate Contract)

### 4.2 Status Strip

Под header, full-width, bg: --surface:
```
[ New ] → [ Follow-up ] → [ Won ] → [ Lost ]
```
Горизонтальный скролл статусов бизнеса. Текущий статус подсвечен (accent border снизу 2px + bold text). Нажатие на другой статус → мгновенно меняет статус (optimistic update).

Высота полосы: 44px. Каждый элемент: padding 0 16px, font-size: 13px, font-weight: 500.

### 4.3 Быстрые действия (Quick Actions)

Горизонтальный ряд из 3-4 кнопок-иконок, margin: 12px 16px:

```
[📞 Call] [✉ Message] [📋 Task] [💰 Income]
```

Каждая кнопка:
- Bg: --surface
- Border: 1px solid --border-strong
- Border-radius: 10px
- Размер: ~равная ширина, высота 56px
- Иконка сверху (18px, --accent) + подпись снизу (10px, --text-secondary)
- Нажатие: scale(0.96) + соответствующее действие

### 4.4 Основная информация (Info Section)

Карточка с данными лида:
```
[Section Header: "Contact Info"]
  Name      Иван Иванов          [✏️]
  Phone     +48 123 456 789      [📋]
  Email     ivan@mail.com        [📋]
  City      Warsaw

[Section Header: "Event Details"]
  Date      12 April 2025
  Type      Wedding
  Value     5 000 zł

[Section Header: "Assignment"]
  Assigned  Alex Kowalski        [Change]
  Next call Tomorrow 14:00       [Set]
```

- Section Header: 11px, font-weight: 600, --text-muted, letter-spacing: 0.08em, UPPERCASE, margin-bottom: 8px
- Каждая строка: 44px высота, padding 0 16px, border-bottom: 1px solid --border
- Лейбл (Name, Phone...): 13px, --text-secondary, ширина ~35%
- Значение: 14px, --text-primary, bold если важное
- Иконки ✏️ / 📋 / [Change]: 32px tap-зона, иконки 16px, --text-muted
- Нажатие на строку с ✏️ → инлайн-редактирование (поле становится input на месте, клавиатура выезжает)

Редактирование инлайн:
- Строка раскрывается: bg --surface-3, border-color --accent-border
- Текст становится input, фокус автоматический
- Снизу: [Cancel] [Save] — два маленьких чипа, высота 28px

### 4.5 Additional Info

Если есть кастомные поля (из Google Sheet mapping):
```
[Section Header: "Additional Info"]
  Budget       15 000 zł
  Guest count  80
  Venue        City Center
```
Та же структура что и основная инфа. Если пусто — секция скрыта.

### 4.6 Activity / Notes

```
[Section Header: "Activity"]   [+ Add note]
```

- "+ Add note" справа: 13px, --accent, нажатие открывает Note Input Sheet

Список событий снизу вверх (новое сверху):

Каждое событие:
```
  [dot 8px] Status changed: New → Follow-up
            Alex · 3 Apr, 14:22
```

- Dot: цвет зависит от типа события (status change — accent, note — white, call — green)
- Вертикальная линия от dot до следующего (1px, --border)
- Текст события: 14px, --text-primary
- Мета: 12px, --text-muted

Тип "note":
```
  [dot] "Клиент хочет шатер, будет звонить в пятницу"
        Ivan · 5 Apr, 10:05                 [🗑️]
```
Иконка удаления 🗑️ видна только для своих записей (author === current user) или для admin/owner.

### 4.7 Tasks в карточке лида

```
[Section Header: "Tasks"]    [+ Add task]
```

Задача:
```
  [ ] Позвонить клиенту        tomorrow ·  Alex
  [✓] Отправить КП             done · 3 Apr
```

- Чекбокс: 20×20px, border: 2px solid --border-strong, border-radius: 5px
- Выполненная: bg --success-dim, border-color --success, галочка внутри зеленая
- Текст задачи: 14px, --text-primary; выполненная — line-through, --text-muted
- Мета: 12px, --text-muted
- Нажатие на чекбокс → toggle done (optimistic)
- Нажатие на текст → Task Detail Sheet

### 4.8 Attachments в карточке лида

```
[Section Header: "Files"]    [+ Upload]
```

Файлы — горизонтальный скролл preview-плашек:

Изображение:
- 72×72px, border-radius: 8px, object-fit: cover
- При нажатии — fullscreen preview

Документ (PDF, DOCX и т.д.):
- 72×72px, border-radius: 8px, bg: --surface-2
- Иконка файла по центру (24px, --text-secondary)
- Тип файла снизу (10px, --text-muted)
- При нажатии — открывает в браузере или скачивает

Кнопка "+ Upload":
- Такой же 72×72px плашка, border: 2px dashed --border-strong, border-radius: 8px
- Иконка + 20px --text-muted в центре

### 4.9 Financial Summary в карточке лида

```
[Section Header: "Financials"]
  Contract value    5 000 zł
  Income received   3 000 zł    [+ Add]
  Expenses          800 zł      [View all]
  ─────────────────────────────
  Net result        2 200 zł ✓
```

- Contract value: серый
- Income: зеленый если > 0
- Expenses: красный
- Net result: жирный, зеленый если >0, красный если <0
- [+ Add] и [View all] — маленькие текстовые кнопки 12px --accent

---

## ЧАСТЬ 5. CREATE LEAD BOTTOM SHEET

Открывается на 80% высоты экрана.

Drag handle сверху.

Header:
```
✕                New Lead
              
```

- ✕ слева: 40×40px
- "New Lead": 17px, font-weight: 700, по центру

**Форма (вертикальный скролл):**

Каждый field-группой:
```
Name *
[________________________]

Phone *
[________________________]

Email
[________________________]

City
[________________________]

Event Type
[________________________]

Event Date
[  Select date... ▼      ]

Notes
[                        ]
[                        ]
```

- Label над input: 12px, --text-secondary, margin-bottom: 4px
- Обязательные (*): label цвет --accent вместо --text-secondary
- Input: высота 48px, bg: --surface-2, border: 1px solid --border-strong, border-radius: 10px, padding: 0 14px, font-size: 15px, --text-primary
- Focus: border-color --accent, box-shadow: 0 0 0 3px --accent-glow
- Event Date — bottom sheet с calendar picker (нативный или custom)
- Notes — textarea, высота 80px, resize: none

Кнопка внизу (sticky):
```
[        Create Lead        ]
```
- Full width минус боковые отступы (calc(100% - 32px))
- Высота: 50px
- Bg: --accent
- Border-radius: 12px
- Font: 15px, font-weight: 600, белый
- Box-shadow: accent glow

---

## ЧАСТЬ 6. FILTER BOTTOM SHEET

Открывается на ~70% высоты экрана при нажатии "+ Filters".

```
✕             Filters              [Reset]
```

**Секции:**

```
STATUS
[ ] New
[ ] Follow-up  
[ ] Won
[ ] Lost
[ все кастомные стадии... ]

ASSIGNED TO
[ ] Unassigned
[ ] Alex Kowalski
[ ] Maria Nowak

SORT BY
● Created date (new first)
○ Created date (old first)
○ Name A–Z
○ Event date

DATE RANGE
From   [ Select date ]
To     [ Select date ]
```

- Чекбоксы — square 20px, accent когда выбран
- Radio — круглые 20px
- Каждая строка: 44px, border-bottom: 1px solid --border

Внизу (sticky):
```
[    Apply Filters (3)    ]
```
Число в скобках = количество активных фильтров. Кнопка accent, full width.

---

## ЧАСТЬ 7. ВКЛАДКА TASKS

### 7.1 Header

```
Tasks                         [ + New Task ]
4 pending · 2 overdue
```

### 7.2 Filter tabs

Горизонтальные чипы:
```
[ All ] [ Mine ] [ Overdue ] [ Done ]
```

### 7.3 Карточка задачи

```
[ ] Позвонить Иванову                    tomorrow
    Иван Иванов (лид)            👤 Alex K.
```

- Чекбокс слева: 22×22px
- Название: 15px, font-weight: 500, --text-primary
- Если linked с лидом: имя лида под названием, 12px, --text-muted, иконка link 10px
- Дедлайн: справа сверху, 12px
  - В будущем: --text-secondary
  - Сегодня: --warning, font-weight: 600
  - Просрочена: --danger, font-weight: 600
- Ответственный: справа снизу, 12px --text-muted + аватар 16px

Выполненная задача:
- Bg: --surface (немного тусклее)
- Чекбокс заполнен зеленым
- Название: line-through, --text-muted

**Свайп влево:** Delete (красная зона)
**Нажатие на задачу:** Task Detail Sheet

### 7.4 Task Detail Sheet

Заголовок:
```
✕          Task Details         [✏️ Edit]
```

Тело:
```
[✓/○ большой чекбокс 32px]  Название задачи
                              15px bold

LINKED LEAD
[→] Иван Иванов                          [>]

ASSIGNED TO
[avatar] Alex Kowalski                   [Change]

DEADLINE
📅 Tomorrow, 15:00                       [Set]

CREATED BY
Ivan · 2 Apr

NOTES
Уточнить время встречи
```

Внизу кнопка:
```
[    Mark as Done    ]   — если не done
[    Reopen Task     ]   — если done
```

---

## ЧАСТЬ 8. ВКЛАДКА DASHBOARD

### 8.1 Header

```
Dashboard
April 2025                      [ Period ▼ ]
```

Period selector (pill, bg: --surface, border: 1px solid --border-strong): Week / Month / Quarter / Year

### 8.2 Summary Cards (горизонтальный скролл)

4 карточки в горизонтальном скролле:

Каждая карточка:
- Ширина: ~160px, высота: 88px
- Bg: --surface
- Border-radius: 12px
- Border: 1px solid --border
- Padding: 14px

```
CARD 1: Total Leads
  [иконка users 18px --text-muted]
  47
  [14px bold --text-primary]
  Total this period
  [12px --text-secondary]
  ↑ +12 vs last
  [12px --success]

CARD 2: Won Deals
  [иконка trophy 18px --success]
  12
  [14px bold --text-primary]
  Won this period
  ↑ 25.5% conv.
  [12px --text-secondary]

CARD 3: Revenue
  [иконка dollar 18px --accent]
  42 500 zł
  [14px bold --text-primary]
  Income
  ↑ +8 500 zł

CARD 4: Net Profit
  [иконка trending-up 18px --success/--danger]
  38 200 zł
  [14px bold --text-primary]
  After expenses
```

### 8.3 Leads Over Time Chart

Карточка 100% ширины:
- Bg: --surface
- Border-radius: 12px
- Padding: 16px
- Заголовок: 14px, font-weight: 600, --text-primary

Chart — line chart:
- Линия цвет: --accent
- Area под линией: gradient от --accent-glow до transparent
- Оси: --text-muted
- Grid: --border
- Точки при нажатии: tooltip с числом

### 8.4 Conversion Funnel

Карточка:
```
Conversion Funnel
─────────────────────────────────
New           ██████████ 47
Follow-up     ███████    31    66%
Won           ███        12    39%
Lost          ██          8    17%
```

- Bar: bg --surface-2, fill цвет стадии (или --accent для active)
- Проценты: 12px, --text-secondary

### 8.5 Revenue vs Expenses

Donut chart или stacked bar:
- Revenue: --success
- Expenses: --danger
- Net: --accent

Под графиком легенда:
```
● Revenue     42 500 zł
● Expenses     4 300 zł
● Net         38 200 zł
```

### 8.6 Recent Expenses

Список последних расходов:
```
[Section: "Recent Expenses"]    [View all]

Аренда зала          -2 000 zł    1 Apr
Реклама Facebook     -1 500 zł    28 Mar
Флористика           -   800 zł   25 Mar
```

Каждая строка:
- 52px высота
- Описание: 14px --text-primary
- Сумма: 13px --danger, справа
- Дата: 12px --text-muted, справа снизу

---

## ЧАСТЬ 9. ВКЛАДКА TEAM

### 9.1 Header

```
Team                             [ + Add ]
5 members · 2 admins
```

### 9.2 Карточка участника

```
[Avatar 44px]  Имя Фамилия                 [Owner]
               @username
               Sales Manager · 23 leads
```

- Avatar: 44px, круглый, те же детерминированные градиенты
- Имя: 15px, font-weight: 600, --text-primary
- Username: 13px, --text-secondary
- Position + stats: 12px, --text-muted
- Role badge: pill 24px высотой, справа:
  - Owner: bg --accent-glow, border --accent-border, цвет --accent
  - Admin: bg rgba(245,158,11,0.15), border rgba(245,158,11,0.35), цвет --warning
  - Member: bg --surface-2, border --border-strong, цвет --text-secondary

Нажатие на участника → Member Detail Bottom Sheet.

### 9.3 Member Detail Bottom Sheet

Drag handle + header:
```
✕          Участник
```

**Верхний блок:**
```
[Avatar 64px, крупный]
Имя Фамилия
@username · telegram_id
```

**Секции:**

```
ROLE
○ Owner
● Admin
○ Member

POSITION
[ Sales Manager           ]  (редактируемый input)

PERMISSIONS
[toggle] View all leads
[toggle] Edit leads
[toggle] Delete leads
[toggle] View finances
[toggle] Manage team
[toggle] View billing
```

Toggle: 40×24px, bg: --accent когда on, --surface-2 когда off, circle внутри 20×20px

```
STATS
Assigned leads    14
Completed tasks   23
```

**Кнопка удаления** (только для owner/admin, не для самого себя):
```
[  Remove from team  ]  — full width, bg --danger-dim, border --danger, цвет --danger
```

### 9.4 Add Member Bottom Sheet

```
✕          Add Team Member

FIND BY TELEGRAM
[🔍 Telegram username or ID   ]

[ Search ]

───── или ─────

Пользователь должен сначала написать боту @BarowoBot

ROLE FOR NEW MEMBER
○ Admin
● Member
○ Observer
```

Кнопка:
```
[ Add to Team ]  — accent
```

---

## ЧАСТЬ 10. ВКЛАДКА SETTINGS

### 10.1 Header

```
Settings
```

### 10.2 Секции настроек

Каждая секция — карточка (--surface, border-radius: 12px, overflow: hidden):

**Business**
```
Business Name    Barowo Events       [>]
Business Mode    Events & Bookings   [>]
Sheet ID         Connected ✓         [>]
```

**Lead Stages**
```
Lead Stages      5 stages            [>]
```

Нажатие → Stage Editor Screen (отдельный экран, не попап).

**Appearance & Language**
```
Language         Polski              [>]
```

**Account**
```
Plan             Trial · 4 days left [>]
```
- "Trial · 4 days left": цвет --warning
- Если active plan: "--success"
- Нажатие → Subscription Screen

**Platform Admin** (только если is_platform_admin):
```
Platform Admin                       [>]
```

---

## ЧАСТЬ 11. BUSINESS SETTINGS BOTTOM SHEET

Открывается из Settings → Business Name:

```
✕       Business Settings      [Save]

Business Name
[ Barowo Events               ]

Business Mode
[ Events & Bookings     ▼    ]
```

Mode dropdown (раскрывается в bottom sheet внутри bottom sheet — вложенный picker):
- General Sales
- Events & Bookings
- Services
- Custom

---

## ЧАСТЬ 12. LEAD STAGES EDITOR (отдельный экран)

Pushes как новый экран (не bottom sheet), с back-навигацией в Top Bar.

```
←   Lead Stages               [+ Add]
```

Список стадий с drag handle (≡) для переупорядочивания:

```
[≡] [●] New                    [Default]    [⋮]
[≡] [●] Follow-up                           [⋮]
[≡] [●] Won        is_won ✓                 [⋮]
[≡] [●] Lost       is_lost ✓                [⋮]
[≡] [●] Proposal                            [⋮]
```

- Цветной круг: 14px, цвет стадии
- Название: 15px --text-primary
- Badges (is_won, is_lost, requires_follow_up, hide_from_active): маленькие pill 20px, серые
- ⋮ → Stage Action Sheet: Edit, Delete (если нет лидов в этой стадии)

Нажатие на ⋮ → Edit Stage Bottom Sheet:

```
✕    Edit Stage    [Save]

Name
[ Follow-up                   ]

Color
[● #a855f7] [● #22c55e] [● #ef4444] [● #f59e0b] [● #3b82f6] [● custom]

PROPERTIES
[toggle] Is Won
[toggle] Is Lost
[toggle] Requires Follow-up
[toggle] Hide from active pipeline
```

---

## ЧАСТЬ 13. GOOGLE SHEET CONNECT SCREEN

Открывается из Settings → Sheet ID.

**Если не подключен:**
```
✕       Connect Google Sheet

1. GRANT ACCESS
   Share your Google Sheet with:
   
   faceback-acc@faceback-491114.iam.gserviceaccount.com
   
   [📋 Copy Email]    [How to do it?]

2. ENTER SHEET ID
   
   [ https://docs.google.com/...  ]
   
   или просто вставь ID листа

3. SELECT TAB (после верификации)

[ Verify Connection ]  — accent button
```

**Если подключен:**
```
✕       Google Sheet            [Disconnect]

STATUS
● Connected                     [●green ✓]

SHEET
docs.google.com/...             [Open ↗]

TAB
[ Sheet1                  ▼ ]

COLUMN MAPPING                  [Edit >]
  name       → Full Name ✓
  phone      → Phone Number ✓
  email      → Email ✓
  + 3 more

LAST SYNC
3 minutes ago · 12 new leads

[ Sync Now ]  — ghost button, border --border-strong
```

---

## ЧАСТЬ 14. COLUMN MAPPING SCREEN

Отдельный экран:

```
←    Column Mapping
     Select Sheet tab first

SHEET COLUMNS → CRM FIELDS

Full Name          →  [ name              ▼ ]
Phone Number       →  [ phone             ▼ ]
Email              →  [ email             ▼ ]
City               →  [ city              ▼ ]
Event Date         →  [ event_date        ▼ ]
Event Type         →  [ event_type        ▼ ]
Budget             →  [ additional info   ▼ ]
Guest Count        →  [ additional info   ▼ ]
Comments           →  [ notes             ▼ ]
Lead ID            →  [ skip              ▼ ]
```

Каждая строка:
- Слева: название колонки из Sheet (14px, --text-primary)
- Стрелка → (--text-muted)
- Справа: dropdown выбора CRM-поля (44px высота, bg --surface-2, border --border-strong)

Внизу:
```
[ Save Mapping & Sync ]  — accent, full width
```

---

## ЧАСТЬ 15. SUBSCRIPTION SCREEN

Отдельный fullscreen экран (не попап, не вкладка).

```
←    Subscription

[PLAN CARD]

┌─────────────────────────────────────┐
│  ✦  Trial Plan                      │
│                                     │
│  Expires in 4 days                  │
│  3 Apr 2025                         │
│                                     │
│  [donut chart: 3 из 7 дней]         │
└─────────────────────────────────────┘

[USAGE]

Leads          47 / 500          [████░░░░░░░░]
Team members    5 / 10           [█████░░░░░░░]
Businesses      1 / 1            [████████████]
Storage        12 MB / 1 GB      [░░░░░░░░░░░░]

[UPGRADE BLOCK]

Choose your plan:

┌───────────────┐  ┌───────────────┐
│ Basic         │  │ Pro           │
│ 49 zł/mo      │  │ 99 zł/mo      │
│               │  │   POPULAR     │
│ • 500 leads   │  │ • Unlimited   │
│ • 5 members   │  │ • 10 members  │
│ • 1 biz       │  │ • 3 biz       │
│               │  │ • Analytics+  │
│ [Choose]      │  │ [Choose]      │
└───────────────┘  └───────────────┘

[ Restore Purchase ]

BILLING HISTORY
No payments yet
```

- Plan Card: bg gradient из --surface к --surface-2, border --accent-border, border-radius: 16px
- Donut chart: accent цвет для истекшего времени, --surface-3 для оставшегося
- Usage bars: высота 4px, bg --surface-2, fill --accent или --danger если >80%
- Plan cards: 48% ширины, bg --surface, border --border, selected — border --accent
- Popular badge: bg --accent, 11px bold белый

---

## ЧАСТЬ 16. BUSINESS SWITCHER ПОПАП

Открывается из Top Bar при нажатии на chip бизнеса.
Bottom sheet, высота по содержимому (но не больше 60% экрана).

```
Your Businesses

[✓] Barowo Events              Owner   ★
    Trial · 4 days
    
    Studio Foto                Member
    Active plan
    
    + Create New Business
```

- Активный бизнес: слева галочка --accent, справа звездочка
- Неактивный: нажатие мгновенно переключает + закрывает попап
- "+ Create New Business": 14px --accent, иконка + 14px

---

## ЧАСТЬ 17. ADD EXPENSE / ADD INCOME BOTTOM SHEETS

**Add Expense:**
```
✕      Add Expense

Amount (zł)
[ 0.00                        ]
(крупный шрифт, 28px, по центру)

Description
[ Аренда зала                 ]

Type
● One-time
○ Recurring (monthly)

Date
[ Today                  ▼   ]

LINK TO LEAD (optional)
[ Search lead...              ]

[     Add Expense     ]
```

**Add Income:**
```
✕      Add Income

Amount (zł)
[ 0.00                        ]

Description
[ Аванс за свадьбу           ]

Date
[ Today                  ▼   ]

LINKED LEAD
[ Иван Иванов           ✓    ]  ← предзаполнено если открыто из карточки лида

[     Add Income      ]
```

---

## ЧАСТЬ 18. ACTION SHEETS (нативоподобные)

Action Sheet — полупрозрачный overlay снизу. Появляется при ⋮ или свайпе.

Структура:
```
[drag handle]

  Edit Lead
  ─────────
  Assign to me
  ─────────
  Generate Contract
  ─────────
  Delete Lead        ← красный цвет --danger
  ─────────
  Cancel             ← bold, отдельный блок
```

- Bg: --surface (первый блок с действиями) + --surface (отдельный блок Cancel)
- Border-radius: 16px
- Между блоками: 8px gap
- Строка: 56px высота, font-size: 16px, по центру
- Danger строка: --danger

---

## ЧАСТЬ 19. CONFIRMATION ALERTS

Centered modal поверх overlay:

```
         ┌─────────────────────┐
         │  Delete Lead?       │
         │                     │
         │  This will          │
         │  permanently remove │
         │  Ivan Ivanov and    │
         │  all associated     │
         │  data.              │
         │                     │
         │  [ Cancel ]         │
         │  [ Delete  ]        │
         └─────────────────────┘
```

- Ширина: min(calc(100% - 64px), 320px)
- Bg: --surface
- Border: 1px solid --border-strong
- Border-radius: 16px
- Заголовок: 17px, font-weight: 700, --text-primary
- Текст: 14px, --text-secondary
- [Cancel]: ghost, full width, высота 48px, border-top --border
- [Delete]: --danger, full width, высота 48px, font-weight: 600

---

## ЧАСТЬ 20. TOAST NOTIFICATIONS

Появляются сверху (под Top Bar), auto-dismiss 3s.

```
[  ✓  Lead updated  ]
```

- Bg: --surface-2
- Border: 1px solid --border-strong
- Border-radius: 10px
- Padding: 12px 16px
- Иконка ✓: --success 16px
- Текст: 14px, --text-primary
- Slide in from top 32px, opacity 0→1, 200ms

Типы:
- Success: иконка ✓ зеленый
- Error: иконка ✕ красный
- Info: иконка ℹ️ --accent

---

## ЧАСТЬ 21. EMPTY & LOADING STATES

**Skeleton loading** (пока грузятся данные):
- Строки-заменители: bg --surface-2, border-radius: 6px, animation pulse (opacity 0.5↔1, 1.2s infinite)
- Аватар: круг --surface-2
- Строки текста: прямоугольники разной ширины (60%, 40%, 80%)

**Empty state** (нет данных):
- Иконка: 48px, --text-muted
- Заголовок: 16px, font-weight: 600, --text-primary
- Описание: 14px, --text-secondary
- Кнопка: accent (если есть action)

**Error state** (ошибка загрузки):
```
         [иконка wifi-off 40px --text-muted]
         
         Something went wrong
         
         [ Try Again ]  — ghost button
```

---

## ЧАСТЬ 22. INVENTORY TAB (опциональный модуль)

Таб появляется только если в business mode включен inventory.

### 22.1 Header

```
Inventory                       [ + Add Item ]
12 items · 3 low stock
```

### 22.2 Low Stock Alert Banner

Если есть позиции с низким остатком:
```
⚠️ 3 items are running low      [View →]
```
- Bg: --warning-dim
- Border-left: 3px solid --warning
- Border-radius: 8px
- Font: 13px, --warning

### 22.3 Карточка Stock Item

```
[иконка вещи]  Стойка для света           [In Stock]
               SKU: STD-001
               Остаток: 8 / Порог: 5     ████████░░
```

- Иконка: 40px, bg --surface-2, border-radius: 10px
- Название: 15px bold --text-primary
- SKU: 12px --text-muted
- Прогресс-бар остатка: высота 4px, --accent (норм) или --danger (ниже порога)
- [In Stock] badge: зеленый. [Low Stock]: --warning. [Out of Stock]: --danger

### 22.4 Apply Template to Lead

```
✕    Apply Template to Lead

SELECT LEAD
[ Search lead...           ▼ ]

SELECT TEMPLATE
○ Wedding Basic Set
● Corporate Event
○ DJ Travel Kit

PREVIEW
  Стойки × 2    (available: 8)  ✓
  Лампы  × 4    (available: 6)  ✓
  Декор  × 1    (available: 0)  ⚠️ missing

[ Apply & Reserve ]  — accent
```

---

## ЧАСТЬ 23. ONBOARDING FLOW (первый запуск)

### 23.1 Welcome Screen

Полноэкранный экран (не Mini App внутри — это первый экран):
```
        [лого Barowo 64px]
        
        Barowo CRM
        
        CRM inside Telegram
        for modern businesses
        
        [        Get Started        ]
        
        Already have an account? Sign in
```

### 23.2 Create Business Screen

```
←    Create Your Business

Business Name
[ My Wedding Studio           ]

Business Mode
[ Events & Bookings     ▼    ]

[        Continue        ]
```

### 23.3 Connect Sheet Screen

```
←    Connect Google Sheet

Optional for now, do it later in Settings

[  Connect Sheet  ]    [  Skip  ]
```

---

## ЧАСТЬ 24. NOTE INPUT BOTTOM SHEET

Открывается при "+ Add note" в Lead Activity.

```
✕      Add Note

[                              ]
[                              ]
[                              ]
[  Type your note here...      ]
[                              ]

[        Save Note        ]
```

- Textarea: bg --surface-2, border --border-strong, border-radius: 10px, padding: 12px 14px, font-size: 14px, min-height: 120px
- При открытии — автофокус, клавиатура выезжает, bottom sheet поднимается выше клавиатуры

---

## ЧАСТЬ 25. PLATFORM ADMIN SCREEN

Доступен только platform_admin.

```
←    Platform Admin

BUSINESSES
  Total         124
  Active plan    89
  Trial          31
  Expired         4

USERS
  Total         312

RECENT ACTIVITY
  [список последних событий]

[   Export All Data   ]  — ghost
```

---

## ИТОГОВЫЕ ПРАВИЛА ДЛЯ CODEX

1. **Никогда не используй чистый черный `#000000` или белый `#ffffff` как фон**. Только из палитры.

2. **Все попапы — bottom sheets**. Исключение только для confirm-алертов.

3. **Drag handle** у каждого bottom sheet: 36×4px, --surface-3, border-radius: 2px, margin: 12px auto 0.

4. **Минимальный размер tap-зоны — 44×44px**. Даже если иконка 16px, вокруг нее должно быть 44px tap-зоны.

5. **Кнопки primary** (акцент фиолетовый): только для главного действия экрана. Одна на экран/попап.

6. **Destructive actions** (delete): всегда отдельная кнопка с --danger-dim bg и --danger text/border. Никогда не accent.

7. **Skeleton loading** вместо спиннеров. Спиннеры только для in-place операций (saving кнопка).

8. **Статусы лидов**: цвет берется из БД (поле `color` в lead_statuses). Не хардкодить цвета статусов.

9. **Списки** с drag-to-reorder (стадии, шаблоны) используют ≡ handle слева, 44px строка.

10. **Font-size не меньше 11px** нигде (accessibility).

11. **Все финансовые цифры** с пробелами-разделителями тысяч: `42 500 zł`, не `42500 zł`.

12. **Аватары** — детерминированный цвет из имени (hash имени → один из 8 accent цветов), не random. Это чтобы один и тот же пользователь всегда имел один и тот же цвет аватара.

13. **overflow-x scroll** у горизонтальных рядов (чипы, карточки) — без скроллбара (`scrollbar-width: none`).

14. **Кнопки в bottom sheet** — sticky к низу, с padding снизу = max(16px, env(safe-area-inset-bottom)).

15. **При пустом поиске** или сбросе фильтров — показывать all leads, не пустой экран.
