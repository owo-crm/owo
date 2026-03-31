import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getSheetMappingSuggestions, saveSheetMapping, syncSheet } from "../api/businesses";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import { mappingFields } from "../data/mapping";
import { useAuthStore } from "../store/auth";
import { useBusinessStore } from "../store/business";

type SheetMappingPageProps = {
  businessName: string;
  businessId: string;
  sheetId: string;
  sheetTabName: string;
  currentMapping: Record<string, string>;
  onClose: () => void;
};

type AdditionalInfoMappingRow = {
  id: string;
  label: string;
  column: string;
};

function createAdditionalInfoRow(label = "", column = ""): AdditionalInfoMappingRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label,
    column,
  };
}

function splitMapping(mapping: Record<string, string>) {
  const fixedMapping: Record<string, string> = {};
  const additionalRows: AdditionalInfoMappingRow[] = [];

  Object.entries(mapping).forEach(([key, value]) => {
    if (key.startsWith("additional_info:")) {
      additionalRows.push(createAdditionalInfoRow(key.replace("additional_info:", ""), value));
      return;
    }
    fixedMapping[key] = value;
  });

  return { fixedMapping, additionalRows };
}

function combineMapping(
  fixedMapping: Record<string, string>,
  additionalRows: AdditionalInfoMappingRow[],
) {
  const combinedMapping: Record<string, string> = { ...fixedMapping };

  additionalRows.forEach((row) => {
    const label = row.label.trim();
    const column = row.column.trim();
    if (!label || !column) {
      return;
    }
    combinedMapping[`additional_info:${label}`] = column;
  });

  return combinedMapping;
}

