/**
 * ZIP Bundler Archive Core
 *
 * Creates ZIP archives using the browser's native CompressionStream API.
 * Falls back to stored (uncompressed) ZIP format when CompressionStream is unavailable.
 *
 * This implementation follows the ZIP file format specification (PKZIP APPNOTE.TXT)
 * and produces valid ZIP archives without external dependencies.
 *
 * @see https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */

export interface ZipEntry {
  name: string;
  content: Blob | string;
  mimeType?: string;
}

type OwnedBytes = Uint8Array<ArrayBuffer>;
type BlobWithArrayBuffer = Blob & { arrayBuffer(): Promise<ArrayBuffer> };

interface ProcessedEntry {
  name: OwnedBytes;
  data: OwnedBytes;
  compressedData: OwnedBytes;
  crc32: number;
  compressionMethod: number;
  uncompressedSize: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16LE(arr: Uint8Array, offset: number, value: number): void {
  arr[offset] = value & 0xff;
  arr[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32LE(arr: Uint8Array, offset: number, value: number): void {
  arr[offset] = value & 0xff;
  arr[offset + 1] = (value >>> 8) & 0xff;
  arr[offset + 2] = (value >>> 16) & 0xff;
  arr[offset + 3] = (value >>> 24) & 0xff;
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function toOwnedUint8Array(data: Uint8Array): OwnedBytes {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy;
}

function hasArrayBuffer(blob: Blob): blob is BlobWithArrayBuffer {
  return typeof (blob as BlobWithArrayBuffer).arrayBuffer === "function";
}

function readBlobWithFileReader(blob: Blob): Promise<ArrayBuffer> {
  if (typeof FileReader === "undefined") {
    throw new Error("Blob reading is not supported in this environment");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Blob reader returned a non-ArrayBuffer result"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read Blob contents"));
    };
    reader.readAsArrayBuffer(blob);
  });
}

async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (hasArrayBuffer(blob)) return blob.arrayBuffer();
  if (typeof FileReader !== "undefined") return readBlobWithFileReader(blob);
  if (typeof Response !== "undefined") return new Response(blob).arrayBuffer();
  throw new Error("Blob reading is not supported in this environment");
}

function ensureBlobArrayBuffer(blob: Blob): Blob {
  if (hasArrayBuffer(blob)) return blob;
  const patchedBlob = blob as BlobWithArrayBuffer;
  patchedBlob.arrayBuffer = () => readBlobWithFileReader(blob);
  return patchedBlob;
}

function isCompressionStreamAvailable(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

async function compressDeflateRaw(data: Uint8Array): Promise<OwnedBytes> {
  const stream = new CompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  await writer.write(toOwnedUint8Array(data));
  await writer.close();

  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(toOwnedUint8Array(value));
    totalLength += value.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function buildLocalFileHeader(entry: ProcessedEntry): OwnedBytes {
  const header = new Uint8Array(30 + entry.name.length);
  writeUint32LE(header, 0, 0x04034b50);
  writeUint16LE(header, 4, 20);
  writeUint16LE(header, 6, 0x0800);
  writeUint16LE(header, 8, entry.compressionMethod);

  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

  writeUint16LE(header, 10, dosTime);
  writeUint16LE(header, 12, dosDate);
  writeUint32LE(header, 14, entry.crc32);
  writeUint32LE(header, 18, entry.compressedSize);
  writeUint32LE(header, 22, entry.uncompressedSize);
  writeUint16LE(header, 26, entry.name.length);
  writeUint16LE(header, 28, 0);
  header.set(entry.name, 30);
  return header;
}

function buildCentralDirectoryHeader(entry: ProcessedEntry): OwnedBytes {
  const header = new Uint8Array(46 + entry.name.length);
  writeUint32LE(header, 0, 0x02014b50);
  writeUint16LE(header, 4, 0x0314);
  writeUint16LE(header, 6, 20);
  writeUint16LE(header, 8, 0x0800);
  writeUint16LE(header, 10, entry.compressionMethod);

  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

  writeUint16LE(header, 12, dosTime);
  writeUint16LE(header, 14, dosDate);
  writeUint32LE(header, 16, entry.crc32);
  writeUint32LE(header, 20, entry.compressedSize);
  writeUint32LE(header, 24, entry.uncompressedSize);
  writeUint16LE(header, 28, entry.name.length);
  writeUint16LE(header, 30, 0);
  writeUint16LE(header, 32, 0);
  writeUint16LE(header, 34, 0);
  writeUint16LE(header, 36, 0);
  writeUint32LE(header, 38, 0);
  writeUint32LE(header, 42, entry.localHeaderOffset);
  header.set(entry.name, 46);
  return header;
}

function buildEndOfCentralDirectory(entryCount: number, centralDirectorySize: number, centralDirectoryOffset: number): OwnedBytes {
  const eocd = new Uint8Array(22);
  writeUint32LE(eocd, 0, 0x06054b50);
  writeUint16LE(eocd, 4, 0);
  writeUint16LE(eocd, 6, 0);
  writeUint16LE(eocd, 8, entryCount);
  writeUint16LE(eocd, 10, entryCount);
  writeUint32LE(eocd, 12, centralDirectorySize);
  writeUint32LE(eocd, 16, centralDirectoryOffset);
  writeUint16LE(eocd, 20, 0);
  return eocd;
}

export async function buildZip(entries: ZipEntry[]): Promise<Blob> {
  const useCompression = isCompressionStreamAvailable();
  const processedEntries: ProcessedEntry[] = [];
  let currentOffset = 0;

  for (const entry of entries) {
    try {
      const data =
        typeof entry.content === "string"
          ? toOwnedUint8Array(stringToUint8Array(entry.content))
          : new Uint8Array(await readBlobAsArrayBuffer(entry.content));
      const entryCrc32 = crc32(data);

      let compressedData: OwnedBytes;
      let compressionMethod: number;
      if (useCompression && data.length > 0) {
        compressedData = await compressDeflateRaw(data);
        if (compressedData.length < data.length) {
          compressionMethod = 8;
        } else {
          compressedData = data;
          compressionMethod = 0;
        }
      } else {
        compressedData = data;
        compressionMethod = 0;
      }

      const nameBytes = toOwnedUint8Array(stringToUint8Array(entry.name));
      processedEntries.push({
        name: nameBytes,
        data,
        compressedData,
        crc32: entryCrc32,
        compressionMethod,
        uncompressedSize: data.length,
        compressedSize: compressedData.length,
        localHeaderOffset: currentOffset,
      });
      currentOffset += 30 + nameBytes.length + compressedData.length;
    } catch (error) {
      throw new Error(
        `Failed to process ZIP entry "${entry.name}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const parts: BlobPart[] = [];
  for (const entry of processedEntries) {
    parts.push(buildLocalFileHeader(entry));
    parts.push(entry.compressedData);
  }

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;
  for (const entry of processedEntries) {
    const cdHeader = buildCentralDirectoryHeader(entry);
    parts.push(cdHeader);
    centralDirectorySize += cdHeader.length;
  }

  parts.push(
    buildEndOfCentralDirectory(
      processedEntries.length,
      centralDirectorySize,
      centralDirectoryOffset,
    ),
  );

  return ensureBlobArrayBuffer(new Blob(parts, { type: "application/zip" }));
}
