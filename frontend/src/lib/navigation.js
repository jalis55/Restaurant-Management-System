import {
  BarChart3,
  ClipboardList,
  CookingPot,
  LayoutGrid,
  ListChecks,
  PackageSearch,
  ReceiptText,
  Settings,
  TableProperties,
  Users,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

const ADMIN_ROLES = ["admin", "manager"];
const STAFF_ROLES = ["waiter", "kitchen"];
const MENU_READ_ROLES = ["admin", "manager", "waiter", "kitchen"];
const TABLE_READ_ROLES = ["admin", "manager", "waiter"];

const routeCatalog = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutGrid,
    section: "Dashboard",
    roles: ADMIN_ROLES,
    eyebrow: "Overview",
    title: "Operations Dashboard",
    description: "Track service health, team activity, and the highest priority actions across the restaurant.",
    highlights: ["Revenue snapshot", "Service bottlenecks", "Daily staffing pulse"],
  },
  {
    path: "/operations/orders",
    label: "Orders",
    icon: ClipboardList,
    section: "Operations",
    roles: ADMIN_ROLES,
    eyebrow: "Operations",
    title: "Orders",
    description: "Monitor in-flight orders, service timings, and fulfillment flow across the dining room and kitchen.",
    highlights: ["Pending queue", "Service timing", "Completion trends"],
  },
  {
    path: "/operations/orders/new",
    label: "Create Order",
    icon: ClipboardList,
    section: "Operations",
    roles: ADMIN_ROLES,
    eyebrow: "Operations",
    title: "Create Order",
    description: "Open a fresh order fast, capture table details, and hand it off to the service flow immediately.",
    highlights: ["Fast ticket entry", "Table assignment", "Service handoff"],
  },
  {
    path: "/operations/billing",
    label: "Billing",
    icon: ReceiptText,
    section: "Operations",
    roles: ADMIN_ROLES,
    eyebrow: "Operations",
    title: "Billing",
    description: "Finalize served orders, apply manager discounts, and capture the net amount that counts toward revenue.",
    highlights: ["Served orders", "Discount controls", "Net totals"],
  },
  {
    path: "/operations/billing/:orderId",
    label: "Billing Detail",
    icon: ReceiptText,
    section: "Operations",
    roles: ADMIN_ROLES,
    eyebrow: "Operations",
    title: "Finalize Billing",
    description: "Review one served order in detail and finalize its bill.",
    highlights: ["Bill items", "Discount review", "Finalize amount"],
    hidden: true,
  },
  {
    path: "/operations/reservations",
    label: "Reservations",
    icon: ListChecks,
    section: "Operations",
    roles: ADMIN_ROLES,
    eyebrow: "Operations",
    title: "Reservations",
    description: "Review bookings, guest pacing, and upcoming table demand before service gets busy.",
    highlights: ["Upcoming arrivals", "Seating pace", "Guest notes"],
  },
  {
    path: "/operations/tables",
    label: "Tables",
    icon: TableProperties,
    section: "Operations",
    roles: TABLE_READ_ROLES,
    eyebrow: "Operations",
    title: "Tables",
    description: "See room readiness, capacity usage, and which tables need the quickest turn-around.",
    highlights: ["Table status", "Capacity coverage", "Turnover timing"],
  },
  {
    path: "/menu/items",
    label: "Items",
    icon: UtensilsCrossed,
    section: "Menu Management",
    roles: MENU_READ_ROLES,
    eyebrow: "Menu",
    title: "Menu Items",
    description: "Manage item availability, pricing, prep details, and what the floor can currently sell.",
    highlights: ["Availability", "Pricing updates", "Prep notes"],
  },
  {
    path: "/menu/categories",
    label: "Categories",
    icon: PackageSearch,
    section: "Menu Management",
    roles: MENU_READ_ROLES,
    eyebrow: "Menu",
    title: "Menu Categories",
    description: "Organize the structure of the menu so item groupings stay clean and fast to manage.",
    highlights: ["Category order", "Grouping health", "Menu structure"],
  },
  {
    path: "/reports/revenue",
    label: "Revenue",
    icon: WalletCards,
    section: "Reports",
    roles: ADMIN_ROLES,
    eyebrow: "Reports",
    title: "Revenue Report",
    description: "Follow daily revenue movement, compare trends, and spot slow shifts before they stack up.",
    highlights: ["Daily totals", "Trend lines", "Shift performance"],
  },
  {
    path: "/reports/bills",
    label: "Bills",
    icon: ReceiptText,
    section: "Reports",
    roles: ADMIN_ROLES,
    eyebrow: "Reports",
    title: "Bills Report",
    description: "Review finalized bills, inspect discount decisions, and download detailed PDF bills for records or sharing.",
    highlights: ["Billed orders", "Discount log", "PDF download"],
  },
  {
    path: "/reports/top-items",
    label: "Top Items",
    icon: BarChart3,
    section: "Reports",
    roles: ADMIN_ROLES,
    eyebrow: "Reports",
    title: "Top Items Report",
    description: "See which menu items are performing best and where demand is starting to fade.",
    highlights: ["Best sellers", "Volume mix", "Menu momentum"],
  },
  {
    path: "/reports/staff-performance",
    label: "Staff Performance",
    icon: Users,
    section: "Reports",
    roles: ADMIN_ROLES,
    eyebrow: "Reports",
    title: "Staff Performance",
    description: "Measure service output across the team and identify where coaching or support matters most.",
    highlights: ["Team throughput", "Shift coverage", "Service quality"],
  },
  {
    path: "/settings/billing-rules",
    label: "Billing Rules",
    icon: ReceiptText,
    section: "Settings",
    roles: ADMIN_ROLES,
    eyebrow: "Settings",
    title: "Billing Rules",
    description: "Set the global tax and service charge that billing will apply automatically to every finalized order.",
    highlights: ["Global tax", "Global service charge", "Checkout lock"],
  },
  {
    path: "/settings/staff-accounts",
    label: "Staff Accounts",
    icon: Users,
    section: "Settings",
    roles: ADMIN_ROLES,
    eyebrow: "Settings",
    title: "Staff Accounts",
    description: "Create and manage staff access, roles, and account setup for restaurant operations.",
    highlights: ["Role assignments", "Account status", "Access setup"],
  },
  {
    path: "/settings/profile",
    label: "Profile",
    icon: Settings,
    section: "Settings",
    roles: ADMIN_ROLES,
    eyebrow: "Settings",
    title: "Profile",
    description: "Update your profile, contact information, and the account details used across the workspace.",
    highlights: ["Personal info", "Contact details", "Account preferences"],
  },
  {
    path: "/staff/orders/new",
    label: "New Order",
    icon: ClipboardList,
    section: "Staff Panel",
    roles: ["waiter"],
    eyebrow: "Staff Panel",
    title: "Create Order",
    description: "Open a fresh order fast, capture table details, and hand it off to the service flow immediately.",
    highlights: ["Fast ticket entry", "Table assignment", "Service handoff"],
  },
  {
    path: "/staff/orders/active",
    label: "Active Orders",
    icon: ListChecks,
    section: "Staff Panel",
    roles: ["waiter"],
    eyebrow: "Staff Panel",
    title: "Active Orders",
    description: "Follow the live order list, keep an eye on delays, and stay aligned with the kitchen queue.",
    highlights: ["Live queue", "Status updates", "Handoff timing"],
  },
  {
    path: "/staff/orders/kitchen",
    label: "Kitchen Display",
    icon: CookingPot,
    section: "Staff Panel",
    roles: STAFF_ROLES,
    eyebrow: "Staff Panel",
    title: "Kitchen Display",
    description: "Focus only on what needs to be cooked next, what is ready, and what is at risk of slowing service.",
    highlights: ["Cook queue", "Prep urgency", "Ready-to-serve items"],
  },
  {
    path: "/staff/reservations/today",
    label: "Today's Reservations",
    icon: TableProperties,
    section: "Staff Panel",
    roles: ["waiter"],
    eyebrow: "Staff Panel",
    title: "Today's Reservations",
    description: "Manage today's bookings, upcoming arrivals, and the notes your front-of-house team needs on hand.",
    highlights: ["Arrival list", "Guest notes", "Floor pacing"],
  },
];

