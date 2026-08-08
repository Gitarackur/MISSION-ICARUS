import { useMemo, useState } from "react";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType2,
  Braces,
  Table2,
  Database,
  Download,
} from "lucide-react";
import SlidingSheet from "@/ui/design-system/Sheet/main";
import { Button } from "@/ui/design-system/Button";
import { Checkbox } from "@/ui/design-system/Checkbox";
import { SelectionCard } from "@/ui/design-system/SelectionCard";
import SingleSelect from "@/ui/design-system/Select/select";
import { useAppSettings } from "@/ui/settings/use-app-settings";
import { DELIMITER_LABELS, EXPORT_SCOPE_LABELS } from "@/ui/settings/settings.types";
import { exportSheetStyles } from "../variants/settings.variants";
import {
  EXPORT_FORMAT_INFO,
  ExportFormat,
  buildSessionExport,
  downloadTextFile,
  serializeActiveMatrix,
  toFilenameSlug,
} from "@/app-layer/shared/exporter";
import type { CsvDelimiter, ExportScope } from "@/ui/settings/settings.types";
import type { ExportViewProps } from "../types/index.types";

const EXPORT_FORMATS = Object.keys(EXPORT_FORMAT_INFO) as ExportFormat[];

const FORMAT_ICONS: Record<ExportFormat, typeof FileJson> = {
  json: FileJson,
  csv: FileSpreadsheet,
  tsv: FileType2,
  txt: FileText,
  xml: Braces,
  md: Table2,
  sql: Database,
};

const DELIMITER_FORMATS: ExportFormat[] = ["csv", "tsv", "txt"];

const ExportSheet = ({
  isOpen,
  onClose,
  rows,
  columns,
  session,
}: ExportViewProps) => {
  const styles = exportSheetStyles();
  const {
    settings,
    setDelimiter,
    setIncludeHeaders,
    setIncludeMetadataColumns,
  } = useAppSettings();
  const [scope, setScope] = useState<ExportScope>(settings.exportScope);
  const [format, setFormat] = useState<ExportFormat>(
    settings.defaultExportFormat
  );

  const availableFormats = useMemo<ExportFormat[]>(
    () => (scope === "session" ? ["json"] : EXPORT_FORMATS),
    [scope]
  );

  const showDelimiter = DELIMITER_FORMATS.includes(format);
  const showHeadersAndFlags = format !== "json" && format !== "xml";

  const hasData = (scope === "session" && !!session) || rows.length > 0;

  const handleExport = () => {
    if (scope === "session") {
      if (!session) return;
      const filename = `icarus-${toFilenameSlug(session.name || "session")}.json`;
      downloadTextFile(
        filename,
        "application/json",
        JSON.stringify(buildSessionExport(session), null, 2)
      );
      onClose();
      return;
    }

    if (rows.length === 0) return;

    const file = serializeActiveMatrix(rows, columns, format, {
      delimiter: settings.delimiter,
      includeHeaders: settings.includeHeaders,
      includeMetadataColumns: settings.includeMetadataColumns,
    });
    downloadTextFile(file.filename, file.mime, file.content);
    onClose();
  };

  const scopeOptions = (
    Object.keys(EXPORT_SCOPE_LABELS) as ExportScope[]
  ).map((key) => ({ value: key, label: EXPORT_SCOPE_LABELS[key] }));

  const delimiterOptions = (
    Object.keys(DELIMITER_LABELS) as CsvDelimiter[]
  ).map((key) => ({ value: key, label: DELIMITER_LABELS[key] }));

  return (
    <SlidingSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Export"
      position="right"
      sidebarWidth="0px"
    >
      <div className={styles.container()}>
        <section className={styles.section()}>
          <h3 className={styles.sectionTitle()}>What to export</h3>
          <SingleSelect
            value={scope}
            onChange={(value) => setScope((value ?? "active") as ExportScope)}
            options={scopeOptions}
            placeholder="Choose export scope"
            label="Export scope"
            searchable={false}
          />
        </section>

        <section className={styles.section()}>
          <h3 className={styles.sectionTitle()}>Format</h3>
          <div
            className={styles.grid()}
            role="group"
            aria-label="Export format"
          >
            {availableFormats.map((fmt) => {
              const Icon = FORMAT_ICONS[fmt];
              const info = EXPORT_FORMAT_INFO[fmt];
              return (
                <SelectionCard
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  selected={format === fmt}
                  icon={<Icon />}
                  label={info.label}
                  description={info.description}
                  title={info.description}
                />
              );
            })}
          </div>
        </section>

        {showDelimiter && (
          <section className={styles.section()}>
            <SingleSelect
              value={settings.delimiter}
              onChange={(value) => value && setDelimiter(value as CsvDelimiter)}
              options={delimiterOptions}
              label="Delimiter"
              placeholder="Choose delimiter"
              searchable={false}
            />
          </section>
        )}

        {showHeadersAndFlags && (
          <section className={styles.section()}>
            <h3 className={styles.sectionTitle()}>Options</h3>
            <div className="flex flex-col gap-3">
              <Checkbox
                checked={settings.includeHeaders}
                onChange={(event) => setIncludeHeaders(event.target.checked)}
                label="Include header row"
              />
              <Checkbox
                checked={settings.includeMetadataColumns}
                onChange={(event) =>
                  setIncludeMetadataColumns(event.target.checked)
                }
                label="Include metadata columns"
              />
            </div>
          </section>
        )}

        <div className={styles.actionRow()}>
          <Button
            variant="primary"
            className={styles.exportButton()}
            onClick={handleExport}
            disabled={!hasData}
          >
            <Download className={styles.buttonIcon()} />
            Export {scope === "session" ? "session" : `${rows.length} rows`}
          </Button>
        </div>
      </div>
    </SlidingSheet>
  );
};

export default ExportSheet;
