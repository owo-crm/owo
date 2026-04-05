"use client";

import { type FormEvent, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { type SelectOption } from "@/components/ui/Select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

type LeadsControlsProps = {
  search: string;
  onSearchChange: (value: string) => void;
  owner: string;
  onOwnerChange: (value: string) => void;
  stage: string;
  onStageChange: (value: string) => void;
  queueStatus: string;
  onQueueStatusChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  view: "active" | "all";
  onViewChange: (value: "active" | "all") => void;
  ownerOptions: SelectOption[];
  stageOptions: SelectOption[];
  queueStatusOptions: SelectOption[];
  sourceOptions: SelectOption[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  actionsEnabled: boolean;
  onCreateLead: (input: {
    fullName: string;
    email: string;
    phone?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
};

function BasicSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={[
        "h-10 w-full rounded-xl border border-[#ccd7f5] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#6b7ff0]/55 focus:ring-2 focus:ring-[#6b7ff0]/35",
        className ?? "",
      ].join(" ")}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function NewLeadDialogTrigger({
  mobile = false,
  actionsEnabled,
  onCreateLead,
}: {
  mobile?: boolean;
  actionsEnabled: boolean;
  onCreateLead: (input: {
    fullName: string;
    email: string;
    phone?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName || !normalizedEmail) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await onCreateLead({
      fullName: normalizedName,
      email: normalizedEmail,
      phone: phone.trim() || undefined,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Lead create failed.");
      return;
    }

    setOpen(false);
    setFullName("");
    setEmail("");
    setPhone("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mobile ? (
          <Button
            className="h-12 min-w-[92px] rounded-full px-4 shadow-[0_12px_24px_rgba(79,103,232,0.28)]"
            disabled={!actionsEnabled}
          >
            + New
          </Button>
        ) : (
          <Button className="h-11 min-w-[104px]" disabled={!actionsEnabled}>
            + New
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <h3 className="text-lg font-semibold">Quick lead create</h3>
        <p className="mt-1 text-sm text-slate-600">
          Create lead directly in the active business queue.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <FormField label="Full name">
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Name"
            />
          </FormField>
          <FormField label="Email">
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="email"
            />
          </FormField>
          <FormField label="Phone (optional)">
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+48 ..."
            />
          </FormField>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="mt-1" type="submit" disabled={submitting || !actionsEnabled}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeadsControls({
  search,
  onSearchChange,
  owner,
  onOwnerChange,
  stage,
  onStageChange,
  queueStatus,
  onQueueStatusChange,
  source,
  onSourceChange,
  view,
  onViewChange,
  ownerOptions,
  stageOptions,
  queueStatusOptions,
  sourceOptions,
  hasActiveFilters,
  onResetFilters,
  actionsEnabled,
  onCreateLead,
}: LeadsControlsProps) {
  const advancedFilterCount = Number(queueStatus !== "all") + Number(source !== "all");

  return (
    <div className="space-y-3">
      <div className="hidden items-center justify-between gap-3 lg:flex">
        <Tabs value={view} onValueChange={(value) => onViewChange(value as "active" | "all")}>
          <TabsList className="h-11 border-[#d2dcf8] bg-white p-1">
            <TabsTrigger value="active" className="h-9 px-3.5 text-xs">
              Active queue
            </TabsTrigger>
            <TabsTrigger value="all" className="h-9 px-3.5 text-xs">
              All leads
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-2 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7ff0]" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, phone, email"
              aria-label="Search leads"
              className="h-11 pl-9"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 shrink-0 gap-1.5 px-2.5 min-[390px]:px-3">
                Filters
                {advancedFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6b7ff0] px-1 text-[11px] font-semibold text-white">
                    {advancedFilterCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <h3 className="text-lg font-semibold">Advanced filters</h3>
              <p className="mt-1 text-sm text-slate-600">Additional filtering options for mobile leads queue.</p>
              <div className="mt-4 grid gap-3">
                <FormField label="Queue status">
                  <BasicSelect
                    value={queueStatus}
                    onChange={onQueueStatusChange}
                    options={queueStatusOptions}
                  />
                </FormField>
                <FormField label="Source">
                  <BasicSelect value={source} onChange={onSourceChange} options={sourceOptions} />
                </FormField>
                <Button
                  variant="ghost"
                  className="justify-start px-0 text-sm text-[#4b63d8] hover:text-[#243a8f]"
                  onClick={onResetFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear all filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <BasicSelect
            value={stage}
            onChange={onStageChange}
            options={stageOptions}
            className="col-span-2 h-11 min-[390px]:col-span-1 min-[390px]:col-auto"
          />
          <BasicSelect
            value={owner}
            onChange={onOwnerChange}
            options={ownerOptions}
            className="col-span-2 h-11 min-[390px]:col-span-1 min-[390px]:col-auto"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Tabs value={view} onValueChange={(value) => onViewChange(value as "active" | "all")}>
            <TabsList className="h-11 border-[#d2dcf8] bg-white p-1">
              <TabsTrigger value="active" className="h-9 px-2.5 text-xs min-[390px]:px-3.5">
                Active
              </TabsTrigger>
              <TabsTrigger value="all" className="h-9 px-2.5 text-xs min-[390px]:px-3.5">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <NewLeadDialogTrigger
            mobile
            actionsEnabled={actionsEnabled}
            onCreateLead={onCreateLead}
          />
        </div>
      </div>

      <div className="hidden gap-2 lg:grid lg:grid-cols-3 xl:grid-cols-[1.4fr_0.9fr_0.95fr_0.95fr_0.95fr_auto]">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7ff0]" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, phone, email"
            aria-label="Search leads"
            className="h-11 pl-9"
          />
        </div>
        <BasicSelect value={owner} onChange={onOwnerChange} options={ownerOptions} className="h-11" />
        <BasicSelect value={stage} onChange={onStageChange} options={stageOptions} className="h-11" />
        <BasicSelect
          value={queueStatus}
          onChange={onQueueStatusChange}
          options={queueStatusOptions}
          className="h-11"
        />
        <BasicSelect value={source} onChange={onSourceChange} options={sourceOptions} className="h-11" />

        <div className="flex items-center justify-end lg:col-span-3 xl:col-span-1">
          <NewLeadDialogTrigger
            actionsEnabled={actionsEnabled}
            onCreateLead={onCreateLead}
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onResetFilters}
          className="hidden text-sm text-[#4b63d8] transition hover:text-[#243a8f] lg:inline-flex"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
