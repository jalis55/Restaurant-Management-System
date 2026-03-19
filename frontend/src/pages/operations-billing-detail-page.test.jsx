import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperationsBillingDetailPage } from "@/pages/operations-billing-detail-page";

const billOrderMock = vi.fn();
const listOrdersMock = vi.fn();
const getBillingSettingsMock = vi.fn();

vi.mock("@/lib/api", () => ({
  billOrder: (...args) => billOrderMock(...args),
  getBillingSettings: (...args) => getBillingSettingsMock(...args),
  listOrders: (...args) => listOrdersMock(...args),
}));

vi.mock("@/hooks/use-order-events", () => ({
  useOrderEvents: () => {},
}));

const servedOrder = {
  id: 27,
  order_number: "ORD-27",
  table_number: 8,
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
    {
      id: 1,
      menu_item_name: "Burger",
      quantity: 2,
      unit_price: "50.00",
      offer_percentage: "0.00",
      service_station: "kitchen",
    },
  ],
};

describe("OperationsBillingDetailPage", () => {
  beforeEach(() => {
    billOrderMock.mockResolvedValue({
      ...servedOrder,
      billed_at: "2026-03-19T10:30:00Z",
      discount_type: "amount",
      discount_value: "10.00",
      discount_amount: "10.00",
      final_amount: "105.00",
    });
    listOrdersMock.mockResolvedValue([servedOrder]);
    getBillingSettingsMock.mockResolvedValue({
      tax_percentage: "5.00",
      service_charge_percentage: "10.00",
    });
  });

  it("enables discount value when a manager selects a discount type", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/operations/billing/27"]}>
        <Routes>
          <Route path="/operations/billing" element={<div>Billing Queue</div>} />
          <Route path="/operations/billing/:orderId" element={<OperationsBillingDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Finalize Billing")).toBeInTheDocument();

    const discountTypeSelect = screen.getByLabelText("Discount type");
    const valueInput = screen.getByLabelText("Discount value");
    expect(valueInput).toBeDisabled();

    await user.selectOptions(discountTypeSelect, "amount");

    await waitFor(() => {
      expect(screen.getByLabelText("Discount type")).toHaveValue("amount");
      expect(screen.getByLabelText("Discount value")).not.toBeDisabled();
    });
  });

  it("submits the selected manager discount when finalizing", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/operations/billing/27"]}>
        <Routes>
          <Route path="/operations/billing" element={<div>Billing Queue</div>} />
          <Route path="/operations/billing/:orderId" element={<OperationsBillingDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Finalize Billing")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Discount type"), "amount");
    await user.clear(screen.getByLabelText("Discount value"));
    await user.type(screen.getByLabelText("Discount value"), "10.00");

    await waitFor(() => {
      expect(screen.getByLabelText("Discount type")).toHaveValue("amount");
      expect(screen.getByLabelText("Discount value")).toHaveValue(10);
    });

    fireEvent.click(screen.getByRole("button", { name: "Finalize bill" }));

    await waitFor(() => {
      expect(billOrderMock).toHaveBeenCalledWith(27, {
        discount_type: "amount",
        discount_value: "10",
      });
    });
  });
});
