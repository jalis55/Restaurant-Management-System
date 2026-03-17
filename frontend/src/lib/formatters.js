function formatRole(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Staff";
}

export { formatRole };
