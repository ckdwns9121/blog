import fs from "fs";
import path from "path";
import sharp from "sharp";
import { convertPostImages } from "./convertImages";

const TEST_POST_SLUG = "convert-images-test";
const TEST_IMAGE_URL = "https://example.com/image.png";
const originalFetch = global.fetch;

describe("convertPostImages", () => {
  const outputDir = path.join(process.cwd(), "public", "images", TEST_POST_SLUG);

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
    jest.restoreAllMocks();
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      Reflect.deleteProperty(global, "fetch");
    }
  });

  it("stores intrinsic dimensions with the optimized image path", async () => {
    const imageBuffer = await sharp({
      create: { width: 1, height: 1, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();
    const arrayBuffer = imageBuffer.buffer.slice(
      imageBuffer.byteOffset,
      imageBuffer.byteOffset + imageBuffer.byteLength
    ) as ArrayBuffer;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => arrayBuffer }) as typeof fetch;

    const mapping = await convertPostImages(TEST_POST_SLUG, [TEST_IMAGE_URL]);

    expect(mapping.get(TEST_IMAGE_URL)).toEqual({
      src: `/images/${TEST_POST_SLUG}/1.webp`,
      width: 1,
      height: 1,
    });
  });
});
