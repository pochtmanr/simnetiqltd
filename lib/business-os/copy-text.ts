/**
 * Clipboard copy that reports failure.
 * Same behaviour as Doppler admin: try navigator.clipboard, then legacy DOM.
 */

export interface CopyDeps {
  writeText?: ((value: string) => Promise<void>) | null;
  execCommand?: ((value: string) => boolean) | null;
}

export function legacyDomCopy(value: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok === true;
  } catch {
    return false;
  }
}

function browserWriteText(): ((value: string) => Promise<void>) | null {
  if (typeof navigator === "undefined") return null;
  return navigator.clipboard?.writeText?.bind(navigator.clipboard) ?? null;
}

export async function copyText(value: string, deps?: CopyDeps): Promise<boolean> {
  if (!value) return false;

  const writeText = deps ? deps.writeText : browserWriteText();
  const execCommand = deps ? deps.execCommand : legacyDomCopy;

  if (writeText) {
    try {
      await writeText(value);
      return true;
    } catch {
      // Webview refused; try legacy before admitting failure.
    }
  }

  if (!execCommand) return false;
  try {
    return execCommand(value) === true;
  } catch {
    return false;
  }
}
