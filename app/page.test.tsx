import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it('renders the "Coming Soon" overline above the title', () => {
    render(<Home />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("renders the page heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/the heights/i);
    expect(heading).toHaveTextContent(/rooted/i);
  });
});
