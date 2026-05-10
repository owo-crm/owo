"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DropAnimation,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Slot } from "@radix-ui/react-slot";

type KanbanColumns<T> = Record<string, T[]>;

type KanbanContextValue<T> = {
  columns: KanbanColumns<T>;
  setColumns: (value: KanbanColumns<T>) => void;
  getItemId: (item: T) => string;
  columnIds: string[];
  activeId: UniqueIdentifier | null;
  findContainer: (id: UniqueIdentifier, source?: KanbanColumns<T>) => string | undefined;
  isColumn: (id: UniqueIdentifier) => boolean;
};

const KanbanContext = React.createContext<KanbanContextValue<unknown> | null>(null);

function useKanbanContext<T>() {
  const context = React.useContext(KanbanContext);
  if (!context) {
    throw new Error("Kanban components must be used within <Kanban />");
  }
  return context as KanbanContextValue<T>;
}

type ColumnContextValue = {
  attributes: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  isDragging: boolean;
  disabled: boolean;
};

const ColumnContext = React.createContext<ColumnContextValue>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

type ItemContextValue = {
  listeners?: DraggableSyntheticListeners;
  isDragging: boolean;
  disabled: boolean;
};

const ItemContext = React.createContext<ItemContextValue>({
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

const dropAnimationConfig: DropAnimation = {
  ...defaultDropAnimation,
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.35",
      },
    },
  }),
};

function cloneColumns<T>(columns: KanbanColumns<T>) {
  const next: KanbanColumns<T> = {};
  Object.entries(columns).forEach(([columnId, items]) => {
    next[columnId] = [...items];
  });
  return next;
}

function findContainerInColumns<T>(
  id: UniqueIdentifier,
  columns: KanbanColumns<T>,
  columnIds: string[],
  getItemId: (item: T) => string,
) {
  const raw = String(id);
  if (columnIds.includes(raw)) return raw;
  return columnIds.find((columnId) => columns[columnId].some((item) => getItemId(item) === raw));
}

export type KanbanMoveEvent = {
  event: DragEndEvent;
  activeContainer: string;
  activeIndex: number;
  overContainer: string;
  overIndex: number;
};

export type KanbanProps<T> = {
  value: KanbanColumns<T>;
  onValueChange: (value: KanbanColumns<T>) => void;
  getItemValue: (item: T) => string;
  children: React.ReactNode;
  className?: string;
  onMove?: (event: KanbanMoveEvent) => void;
  onActiveChange?: (active: { id: string; variant: "item" | "column" } | null) => void;
};

