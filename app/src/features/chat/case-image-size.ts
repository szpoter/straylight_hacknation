// Check encoded image dimensions before asking the browser to expand the pixels.
export function checkScanDimensions(bytes: Uint8Array, type: "image/png" | "image/jpeg") {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0, height = 0;
  if (type === "image/png" && bytes.length >= 24 && view.getUint32(12) === 0x49484452) {
    width = view.getUint32(16); height = view.getUint32(20);
  }
  if (type === "image/jpeg") {
    let pos = 2;
    while (pos + 4 <= bytes.length && bytes[pos] === 255) {
      while (bytes[pos] === 255) pos++;
      const marker = bytes[pos++];
      if (marker === 0xda || marker === 0xd9 || pos + 2 > bytes.length) break;
      const size = view.getUint16(pos);
      if (size < 2 || pos + size > bytes.length) break;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && size >= 8) {
        height = view.getUint16(pos + 3); width = view.getUint16(pos + 5);
        break;
      }
      pos += size;
    }
  }
  if (!width || !height) throw new Error("Ten plik ma nieczytelny nagłówek obrazu.");
  if (width * height > 16_000_000) throw new Error("Wybierz skan do 16 megapikseli lub zmniejsz rozdzielczość zdjęcia.");
}
