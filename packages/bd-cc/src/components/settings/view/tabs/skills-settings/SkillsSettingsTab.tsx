import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, RefreshCw, GitBranch, Loader2, ShieldAlert, ExternalLink, BookOpen, Sparkles } from "lucide-react";
import { useSkills } from "../../../../../contexts/SkillsContext";
import type { Skill } from "../../../../../contexts/SkillsContext";

/* ─── Toggle Switch ─────────────────────────────────────────────────────── */
function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <label className="relative inline-flex cursor-pointer select-none items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <div
        className={`
          relative h-5 w-9 rounded-full bg-muted transition-colors
          duration-200 after:absolute
          after:left-[2px] after:top-[2px] after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200
          after:content-[''] peer-checked:bg-violet-500
          peer-checked:after:translate-x-4
        `}
      />
    </label>
  );
}

/* ─── Skill Card ───────────────────────────────────────────────────────── */
type SkillCardProps = {
  skill: Skill;
  index: number;
  onToggle: (enabled: boolean) => void;
  onUpdate: () => void;
  onUninstall: () => void;
  updating: boolean;
  confirmingUninstall: boolean;
  onCancelUninstall: () => void;
  updateError: string | null;
};

function SkillCard({
  skill,
  index,
  onToggle,
  onUpdate,
  onUninstall,
  updating,
  confirmingUninstall,
  onCancelUninstall,
  updateError,
}: SkillCardProps) {
  const { t } = useTranslation("settings");
  const accentColor = skill.enabled ? "bg-violet-500" : "bg-muted-foreground/20";

  return (
    <div
      className="relative flex overflow-hidden rounded-lg border border-border bg-card transition-opacity duration-200"
      style={{
        opacity: skill.enabled ? 1 : 0.65,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Left accent bar */}
      <div className={`w-[3px] flex-shrink-0 ${accentColor} transition-colors duration-300`} />

      <div className="min-w-0 flex-1 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold leading-none text-foreground">{skill.displayName}</span>
                {skill.isSymlink && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    {t("skillSettings.symlink")}
                  </span>
                )}
              </div>
              {skill.description && (
                <p className="mt-1 text-sm leading-snug text-muted-foreground line-clamp-2">{skill.description}</p>
              )}
              <div className="mt-1 flex items-center gap-3">
                {skill.repoUrl && (
                  <a
                    href={skill.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <GitBranch className="h-3 w-3" />
                    <span className="max-w-[200px] truncate">
                      {skill.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={onUpdate}
              disabled={updating || !skill.repoUrl}
              title={skill.repoUrl ? t("skillSettings.pullLatest") : t("skillSettings.noGitRemote")}
              aria-label={t("skillSettings.pullLatest")}
              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={onUninstall}
              title={confirmingUninstall ? t("skillSettings.confirmUninstall") : t("skillSettings.uninstallSkill")}
              aria-label={t("skillSettings.uninstallSkill")}
              className={`rounded p-1.5 transition-colors ${
                confirmingUninstall
                  ? "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                  : "text-muted-foreground hover:bg-muted hover:text-red-500"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <ToggleSwitch
              checked={skill.enabled}
              onChange={onToggle}
              ariaLabel={`${skill.enabled ? t("skillSettings.disable") : t("skillSettings.enable")} ${skill.displayName}`}
            />
          </div>
        </div>

        {/* Confirm uninstall banner */}
        {confirmingUninstall && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800/50 dark:bg-red-950/30">
            <span className="text-sm text-red-600 dark:text-red-400">
              {t("skillSettings.confirmUninstallMessage", { name: skill.displayName })}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={onCancelUninstall}
                className="rounded border border-border px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t("skillSettings.cancel")}
              </button>
              <button
                onClick={onUninstall}
                className="rounded border border-red-300 px-2.5 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                {t("skillSettings.remove")}
              </button>
            </div>
          </div>
        )}

        {/* Update error */}
        {updateError && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{updateError}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function SkillsSettingsTab() {
  const { t } = useTranslation("settings");
  const { skills, loading, installSkill, uninstallSkill, updateSkill, toggleSkill } = useSkills();

  const [gitUrl, setGitUrl] = useState("");
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null);
  const [updatingSkills, setUpdatingSkills] = useState<Set<string>>(new Set());
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const handleUpdate = async (name: string) => {
    setUpdatingSkills((prev) => new Set(prev).add(name));
    setUpdateErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    const result = await updateSkill(name);
    if (!result.success) {
      setUpdateErrors((prev) => ({
        ...prev,
        [name]: result.error || t("skillSettings.updateFailed"),
      }));
    }
    setUpdatingSkills((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleInstall = async () => {
    if (!gitUrl.trim()) return;
    setInstalling(true);
    setInstallError(null);
    const result = await installSkill(gitUrl.trim());
    if (result.success) {
      setGitUrl("");
    } else {
      setInstallError(result.error || t("skillSettings.installFailed"));
    }
    setInstalling(false);
  };

  const handleUninstall = async (name: string) => {
    if (confirmUninstall !== name) {
      setConfirmUninstall(name);
      return;
    }
    const result = await uninstallSkill(name);
    if (result.success) {
      setConfirmUninstall(null);
    } else {
      setInstallError(result.error || t("skillSettings.uninstallFailed"));
      setConfirmUninstall(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="mb-1 text-base font-semibold text-foreground">{t("skillSettings.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("skillSettings.description")}</p>
      </div>

      {/* Install from Git — compact */}
      <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-border bg-card">
        <span className="flex-shrink-0 pl-3 pr-1 text-muted-foreground/40">
          <GitBranch className="h-3.5 w-3.5" />
        </span>
        <input
          type="text"
          value={gitUrl}
          onChange={(e) => {
            setGitUrl(e.target.value);
            setInstallError(null);
          }}
          placeholder={t("skillSettings.installPlaceholder")}
          aria-label={t("skillSettings.installAriaLabel")}
          className="flex-1 bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleInstall();
          }}
        />
        <button
          onClick={handleInstall}
          disabled={installing || !gitUrl.trim()}
          className="flex-shrink-0 border-l border-border bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : t("skillSettings.installButton")}
        </button>
      </div>

      {installError && <p className="-mt-4 text-sm text-red-500">{installError}</p>}

      <p className="-mt-4 flex items-start gap-1.5 text-xs leading-snug text-muted-foreground/50">
        <ShieldAlert className="mt-px h-3 w-3 flex-shrink-0" />
        <span>{t("skillSettings.securityWarning")}</span>
      </p>

      {/* Skills List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("skillSettings.scanningSkills")}
        </div>
      ) : skills.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("skillSettings.noSkillsInstalled")}</p>
      ) : (
        <div className="space-y-2">
          {skills.map((skill, index) => {
            const handleToggle = async (enabled: boolean) => {
              const r = await toggleSkill(skill.name, enabled);
              if (!r.success) {
                setInstallError(r.error || t("skillSettings.toggleFailed"));
              }
            };

            return (
              <SkillCard
                key={skill.name}
                skill={skill}
                index={index}
                onToggle={(enabled) => void handleToggle(enabled)}
                onUpdate={() => void handleUpdate(skill.name)}
                onUninstall={() => void handleUninstall(skill.name)}
                updating={updatingSkills.has(skill.name)}
                confirmingUninstall={confirmUninstall === skill.name}
                onCancelUninstall={() => setConfirmUninstall(null)}
                updateError={updateErrors[skill.name] ?? null}
              />
            );
          })}
        </div>
      )}

      {/* Learn more */}
      <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-2">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/60">{t("skillSettings.learnMore")}</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <a
            href="https://docs.anthropic.com/en/docs/claude-code/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            {t("skillSettings.docs")} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
