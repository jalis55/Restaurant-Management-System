import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/components/protected-route";

const useAuthMock = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

function renderProtectedRoute(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/operations/billing/:orderId" element={<div>Billing Detail Allowed</div>} />
          <Route path="/staff/orders/new" element={<div>Waiter Home</div>} />
        </Route>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route path="/" element={<div>Dashboard Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("redirects unauthenticated users to login", async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderProtectedRoute("/operations/billing/12");

    expect(await screen.findByText("Login Screen")).toBeInTheDocument();
  });

  it("allows admin access to the billing detail route", async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: "admin" },
    });

    renderProtectedRoute("/operations/billing/12");

    expect(await screen.findByText("Billing Detail Allowed")).toBeInTheDocument();
  });

  it("redirects waiter away from billing detail route", async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: "waiter" },
    });

    renderProtectedRoute("/operations/billing/12");

    expect(await screen.findByText("Waiter Home")).toBeInTheDocument();
  });
});
