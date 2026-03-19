import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperationsBillingPage } from "@/pages/operations-billing-page";

const listOrdersMock = vi.fn();
const getBillingSettingsMock = vi.fn();

vi.mock("@/lib/api", () => ({
  getBillingSettings: (...args) => getBillingSettingsMock(...args),
  listOrders: (...args) => listOrdersMock(...args),
}));

vi.mock("@/hooks/use-order-events", () => ({
  useOrderEvents: () => {},
}));

const servedOrder = {
  id: 15,
  order_number: "ORD-15",
  table_number: 4,
  order_type: "dine_in",
  status: "served",
  created_by_name: "Waiter User",
  total_amount: "100.00",
  final_amount: "100.00",
  billed_at: null,
  discount_type: "none",
  discount_value: "0.00",
  discount_amount: "0.00",
  menu_offer_discount_amount: "0.00",
  tax_amount: "0.00",
  service_charge_amount: "0.00",
  items: [
    { id: 1, menu_item_name: "Burger", quantity: 2, unit_price: "50.00", offer_percentage: "0.00" },
  ],
};

describe("OperationsBillingPage", () => {
  beforeEach(() => {
    listOrdersMock.mockResolvedValue([servedOrder]);
    getBillingSettingsMock.mockResolvedValue({
      tax_percentage: "5.00",
      service_charge_percentage: "10.00",
    });
  });

  it("routes to the billing detail page when finalize is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/operations/billing"]}>
        <Routes>
          <Route path="/operations/billing" element={<OperationsBillingPage />} />
          <Route path="/operations/billing/:orderId" element={<div>Billing Detail Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("ORD-15 · Table 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finalize" }));

    await waitFor(() => {
      expect(screen.getByText("Billing Detail Page")).toBeInTheDocument();
    });
  });
});
