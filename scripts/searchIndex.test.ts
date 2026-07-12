import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { BlogPost } from "../src/entities/post/model";
import { parseSearchDocuments } from "../src/features/search/model/searchDocument";
import {
  MAX_SEARCH_INDEX_BYTES,
  publishSearchIndex,
  removeSearchIndex,
  type SearchIndexFileSystem,
} from "./searchIndex";

function makePost(id = "post-1"): BlogPost {
  return {
    id,
    title: "Atomic search",
    slug: "atomic-search",
    excerpt: "Writer test",
    publishedAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    tags: [{ name: "build", slug: "build", postCount: 0 }],
    content: [{ id: "body", type: "text", richText: [{ plain_text: "complete body" }], fallbackText: "" }],
    toc: [],
  };
}

describe("search index publication", () => {
  let directory: string;
  let outputPath: string;
  let tempPath: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "blog-search-index-"));
    outputPath = path.join(directory, "search-index.json");
    tempPath = path.join(directory, ".search-index.test.tmp");
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it("writes a complete validated dataset to a sibling temp file and atomically renames it", async () => {
    const fileSystem: SearchIndexFileSystem = {
      mkdir: (target, options) => fs.mkdir(target, options),
      rm: (target, options) => fs.rm(target, options),
      writeFile: (target, data, encoding) => fs.writeFile(target, data, encoding),
      rename: jest.fn((oldPath, newPath) => fs.rename(oldPath, newPath)),
    };

    const documents = await publishSearchIndex([makePost()], outputPath, {
      fileSystem,
      createTempPath: () => tempPath,
    });

    expect(fileSystem.rename).toHaveBeenCalledWith(tempPath, outputPath);
    expect(parseSearchDocuments(JSON.parse(await fs.readFile(outputPath, "utf8")))).toEqual(documents);
    await expect(fs.stat(tempPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("removes the prior target before collection can begin", async () => {
    await fs.writeFile(outputPath, "stale", "utf8");

    await removeSearchIndex(outputPath);

    await expect(fs.stat(outputPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects serialization failure and leaves no stale final or temporary output", async () => {
    await fs.writeFile(outputPath, "stale", "utf8");
    await removeSearchIndex(outputPath);

    await expect(
      publishSearchIndex([makePost()], outputPath, {
        serialize: () => {
          throw new Error("serialization failed");
        },
        createTempPath: () => tempPath,
      }),
    ).rejects.toThrow("serialization failed");

    await expect(fs.stat(outputPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.stat(tempPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a payload that exceeds the public index budget", async () => {
    await expect(
      publishSearchIndex([makePost()], outputPath, {
        serialize: () => "x".repeat(MAX_SEARCH_INDEX_BYTES + 1),
        createTempPath: () => tempPath,
      }),
    ).rejects.toThrow("exceeding");

    await expect(fs.stat(outputPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.stat(tempPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each(["writeFile", "rename"] as const)(
    "cleans up and rejects when %s fails",
    async (failedOperation) => {
      const fileSystem: SearchIndexFileSystem = {
        mkdir: (target, options) => fs.mkdir(target, options),
        rm: (target, options) => fs.rm(target, options),
        writeFile:
          failedOperation === "writeFile"
            ? jest.fn(async () => {
                throw new Error("writeFile failed");
              })
            : (target, data, encoding) => fs.writeFile(target, data, encoding),
        rename:
          failedOperation === "rename"
            ? jest.fn(async () => {
                throw new Error("rename failed");
              })
            : (oldPath, newPath) => fs.rename(oldPath, newPath),
      };

      await expect(
        publishSearchIndex([makePost()], outputPath, {
          fileSystem,
          createTempPath: () => tempPath,
        }),
      ).rejects.toThrow(`${failedOperation} failed`);

      await expect(fs.stat(outputPath)).rejects.toMatchObject({ code: "ENOENT" });
      await expect(fs.stat(tempPath)).rejects.toMatchObject({ code: "ENOENT" });
    },
  );

  it("surfaces cleanup failure instead of hiding a possibly stale index", async () => {
    await fs.writeFile(outputPath, "stale", "utf8");
    const fileSystem: SearchIndexFileSystem = {
      mkdir: (target, options) => fs.mkdir(target, options),
      rm: async (target, options) => {
        if (target === outputPath) throw new Error("final cleanup failed");
        await fs.rm(target, options);
      },
      writeFile: async () => {
        throw new Error("write failed");
      },
      rename: (oldPath, newPath) => fs.rename(oldPath, newPath),
    };

    await expect(
      publishSearchIndex([makePost()], outputPath, {
        fileSystem,
        createTempPath: () => tempPath,
      }),
    ).rejects.toThrow("cleanup was incomplete");
  });

  it("rejects an empty dataset and removes any final-looking output", async () => {
    await fs.writeFile(outputPath, "stale", "utf8");

    await expect(
      publishSearchIndex([], outputPath, { createTempPath: () => tempPath }),
    ).rejects.toThrow("empty search index");

    await expect(fs.stat(outputPath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
