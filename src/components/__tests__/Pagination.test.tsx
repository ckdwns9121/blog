// Pagination 컴포넌트 테스트
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../components/Pagination";

describe("Pagination", () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it("페이지 버튼들이 렌더링되어야 한다", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

    expect(screen.getByText("이전")).toBeInTheDocument();
    expect(screen.getByText("다음")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("현재 페이지가 활성화되어야 한다", () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const currentPageButton = screen.getByText("3");
    expect(currentPageButton).toHaveClass("text-blue-600");
  });

  it("페이지 버튼 클릭 시 onPageChange를 호출해야 한다", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByText("4"));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it("이전 버튼 클릭 시 이전 페이지로 이동해야 한다", () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByText("이전"));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("다음 버튼 클릭 시 다음 페이지로 이동해야 한다", () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByText("다음"));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it("첫 번째 페이지에서는 이전 버튼이 비활성화되어야 한다", () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByText("이전");
    expect(prevButton).toBeDisabled();
  });

  it("마지막 페이지에서는 다음 버튼이 비활성화되어야 한다", () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByText("다음");
    expect(nextButton).toBeDisabled();
  });

  it("페이지가 많을 때 생략 표시가 나타나야 한다", () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

    expect(screen.getByText("...")).toBeInTheDocument();
  });

  it("페이지가 적을 때 모든 페이지 버튼이 보여야 한다", () => {
    render(<Pagination currentPage={2} totalPages={3} onPageChange={mockOnPageChange} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("...")).not.toBeInTheDocument();
  });
});
