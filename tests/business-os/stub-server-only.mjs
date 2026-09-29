import { Module } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const empty = join(dirname(fileURLToPath(import.meta.url)), "empty-server-only.cjs");
const original = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "server-only") return empty;
  return original.call(this, request, parent, isMain, options);
};