export function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  className,
  onMove,
  onActiveChange,
}: KanbanProps<T>) {
  const columns = value;
  const setColumns = onValueChange;
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const dragStartColumnsRef = React.useRef<KanbanColumns<T> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = React.useMemo(() => Object.keys(columns), [columns]);
  const isColumn = React.useCallback((id: UniqueIdentifier) => columnIds.includes(String(id)), [columnIds]);

  const findContainer = React.useCallback(
    (id: UniqueIdentifier, source?: KanbanColumns<T>) =>
      findContainerInColumns(id, source ?? columns, columnIds, getItemValue),
    [columnIds, columns, getItemValue],
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    dragStartColumnsRef.current = cloneColumns(columns);
    setActiveId(event.active.id);
    onActiveChange?.({
      id: String(event.active.id),
      variant: isColumn(event.active.id) ? "column" : "item",
    });
  }, [columns, isColumn, onActiveChange]);

  const handleDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;
      if (isColumn(active.id)) return;

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);
      if (!activeContainer || !overContainer || activeContainer === overContainer) return;

      const activeItems = [...columns[activeContainer]];
      const overItems = [...columns[overContainer]];

      const activeIndex = activeItems.findIndex((item) => getItemValue(item) === String(active.id));
      if (activeIndex < 0) return;

      const [movedItem] = activeItems.splice(activeIndex, 1);
      const rawOverIndex = isColumn(over.id)
        ? overItems.length
        : overItems.findIndex((item) => getItemValue(item) === String(over.id));
      const overIndex = rawOverIndex < 0 ? overItems.length : rawOverIndex;

      overItems.splice(overIndex, 0, movedItem);

      setColumns({
        ...columns,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      });
    },
    [columns, findContainer, getItemValue, isColumn, setColumns],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const startColumns = dragStartColumnsRef.current ?? columns;
      dragStartColumnsRef.current = null;
      setActiveId(null);
      onActiveChange?.(null);
      if (!over) return;

      if (isColumn(active.id) && isColumn(over.id)) {
        const activeIndex = columnIds.indexOf(String(active.id));
        const overIndex = columnIds.indexOf(String(over.id));
        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return;
        const nextOrder = arrayMove(columnIds, activeIndex, overIndex);
        const nextColumns: KanbanColumns<T> = {};
        nextOrder.forEach((columnId) => {
          nextColumns[columnId] = columns[columnId] ?? [];
        });
        setColumns(nextColumns);
        return;
      }

      const activeContainer = findContainer(active.id, startColumns);
      const overContainer = findContainer(over.id);
      if (!activeContainer || !overContainer) return;

      const currentColumns = cloneColumns(columns);

      if (activeContainer === overContainer) {
        const activeIndex = currentColumns[activeContainer].findIndex((item) => getItemValue(item) === String(active.id));
        const overIndex = isColumn(over.id)
          ? currentColumns[overContainer].length - 1
          : currentColumns[overContainer].findIndex((item) => getItemValue(item) === String(over.id));

        if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
          currentColumns[activeContainer] = arrayMove(currentColumns[activeContainer], activeIndex, overIndex);
          setColumns(currentColumns);
        }
      }

      if (onMove) {
        const fromItems = startColumns[activeContainer] ?? [];
        const toItems = currentColumns[overContainer] ?? [];
        const activeIndex = fromItems.findIndex((item) => getItemValue(item) === String(active.id));
        const overIndex = isColumn(over.id)
          ? toItems.length
          : toItems.findIndex((item) => getItemValue(item) === String(over.id));

        onMove({
          event,
          activeContainer,
          activeIndex: activeIndex < 0 ? 0 : activeIndex,
          overContainer,
          overIndex: overIndex < 0 ? toItems.length : overIndex,
        });
      }
    },
    [columnIds, columns, findContainer, getItemValue, isColumn, onMove, onActiveChange, setColumns],
  );

  const handleDragCancel = React.useCallback(() => {
    dragStartColumnsRef.current = null;
    setActiveId(null);
    onActiveChange?.(null);
  }, [onActiveChange]);

  const contextValue = React.useMemo<KanbanContextValue<T>>(
    () => ({
      columns,
      setColumns,
      getItemId: getItemValue,
      columnIds,
      activeId,
      findContainer,
      isColumn,
    }),
    [activeId, columnIds, columns, findContainer, getItemValue, isColumn, setColumns],
  );

  return (
    <KanbanContext.Provider value={contextValue as KanbanContextValue<unknown>}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        autoScroll={false}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div data-slot="kanban" data-dragging={activeId !== null} className={cn(className)}>
          {children}
        </div>
      </DndContext>
    </KanbanContext.Provider>
  );
}

export type KanbanBoardProps = {
  className?: string;
  children: React.ReactNode;
};

export function KanbanBoard({ children, className }: KanbanBoardProps) {
  const { columnIds } = useKanbanContext<unknown>();
  return (
    <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
      <div data-slot="kanban-board" className={cn("flex min-w-max gap-4", className)}>
        {children}
      </div>
    </SortableContext>
  );
}

export type KanbanColumnProps = React.HTMLAttributes<HTMLElement> & {
  value: string;
  disabled?: boolean;
};

