"use client";

import { Button, Description, Label, Modal, Spinner, TextArea, TextField, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { CheckCircle2Icon, DownloadIcon, FileUpIcon, Globe2Icon, TriangleAlertIcon } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import {
  CATEGORY_CSV_TEMPLATE,
  parseCategoriesCsv,
  type CsvCategoryRow,
} from "./parse-categories-csv";

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(CATEGORY_CSV_TEMPLATE)}`;

export default function ImportCategories({
  hasActiveSeason,
  existingTexts,
}: {
  hasActiveSeason: boolean;
  existingTexts: string[];
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [rows, setRows] = useState<CsvCategoryRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createMany = useMutation(api.categories.createMany);

  const validRows = rows.filter((row) => row.errors.length === 0);
  const problemRows = rows.length - validRows.length;

  function reset() {
    setFileName(null);
    setPastedText("");
    setRows([]);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (isImporting) return;
    setOpen(next);
    if (!next) reset();
  }

  async function readFile(file: File) {
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setFileName(file.name);
      setRows([]);
      setFileError("Choose a .csv file.");
      return;
    }
    const result = parseCategoriesCsv(await file.text(), existingTexts);
    setFileName(file.name);
    setPastedText("");
    setRows(result.rows);
    setFileError(result.error);
  }

  /** Parses pasted CSV text as it is typed. A file choice clears it. */
  function handlePaste(text: string) {
    setPastedText(text);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
    if (text.trim() === "") {
      setRows([]);
      setFileError(null);
      return;
    }
    const result = parseCategoriesCsv(text, existingTexts);
    setRows(result.rows);
    setFileError(result.error);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void readFile(file);
  }

  async function handleImport() {
    setIsImporting(true);
    try {
      const count = await createMany({
        categories: validRows.map(({ text, scoringDescription, isGlobal }) => ({
          text,
          scoringDescription,
          isGlobal,
        })),
      });
      toast.success("Categories imported", {
        description: `${count} ${count === 1 ? "category is" : "categories are"} added.`,
      });
      setIsImporting(false);
      handleOpenChange(false);
    } catch (error) {
      toast.danger("Categories not imported", {
        description: error instanceof Error ? error.message : "Try again.",
      });
      setIsImporting(false);
    }
  }

  return (
    <>
      <Button
        size="lg"
        variant="secondary"
        className="w-full sm:w-auto"
        isDisabled={!hasActiveSeason}
        onPress={() => setOpen(true)}
      >
        <FileUpIcon className="size-4" />
        Import CSV
      </Button>

      <Modal.Backdrop isOpen={open} onOpenChange={handleOpenChange} isDismissable={!isImporting}>
        <Modal.Container placement="auto" scroll="inside">
          <Modal.Dialog className="sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Import categories</Modal.Heading>
              <p className="text-sm text-muted">
                Columns: <span className="font-medium text-foreground">category</span>,{" "}
                <span className="font-medium text-foreground">global</span> (yes or no) and{" "}
                <span className="font-medium text-foreground">scoring</span> (optional). You can
                add or change scoring descriptions later.
              </p>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-6 text-center transition-colors duration-150 ease-out hover:bg-surface-hover has-focus-visible:outline-2 has-focus-visible:outline-focus",
                  isDragging && "border-accent bg-accent-soft",
                )}
              >
                <FileUpIcon className="size-6 text-muted" aria-hidden />
                <span className="text-sm font-medium">
                  {fileName ? fileName : "Choose a CSV file"}
                </span>
                <span className="text-xs text-muted">
                  {fileName ? "Tap to choose a different file" : "Or drop it here"}
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void readFile(file);
                  }}
                />
              </label>

              <TextField fullWidth value={pastedText} onChange={handlePaste}>
                <Label>Or paste CSV text</Label>
                <TextArea
                  rows={4}
                  className="font-mono text-xs"
                  placeholder={"Robot tips over in a match,yes,Each picked robot that tips over\nDeep climb in a playoff match,no"}
                />
                <Description>One category on each line. A header row is optional.</Description>
              </TextField>

              <a
                href={TEMPLATE_HREF}
                download="categories-template.csv"
                className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-medium text-accent"
              >
                <DownloadIcon className="size-4" aria-hidden />
                Download a template
              </a>

              {fileError ? (
                <p role="alert" className="flex gap-2 rounded-2xl bg-danger-soft p-3 text-sm text-danger-soft-foreground">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {fileError}
                </p>
              ) : null}

              {rows.length > 0 ? (
                <section aria-label="Preview" className="flex flex-col gap-2">
                  <p className="text-sm" aria-live="polite">
                    <span className="font-semibold text-success">{validRows.length} ready</span>
                    {problemRows > 0 ? (
                      <>
                        {" · "}
                        <span className="font-semibold text-warning">
                          {problemRows} {problemRows === 1 ? "row" : "rows"} skipped
                        </span>
                      </>
                    ) : null}
                  </p>
                  <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border">
                    {rows.map((row) => {
                      const ok = row.errors.length === 0;
                      return (
                        <li key={row.line} className={cn("flex gap-3 px-3 py-2.5", !ok && "bg-warning-soft/40")}>
                          {ok ? (
                            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-label="Ready" />
                          ) : (
                            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Skipped" />
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium break-words">
                                {row.text || <span className="text-muted italic">No category text</span>}
                              </span>
                              <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                                {row.isGlobal ? <Globe2Icon className="size-3" aria-hidden /> : null}
                                {row.isGlobal ? "Global" : "Season"} · row {row.line}
                              </span>
                            </div>
                            {row.scoringDescription ? (
                              <span className="line-clamp-2 text-xs text-muted">{row.scoringDescription}</span>
                            ) : null}
                            {row.errors.map((error) => (
                              <span key={error} className="text-xs font-medium text-warning">
                                {error}
                              </span>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </Modal.Body>

            <Modal.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                isDisabled={isImporting}
                onPress={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                isDisabled={validRows.length === 0}
                isPending={isImporting}
                onPress={() => void handleImport()}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {validRows.length === 0
                      ? "Import"
                      : `Import ${validRows.length} ${validRows.length === 1 ? "category" : "categories"}`}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
