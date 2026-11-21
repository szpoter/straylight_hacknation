import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  ZAM_CELL,
  ZAM_MAP,
  ZAM_ROW_HEIGHT,
  ZAM_TEMPLATE_SHA256,
  type CellsSlot,
  type TextSlot,
  type ZamSlot,
  type ZamValues,
} from "./zam-map";

/** The template is not the file the map was measured on: the export waits for a map review. */
export class TemplateMismatchError extends Error {
  constructor(public readonly actual: string) {
    super(`ZAM template checksum ${actual} does not match the reviewed map ${ZAM_TEMPLATE_SHA256}`);
    this.name = "TemplateMismatchError";
  }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Blue ink, as the form asks for black or blue. */
const INK = rgb(0.06, 0.16, 0.48);

function drawCells(page: PDFPage, font: PDFFont, slot: CellsSlot, value: string) {
  const size = 11;
  const chars = [...value].slice(0, slot.count);
  chars.forEach((ch, i) => {
    const width = font.widthOfTextAtSize(ch, size);
    page.drawText(ch, {
      x: slot.x + i * ZAM_CELL + (ZAM_CELL - width) / 2,
      y: slot.y + (ZAM_ROW_HEIGHT - size * 0.72) / 2,
      size,
      font,
      color: INK,
    });
  });
}

function fitSize(font: PDFFont, text: string, maxWidth: number, start: number): number {
  let size = start;
  while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function drawText(page: PDFPage, font: PDFFont, slot: TextSlot, value: string) {
  const lines = value.split("\n").slice(0, slot.lines ?? 1);
  if (lines.length === 1) {
    const size = fitSize(font, lines[0], slot.w - 8, 10.5);
    const width = font.widthOfTextAtSize(lines[0], size);
    page.drawText(lines[0], {
      x: slot.align === "center" ? slot.x + (slot.w - width) / 2 : slot.x + 4,
      y: slot.y + (slot.h - size * 0.72) / 2,
      size,
      font,
      color: INK,
    });
    return;
  }
  const size = Math.min(...lines.map((line) => fitSize(font, line, slot.w - 8, 10)));
  const leading = size * 1.3;
  lines.forEach((line, i) => {
    page.drawText(line, { x: slot.x + 4, y: slot.y + slot.h - 4 - size - i * leading, size, font, color: INK });
  });
}

export interface FillOptions {
  /** Small note in the top margin of page 1, e.g. that the data is fictional. */
  marginNote?: string;
}

/**
 * Draws the values on a copy of the official template. The template stays unchanged otherwise:
 * no fields are added and nothing is flattened, so the printout is the ZUS form itself.
 */
export async function fillZam(
  template: Uint8Array,
  fontBytes: Uint8Array,
  values: ZamValues,
  options: FillOptions = {},
): Promise<Uint8Array> {
  const actual = await sha256Hex(template);
  if (actual !== ZAM_TEMPLATE_SHA256) throw new TemplateMismatchError(actual);

  const pdf = await PDFDocument.load(template);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const pages = pdf.getPages();

  for (const [name, value] of Object.entries(values) as [ZamSlot, string][]) {
    if (!value) continue;
    const slot = ZAM_MAP[name];
    const page = pages[slot.page - 1];
    if (slot.type === "cells") drawCells(page, font, slot, value);
    else if (slot.type === "text") drawText(page, font, slot, value);
    else {
      const size = 14;
      const width = font.widthOfTextAtSize("X", size);
      page.drawText("X", {
        x: slot.x + (ZAM_CELL - width) / 2,
        y: slot.y + (ZAM_ROW_HEIGHT - size * 0.72) / 2,
        size,
        font,
        color: INK,
      });
    }
  }

  if (options.marginNote) {
    const first = pages[0];
    const size = 7;
    const width = font.widthOfTextAtSize(options.marginNote, size);
    first.drawText(options.marginNote, {
      x: (first.getWidth() - width) / 2,
      y: first.getHeight() - 12,
      size,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
  }
  pdf.setTitle("ZAM · wniosek o zasiłek macierzyński (wypełniony w Zusiku)");
  return pdf.save();
}
