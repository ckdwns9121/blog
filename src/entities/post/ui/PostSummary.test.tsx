import { render, screen } from "@testing-library/react";
import { PostSummary } from "./PostSummary";

describe("PostSummary", () => {
  it("shows the excerpt inside a labeled summary block", () => {
    render(<PostSummary summary="JavaScript는 싱글스레드인데 왜 레이스컨디션이 발생할까?" />);

    const region = screen.getByRole("region", { name: "글 요약" });
    expect(region).toHaveTextContent("요약");
    expect(region).toHaveTextContent("JavaScript는 싱글스레드인데 왜 레이스컨디션이 발생할까?");
  });

  it("renders nothing when the excerpt is empty", () => {
    const { container } = render(<PostSummary summary="  " />);

    expect(container).toBeEmptyDOMElement();
  });
});