export function SheetMappingPage({
  businessName,
  businessId,
  sheetId,
  sheetTabName,
  currentMapping,
  onClose,
}: SheetMappingPageProps) {
  const token = useAuthStore((state) => state.token);
  const updateBusinessMapping = useBusinessStore((state) => state.updateBusinessMapping);
  const updateBusinessSyncStatus = useBusinessStore((state) => state.updateBusinessSyncStatus);
  const queryClient = useQueryClient();
  const [fixedMapping, setFixedMapping] = useState<Record<string, string>>(splitMapping(currentMapping).fixedMapping);
  const [additionalInfoMappings, setAdditionalInfoMappings] = useState<AdditionalInfoMappingRow[]>(
    splitMapping(currentMapping).additionalRows,
  );
  const [headers, setHeaders] = useState<string[]>([]);
  const [statusText, setStatusText] = useState("Loading column suggestions...");
  const [sheetTitle, setSheetTitle] = useState<string | null>(null);
  const [selectedTabName, setSelectedTabName] = useState(sheetTabName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedTabName(sheetTabName);
  }, [sheetTabName]);

  useEffect(() => {
    const nextMapping = splitMapping(currentMapping);
    setFixedMapping(nextMapping.fixedMapping);
    setAdditionalInfoMappings(nextMapping.additionalRows);
  }, [currentMapping]);

  useEffect(() => {
    if (!businessId || !sheetId || !sheetTabName || !token) {
      return;
    }

    let cancelled = false;
    setStatusText("Loading column suggestions...");
    setHeaders([]);
    setFixedMapping({});

    void getSheetMappingSuggestions(businessId, sheetId, sheetTabName, token)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setSheetTitle(response.sheet_title ?? null);
        setSelectedTabName(response.selected_tab_name ?? sheetTabName);
        setHeaders(response.headers);
        const nextMapping = splitMapping(currentMapping);
        setFixedMapping({
          ...response.suggested_mapping,
          ...nextMapping.fixedMapping,
        });
        setAdditionalInfoMappings(nextMapping.additionalRows);
        setStatusText(response.message);
      })
      .catch(() => {
        if (!cancelled) {
          setStatusText("Could not load live headers from the backend.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, currentMapping, sheetId, sheetTabName, token]);

  function addAdditionalInfoMappingRow() {
    setAdditionalInfoMappings((current) => [...current, createAdditionalInfoRow()]);
  }

  function updateAdditionalInfoMappingRow(index: number, field: "label" | "column", value: string) {
    setAdditionalInfoMappings((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  function removeAdditionalInfoMappingRow(index: number) {
    setAdditionalInfoMappings((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  async function handleSave() {
    const combinedMapping = combineMapping(fixedMapping, additionalInfoMappings);
    updateBusinessMapping(businessId, combinedMapping);

    if (!businessId || !token) {
      setStatusText("Backend auth is missing, so mapping cannot be saved yet.");
      return;
    }

    try {
      setIsSaving(true);
      await saveSheetMapping(businessId, combinedMapping, token);
      const syncResult = await syncSheet(businessId, token);
      updateBusinessSyncStatus(businessId, syncResult.sheet_last_synced_at ?? null);
      await queryClient.invalidateQueries({ queryKey: ["leads", businessId] });
      setStatusText(
        `${syncResult.message} Imported ${syncResult.created_count}, updated ${syncResult.updated_count}, skipped ${syncResult.skipped_count}.`,
      );
    } catch {
      setStatusText("Mapping could not be saved or synced. Check backend logs and sheet access.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Sheet column mapping</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Back
        </button>
      </div>

      <article className="panel">
        <div className="mapping-intro">
          <div>
            <h3>Match Facebook buffer columns</h3>
            <p>
              Search through the sheet columns and map only the fields you really need. Saving the
              mapping now also syncs the current rows into your leads database.
            </p>
            {sheetTitle ? <p className="mapping-status">Connected sheet: {sheetTitle}</p> : null}
            {selectedTabName ? <p className="mapping-status">Worksheet tab: {selectedTabName}</p> : null}
            <p className="mapping-status">{statusText}</p>
          </div>
          <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving and syncing..." : "Save and sync"}
          </button>
        </div>

        {isSaving ? <Spinner label="Saving mapping and importing leads..." /> : null}

        <div className="stack-list">
          {headers.length === 0 ? (
            <article className="panel panel--subtle">
              <h3>Loading live sheet headers</h3>
              <p>Waiting for the backend to read the selected worksheet tab.</p>
              <Spinner label="Loading live headers..." />
            </article>
          ) : (
            mappingFields.map((field) => (
              <article key={field.key} className="panel panel--subtle mapping-row">
                <div className="mapping-row__copy">
                  <strong>{field.label}</strong>
                  <p>Choose the matching column from the selected worksheet tab.</p>
                </div>
                <div className="mapping-row__field">
                  <SelectField
                    label="Sheet column"
                    value={fixedMapping[field.key] ?? ""}
                    onChange={(value) =>
                      setFixedMapping((current) => ({
                        ...current,
                        [field.key]: value,
                      }))
                    }
                    options={headers.map((header) => ({
                      value: header,
                      label: header,
                    }))}
                    searchable
                    searchPlaceholder="Search columns..."
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mapping-inline-tools">
          <span className="select-field__label">Additional info</span>
          <button type="button" className="icon-button" onClick={addAdditionalInfoMappingRow} aria-label="Add additional info mapping">
            +
          </button>
        </div>

        {additionalInfoMappings.length > 0 ? (
          <div className="stack-list stack-list--tight">
            {additionalInfoMappings.map((row, index) => (
              <div key={row.id} className="lead-detail__extra-row">
                <label className="input-field">
                  <input
                    className="input-field__control"
                    value={row.label}
                    onChange={(event) => updateAdditionalInfoMappingRow(index, "label", event.target.value)}
                    placeholder="Field label"
                  />
                </label>
                <div className="input-field">
                  <SelectField
                    label="Sheet column"
                    value={row.column}
                    onChange={(value) => updateAdditionalInfoMappingRow(index, "column", value)}
                    options={headers.map((header) => ({
                      value: header,
                      label: header,
                    }))}
                    searchable
                    searchPlaceholder="Search columns..."
                  />
                </div>
                <button type="button" className="ghost-button" onClick={() => removeAdditionalInfoMappingRow(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
