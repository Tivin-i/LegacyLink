import type { Page } from "@playwright/test";

/**
 * Install an in-memory implementation of the File System Access API.
 * The last file written via `showSaveFilePicker` is exposed on
 * `window.__e2eLastVaultBytes` as a number[] so tests can capture the
 * encrypted vault bytes and re-upload them in later flows.
 */
export async function mockFileSystemAccess(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Chunk = Uint8Array;

    function toBytes(data: unknown): Uint8Array {
      if (data instanceof Uint8Array) return data;
      if (typeof data === "string") return new TextEncoder().encode(data);
      if (data instanceof ArrayBuffer) return new Uint8Array(data);
      if (
        data &&
        typeof data === "object" &&
        "data" in (data as Record<string, unknown>)
      ) {
        return toBytes((data as { data: unknown }).data);
      }
      throw new Error("Unsupported write chunk type in E2E FS mock");
    }

    class MockFileHandle {
      readonly kind = "file";
      name = "legacylink-vault.json";
      _data: Uint8Array = new Uint8Array();

      async getFile(): Promise<File> {
        return new File([this._data], this.name, { type: "application/json" });
      }

      async createWritable(): Promise<FileSystemWritableFileStream> {
        const chunks: Chunk[] = [];
        const finish = (buf: Uint8Array) => {
          this._data = buf;
          const w = window as unknown as { __e2eLastVaultBytes: number[] };
          w.__e2eLastVaultBytes = Array.from(buf);
        };
        const stream = {
          async write(data: unknown) {
            if (
              data &&
              typeof data === "object" &&
              "type" in (data as Record<string, unknown>)
            ) {
              const rec = data as { type: string; data?: unknown };
              if (rec.type === "write" && rec.data !== undefined) {
                chunks.push(toBytes(rec.data));
                return;
              }
              if (rec.type === "truncate" || rec.type === "seek") {
                return;
              }
            }
            chunks.push(toBytes(data));
          },
          async close() {
            let total = 0;
            for (const c of chunks) total += c.length;
            const buf = new Uint8Array(total);
            let offset = 0;
            for (const c of chunks) {
              buf.set(c, offset);
              offset += c.length;
            }
            finish(buf);
          },
          async seek() {},
          async truncate() {},
          async abort() {},
        };
        return stream as unknown as FileSystemWritableFileStream;
      }

      async isSameEntry() {
        return false;
      }
    }

    const w = window as unknown as {
      showSaveFilePicker: () => Promise<FileSystemFileHandle>;
      showOpenFilePicker: () => Promise<FileSystemFileHandle[]>;
    };
    w.showSaveFilePicker = async () =>
      new MockFileHandle() as unknown as FileSystemFileHandle;
    w.showOpenFilePicker = async () => [
      new MockFileHandle() as unknown as FileSystemFileHandle,
    ];
  });
}

/**
 * Force the app to use the file-input fallback path by removing the File
 * System Access API from `window` before any app code runs.
 */
export async function disableFileSystemAccess(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    delete w.showSaveFilePicker;
    delete w.showOpenFilePicker;
  });
}

/** Retrieve the encrypted vault bytes captured by the FS mock. */
export async function getCapturedVaultBytes(page: Page): Promise<Uint8Array> {
  const arr = await page.evaluate(() => {
    const w = window as unknown as { __e2eLastVaultBytes?: number[] };
    return w.__e2eLastVaultBytes ?? null;
  });
  if (!arr) throw new Error("No vault bytes captured by FS mock");
  return new Uint8Array(arr);
}