export function KanbanColumn({
  value,
  className,
  children,
  disabled = false,
  style: styleProp,
  ...props
}: KanbanColumnProps) {
  const { activeId, isColumn } = useKanbanContext<unknown>();
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id: value,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(styleProp ?? {}),
  };

  return (
    <ColumnContext.Provider value={{ attributes, listeners, isDragging: activeId ? isColumn(activeId) : false, disabled }}>
      <section
        ref={setNodeRef}
        data-slot="kanban-column"
        data-value={value}
        data-dragging={isDragging}
        data-disabled={disabled}
        style={style}
        className={cn("group/kanban-column flex shrink-0 flex-col", isDragging && "opacity-75", className)}
        {...props}
      >
        {children}
      </section>
    </ColumnContext.Provider>
  );
}

export type KanbanColumnHandleProps = {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  cursor?: boolean;
};

export function KanbanColumnHandle({
  asChild = false,
  className,
  children,
  cursor = true,
}: KanbanColumnHandleProps) {
  const { attributes, listeners, isDragging, disabled } = React.useContext(ColumnContext);
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...attributes}
      {...listeners}
      className={cn(cursor && (isDragging ? "cursor-grabbing" : "cursor-grab"), className)}
    >
      {children}
    </Comp>
  );
}

export type KanbanColumnContentProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function KanbanColumnContent({ value, className, children }: KanbanColumnContentProps) {
  const { columns, getItemId } = useKanbanContext<unknown>();
  const itemIds = React.useMemo(
    () => (columns[value] ?? []).map((item) => getItemId(item as never)),
    [columns, getItemId, value],
  );

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div data-slot="kanban-column-content" className={cn("flex flex-col gap-2", className)}>
        {children}
      </div>
    </SortableContext>
  );
}

export type KanbanItemProps = {
  value: string;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

export function KanbanItem({
  value,
  asChild = false,
  className,
  children,
  disabled = false,
}: KanbanItemProps) {
  const { activeId, isColumn } = useKanbanContext<unknown>();
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id: value,
    disabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Comp = asChild ? Slot : "div";

  return (
    <ItemContext.Provider value={{ listeners, isDragging: activeId ? !isColumn(activeId) : false, disabled }}>
      <Comp
        ref={setNodeRef}
        data-slot="kanban-item"
        data-value={value}
        data-dragging={isDragging}
        data-disabled={disabled}
        style={style}
        {...attributes}
        className={cn(isDragging && "opacity-35", className)}
      >
        {children}
      </Comp>
    </ItemContext.Provider>
  );
}

export type KanbanItemHandleProps = {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  cursor?: boolean;
};

export function KanbanItemHandle({
  asChild = false,
  className,
  children,
  cursor = true,
}: KanbanItemHandleProps) {
  const { listeners, isDragging, disabled } = React.useContext(ItemContext);
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="kanban-item-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...listeners}
      className={cn(cursor && (isDragging ? "cursor-grabbing" : "cursor-grab"), className)}
    >
      {children}
    </Comp>
  );
}

export type KanbanOverlayProps = {
  className?: string;
  children?:
    | React.ReactNode
    | ((params: { value: UniqueIdentifier; variant: "column" | "item" }) => React.ReactNode);
};

export function KanbanOverlay({ children, className }: KanbanOverlayProps) {
  const { activeId, isColumn } = useKanbanContext<unknown>();
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!activeId) {
      setDimensions(null);
      return;
    }
    const variant = isColumn(activeId) ? "column" : "item";
    const element = document.querySelector(`[data-slot="kanban-${variant}"][data-value="${String(activeId)}"]`);
    if (!element) {
      setDimensions(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
  }, [activeId, isColumn]);

  const content = React.useMemo(() => {
    if (!activeId) return null;
    if (typeof children === "function") {
      return children({ value: activeId, variant: isColumn(activeId) ? "column" : "item" });
    }
    return children;
  }, [activeId, children, isColumn]);

  return (
    <DragOverlay dropAnimation={dropAnimationConfig}>
      <div
        data-slot="kanban-overlay"
        data-dragging={activeId ? true : undefined}
        style={{
          width: dimensions?.width,
          height: dimensions?.height,
        }}
        className={cn("pointer-events-none", className, activeId && "cursor-grabbing")}
      >
        {content}
      </div>
    </DragOverlay>
  );
}
