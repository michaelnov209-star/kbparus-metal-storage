/**
 * importMap для Payload admin UI.
 *
 * Этот файл сообщает Payload, какие client-компоненты подгружать в админке.
 * Обычно генерируется командой `payload generate:importmap`, но в нашем
 * setup (Windows + tsx ESM + path with spaces) CLI падает с
 * ERR_MODULE_NOT_FOUND. Поэтому ведём вручную.
 *
 * Если в payload.config.ts добавили новый плагин или RichText feature —
 * добавь сюда соответствующий импорт.
 */

// vercelBlobStorage plugin → handler загрузки в Blob прямо из браузера
import { VercelBlobClientUploadHandler as VercelBlobClientUploadHandler_default } from "@payloadcms/storage-vercel-blob/client";

// Lexical editor (на случай если где-то появится richText поле)
import { RscEntryLexicalCell as RscEntryLexicalCell_default } from "@payloadcms/richtext-lexical/rsc";
import { RscEntryLexicalField as RscEntryLexicalField_default } from "@payloadcms/richtext-lexical/rsc";
import { LexicalDiffComponent as LexicalDiffComponent_default } from "@payloadcms/richtext-lexical/rsc";

export const importMap = {
  "@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler":
    VercelBlobClientUploadHandler_default,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_default,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_default,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_default,
};
