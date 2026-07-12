import { randomUUID } from "node:crypto";
import * as nodeFileSystem from "node:fs/promises";
import path from "node:path";
import type { BlogPost } from "../src/entities/post/model";
import {
  createSearchDocuments,
  parseSearchDocuments,
  type SearchDocument,
} from "../src/features/search/model/searchDocument";

export interface SearchIndexFileSystem {
  mkdir(path: string, options: { recursive: true }): Promise<unknown>;
  rm(path: string, options: { force: true }): Promise<void>;
  writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
}

interface PublishSearchIndexOptions {
  fileSystem?: SearchIndexFileSystem;
  serialize?: (documents: readonly SearchDocument[]) => string;
  createTempPath?: (outputPath: string) => string;
}

const defaultFileSystem: SearchIndexFileSystem = nodeFileSystem;
export const MAX_SEARCH_INDEX_BYTES = 1024 * 1024;

export function getSearchIndexPath(cwd = process.cwd()): string {
  return path.join(cwd, "public", "search-index.json");
}

function defaultTempPath(outputPath: string): string {
  return path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.${randomUUID()}.tmp`);
}

export async function removeSearchIndex(
  outputPath = getSearchIndexPath(),
  fileSystem: SearchIndexFileSystem = defaultFileSystem,
): Promise<void> {
  await fileSystem.rm(outputPath, { force: true });
}

async function removeFailedOutput(
  fileSystem: SearchIndexFileSystem,
  tempPath: string,
  outputPath: string,
): Promise<void> {
  const results = await Promise.allSettled([
    fileSystem.rm(tempPath, { force: true }),
    fileSystem.rm(outputPath, { force: true }),
  ]);
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (failures.length > 0) {
    throw new AggregateError(failures, "Search index cleanup was incomplete");
  }
}

export async function publishSearchIndex(
  posts: readonly BlogPost[],
  outputPath = getSearchIndexPath(),
  options: PublishSearchIndexOptions = {},
): Promise<SearchDocument[]> {
  const fileSystem = options.fileSystem || defaultFileSystem;
  const serialize = options.serialize || JSON.stringify;
  const tempPath = (options.createTempPath || defaultTempPath)(outputPath);

  try {
    if (posts.length === 0) {
      throw new Error("Cannot publish an empty search index");
    }

    const documents = parseSearchDocuments(createSearchDocuments(posts));
    const payload = serialize(documents);
    if (typeof payload !== "string") {
      throw new Error("Search index serialization did not return a string");
    }
    const payloadBytes = Buffer.byteLength(payload, "utf8");
    if (payloadBytes > MAX_SEARCH_INDEX_BYTES) {
      throw new Error(
        `Search index is ${payloadBytes} bytes, exceeding the ${MAX_SEARCH_INDEX_BYTES}-byte budget`,
      );
    }

    await fileSystem.mkdir(path.dirname(outputPath), { recursive: true });
    await fileSystem.writeFile(tempPath, payload, "utf8");
    await fileSystem.rename(tempPath, outputPath);

    return documents;
  } catch (error) {
    try {
      await removeFailedOutput(fileSystem, tempPath, outputPath);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Search index publication failed and cleanup was incomplete",
      );
    }
    throw error;
  }
}
