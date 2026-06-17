import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HearFromUs from "./HearFromUs";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const openModal = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /hear from us/i }));
  return screen.getByRole("dialog");
};

const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
) => {
  await user.type(within(dialog).getByLabelText(/first name/i), "Nancy");
  await user.type(within(dialog).getByLabelText(/last name/i), "Almodovar");
  await user.type(within(dialog).getByLabelText(/email/i), "nancy@example.com");
};

describe("HearFromUs", () => {
  it("does not render the modal until the trigger is clicked", () => {
    render(<HearFromUs />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the modal with the form when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<HearFromUs />);
    const dialog = await openModal(user);
    expect(within(dialog).getByText(/hear from us\./i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/first name/i)).toBeInTheDocument();
  });

  it("submits the captured fields (plus signupUrl) and shows the success state", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const user = userEvent.setup();
    render(<HearFromUs />);
    const dialog = await openModal(user);

    await fillRequiredFields(user, dialog);
    await user.type(within(dialog).getByLabelText(/phone/i), "7135551234");
    await user.click(within(dialog).getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/subscribe");
    expect(init.method).toBe("POST");
    const payload = JSON.parse(init.body as string);
    expect(payload).toMatchObject({
      firstName: "Nancy",
      lastName: "Almodovar",
      email: "nancy@example.com",
      phone: "7135551234",
    });
    // Captured automatically from the browser location.
    expect(typeof payload.signupUrl).toBe("string");
    expect(payload.signupUrl.length).toBeGreaterThan(0);

    expect(await screen.findByText(/thank you\./i)).toBeInTheDocument();
  });

  it("shows the server error message and keeps the form when submission fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Valid email is required" }),
    });
    const user = userEvent.setup();
    render(<HearFromUs />);
    const dialog = await openModal(user);

    await fillRequiredFields(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/valid email is required/i)).toBeInTheDocument();
    // Still on the form (no success state).
    expect(screen.queryByText(/thank you\./i)).toBeNull();
  });

  it("surfaces a generic error when the request throws (network failure)", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));
    const user = userEvent.setup();
    render(<HearFromUs />);
    const dialog = await openModal(user);

    await fillRequiredFields(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

  it("closes the modal on Escape", async () => {
    const user = userEvent.setup();
    render(<HearFromUs />);
    await openModal(user);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
