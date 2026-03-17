const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function buildUrl(path, query) {
  if (!query) {
    return `${API_BASE_URL}${path}`;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
}

async function parseResponse(response) {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  return isJson ? response.json() : null;
}

async function rawRequest(path, options = {}) {
  const { query, headers, body, ...rest } = options;

  return fetch(buildUrl(path, query), {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });
}

async function apiRequest(path, options = {}, config = {}) {
  const { retryOnAuth = true } = config;
  const response = await rawRequest(path, options);

  if (response.status === 401 && retryOnAuth && !path.startsWith("/api/auth/")) {
    const refreshResponse = await rawRequest("/api/auth/token/refresh/", { method: "POST", body: {} });

    if (refreshResponse.ok) {
      const retried = await rawRequest(path, options);
      const retriedData = await parseResponse(retried);

      if (!retried.ok) {
        const error = new Error(retriedData?.detail || "Request failed.");
        error.status = retried.status;
        error.data = retriedData;
        throw error;
      }

      return retriedData;
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(data?.detail || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function login(credentials) {
  return apiRequest("/api/auth/token/", { method: "POST", body: credentials }, { retryOnAuth: false });
}

async function logout() {
  return apiRequest("/api/auth/logout/", { method: "POST", body: {} }, { retryOnAuth: false });
}

async function refreshSession() {
  return apiRequest("/api/auth/token/refresh/", { method: "POST", body: {} }, { retryOnAuth: false });
}

async function getCurrentUser() {
  return apiRequest("/api/auth/users/me/");
}

async function listUsers() {
  return apiRequest("/api/auth/users/");
}

async function createUser(payload) {
  return apiRequest("/api/auth/users/", { method: "POST", body: payload });
}

async function deleteUser(userId) {
  return apiRequest(`/api/auth/users/${userId}/`, { method: "DELETE" });
}

async function changePassword(payload) {
  return apiRequest("/api/auth/users/change_password/", { method: "POST", body: payload });
}

async function listOrders(query) {
  return apiRequest("/api/orders/", { query });
}

async function listActiveOrders() {
  return apiRequest("/api/orders/active/");
}

async function listKitchenOrders() {
  return apiRequest("/api/orders/kitchen/");
}

async function createOrder(payload) {
  return apiRequest("/api/orders/", { method: "POST", body: payload });
}

async function updateOrderStatus(orderId, status) {
  return apiRequest(`/api/orders/${orderId}/update_status/`, { method: "PATCH", body: { status } });
}

async function listReservations(query) {
  return apiRequest("/api/reservations/", { query });
}

async function listTodayReservations() {
  return apiRequest("/api/reservations/today/");
}

async function createReservation(payload) {
  return apiRequest("/api/reservations/", { method: "POST", body: payload });
}

async function updateReservation(reservationId, payload) {
  return apiRequest(`/api/reservations/${reservationId}/`, { method: "PATCH", body: payload });
}

async function updateReservationStatus(reservationId, status) {
  return apiRequest(`/api/reservations/${reservationId}/update_status/`, { method: "PATCH", body: { status } });
}

async function listTables() {
  return apiRequest("/api/reservations/tables/");
}

async function createTable(payload) {
  return apiRequest("/api/reservations/tables/", { method: "POST", body: payload });
}

async function updateTable(tableId, payload) {
  return apiRequest(`/api/reservations/tables/${tableId}/`, { method: "PATCH", body: payload });
}

async function deleteTable(tableId) {
  return apiRequest(`/api/reservations/tables/${tableId}/`, { method: "DELETE" });
}

async function listMenuItems(query) {
  return apiRequest("/api/menu/items/", { query });
}

async function createMenuItem(payload) {
  return apiRequest("/api/menu/items/", { method: "POST", body: payload });
}

async function updateMenuItem(itemId, payload) {
  return apiRequest(`/api/menu/items/${itemId}/`, { method: "PATCH", body: payload });
}

async function deleteMenuItem(itemId) {
  return apiRequest(`/api/menu/items/${itemId}/`, { method: "DELETE" });
}

async function toggleMenuItemAvailability(itemId) {
  return apiRequest(`/api/menu/items/${itemId}/toggle_availability/`, { method: "PATCH" });
}

async function listCategories() {
  return apiRequest("/api/menu/categories/");
}

async function createCategory(payload) {
  return apiRequest("/api/menu/categories/", { method: "POST", body: payload });
}

async function updateCategory(categoryId, payload) {
  return apiRequest(`/api/menu/categories/${categoryId}/`, { method: "PATCH", body: payload });
}

async function deleteCategory(categoryId) {
  return apiRequest(`/api/menu/categories/${categoryId}/`, { method: "DELETE" });
}

async function getDashboardReport() {
  return apiRequest("/api/reports/dashboard/");
}

async function getRevenueReport(query) {
  return apiRequest("/api/reports/revenue/", { query });
}

async function getTopItemsReport(query) {
  return apiRequest("/api/reports/top-items/", { query });
}

async function getStaffReport(query) {
  return apiRequest("/api/reports/staff/", { query });
}

export {
  apiRequest,
  changePassword,
  createCategory,
  createOrder,
  createReservation,
  createTable,
  createUser,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  deleteTable,
  deleteUser,
  getCurrentUser,
  getDashboardReport,
  getRevenueReport,
  getStaffReport,
  getTopItemsReport,
  listActiveOrders,
  listCategories,
  listKitchenOrders,
  listMenuItems,
  listOrders,
  listReservations,
  listTables,
  listTodayReservations,
  listUsers,
  login,
  logout,
  refreshSession,
  toggleMenuItemAvailability,
  updateCategory,
  updateMenuItem,
  updateOrderStatus,
  updateReservation,
  updateReservationStatus,
  updateTable,
};
