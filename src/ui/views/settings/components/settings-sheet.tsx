import { Monitor, Moon, Sun, RotateCcw, Save } from "lucide-react";
import SlidingSheet from "@/ui/design-system/Sheet/main";
import { Button } from "@/ui/design-system/Button";
import { Checkbox } from "@/ui/design-system/Checkbox";
import { SelectionCard } from "@/ui/design-system/SelectionCard";
import SingleSelect from "@/ui/design-system/Select/select";
import { useThemeMode } from "@/ui/theme/use-theme-mode";
import { useAppSettings } from "@/ui/settings/use-app-settings";
import { DELIMITER_LABELS, EXPORT_SCOPE_LABELS } from "@/ui/settings/settings.types";
import { EXPORT_FORMAT_INFO, ExportFormat } from "@/app-layer/shared/exporter";
import { settingsPanelStyles } from "../variants/settings.variants";
import { settingsButtonStyles } from "../variants/settings-buttons.variants";
import type { CsvDelimiter, ExportScope } from "@/ui/settings/settings.types";
import type { ThemeMode } from "@/ui/theme/types";
import type { SettingsViewProps } from "../types/index.types";
import { formatStorageBytes } from "@/app-layer/database/storage-health";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const ThemeModeControl = () => {
  const { mode, setMode } = useThemeMode();

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="group"
      aria-label="Color theme"
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <SelectionCard
            key={option.value}
            onClick={() => setMode(option.value as ThemeMode)}
            selected={mode === option.value}
            align="center"
            icon={<Icon />}
            label={option.label}
          />
        );
      })}
    </div>
  );
};

const SettingsSheet = ({
  isOpen,
  onClose,
  storageEstimate,
}: SettingsViewProps) => {
  const panel = settingsPanelStyles();
  const buttonStyles = settingsButtonStyles();
  const {
    settings: appSettings,
    setDefaultExportFormat,
    setDelimiter,
    setIncludeHeaders,
    setIncludeMetadataColumns,
    setExportScope,
    resetSettings,
  } = useAppSettings();

  const formatOptions = (
    Object.keys(EXPORT_FORMAT_INFO) as ExportFormat[]
  ).map((key) => ({
    value: key,
    label: EXPORT_FORMAT_INFO[key].label,
    description: EXPORT_FORMAT_INFO[key].description,
  }));

  const delimiterOptions = (
    Object.keys(DELIMITER_LABELS) as CsvDelimiter[]
  ).map((key) => ({ value: key, label: DELIMITER_LABELS[key] }));

  const scopeOptions = (
    Object.keys(EXPORT_SCOPE_LABELS) as ExportScope[]
  ).map((key) => ({ value: key, label: EXPORT_SCOPE_LABELS[key] }));

  return (
    <SlidingSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      position="right"
      sidebarWidth="0px"
    >
      <div className={panel.container()}>
        <section className={panel.section()}>
          <h3 className={panel.sectionTitle()}>Appearance</h3>
          <ThemeModeControl />
        </section>

        <section className={panel.section()}>
          <h3 className={panel.sectionTitle()}>Export &amp; Data</h3>
          <div className={panel.fieldGroup()}>
            <SingleSelect
              value={appSettings.defaultExportFormat}
              onChange={(value) =>
                value && setDefaultExportFormat(value as ExportFormat)
              }
              options={formatOptions}
              label="Default export format"
              placeholder="Choose default format"
              showDescriptions
            />
            <SingleSelect
              value={appSettings.delimiter}
              onChange={(value) => value && setDelimiter(value as CsvDelimiter)}
              options={delimiterOptions}
              label="Delimiter for CSV / text"
              placeholder="Choose delimiter"
              searchable={false}
            />
            <SingleSelect
              value={appSettings.exportScope}
              onChange={(value) => value && setExportScope(value as ExportScope)}
              options={scopeOptions}
              label="Default export scope"
              placeholder="Choose scope"
              searchable={false}
            />
            <div className={panel.optionsGroup()}>
              <Checkbox
                checked={appSettings.includeHeaders}
                onChange={(event) => setIncludeHeaders(event.target.checked)}
                label="Include header rows in exports"
              />
              <Checkbox
                checked={appSettings.includeMetadataColumns}
                onChange={(event) =>
                  setIncludeMetadataColumns(event.target.checked)
                }
                label="Include metadata columns"
              />
            </div>
          </div>
        </section>

        <section className={panel.section()}>
          <h3 className={panel.sectionTitle()}>Preferences</h3>
          <Button
            variant="secondary"
            className={buttonStyles.fullWidth()}
            onClick={resetSettings}
          >
            <RotateCcw className={buttonStyles.icon()} />
            Reset to defaults
          </Button>
        </section>

        <section className={panel.section()}>
          <h3 className={panel.sectionTitle()}>Local data storage</h3>
          {storageEstimate ? (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between gap-4">
                <span>{formatStorageBytes(storageEstimate.usage)} used</span>
                <span>{formatStorageBytes(storageEstimate.quota)} quota</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width]"
                  style={{
                    width: `${Math.min(100, storageEstimate.percentUsed)}%`,
                  }}
                />
              </div>
              <p>
                {storageEstimate.percentUsed.toFixed(1)}% used · Storage is {" "}
                {storageEstimate.persisted === null
                  ? "unreported"
                  : storageEstimate.persisted
                    ? "persistent"
                    : "best-effort"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Storage usage is unavailable in this environment.
            </p>
          )}
        </section>

        <section className={panel.actionRow()}>
          <Button
            variant="outline"
            className={buttonStyles.flexOne()}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="primary"
            className={buttonStyles.flexOne()}
            onClick={onClose}
          >
            <Save className={buttonStyles.icon()} />
            Done
          </Button>
        </section>
      </div>
    </SlidingSheet>
  );
};

export default SettingsSheet;
