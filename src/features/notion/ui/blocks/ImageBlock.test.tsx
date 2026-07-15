import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { getOptimizedImageData } from "../../../../shared/utils/imageMapper";
import { ImageBlock } from "./ImageBlock";

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    unoptimized,
    alt = "",
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) {
    void unoptimized;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  },
}));

jest.mock("../../../../shared/utils/imageMapper", () => ({
  getOptimizedImageData: jest.fn(),
}));

const mockGetOptimizedImageData = jest.mocked(getOptimizedImageData);

describe("ImageBlock", () => {
  it("fills the content width when optimized dimensions are unavailable", () => {
    mockGetOptimizedImageData.mockReturnValue({ src: "https://example.com/notion-image.png" });

    render(<ImageBlock url="https://example.com/notion-image.png" caption="fallback image" />);

    expect(screen.getByRole("img", { name: "fallback image" })).toHaveClass("w-full");
  });

  it("keeps the intrinsic width when optimized dimensions are available", () => {
    mockGetOptimizedImageData.mockReturnValue({
      src: "/images/post/1.webp",
      width: 640,
      height: 360,
    });

    render(<ImageBlock url="https://example.com/notion-image.png" caption="optimized image" />);

    const image = screen.getByRole("img", { name: "optimized image" });
    expect(image).not.toHaveClass("w-full");
    expect(image).toHaveStyle({ width: "640px" });
  });
});