const sectionOrder = ["Dashboard", "Operations", "Menu Management", "Reports", "Settings", "Staff Panel"];

function getUserRole(user) {
  return user?.role ?? null;
}

function getDefaultPathForRole(role) {
  if (role === "kitchen") {
    return "/staff/orders/kitchen";
  }

  if (role === "waiter") {
    return "/staff/orders/new";
  }

  return "/";
}

function canAccessPath(role, path) {
  const route = routeCatalog.find((item) => {
    if (item.path === path) {
      return true;
    }

    if (!item.path.includes(":")) {
      return false;
    }

    const pattern = new RegExp(`^${item.path.replace(/:[^/]+/g, "[^/]+")}$`);
    return pattern.test(path);
  });
  return route ? route.roles.includes(role) : false;
}

function getRouteMeta(path) {
  return (
    routeCatalog.find((item) => {
      if (item.path === path) {
        return true;
      }

      if (!item.path.includes(":")) {
        return false;
      }

      const pattern = new RegExp(`^${item.path.replace(/:[^/]+/g, "[^/]+")}$`);
      return pattern.test(path);
    }) ?? null
  );
}

function getNavigationGroupsForRole(role) {
  const visibleRoutes = routeCatalog.filter((item) => item.roles.includes(role) && !item.hidden);

  return sectionOrder
    .map((section) => ({
      label: section,
      items: visibleRoutes.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);
}

function getAllRoutes() {
  return routeCatalog;
}

export {
  ADMIN_ROLES,
  STAFF_ROLES,
  canAccessPath,
  getAllRoutes,
  getDefaultPathForRole,
  getNavigationGroupsForRole,
  getRouteMeta,
  getUserRole,
};
