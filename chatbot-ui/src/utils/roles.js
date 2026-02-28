export const Roles = Object.freeze({
  EMPLOYEE: "employee",
  MANAGER: "manager",
  REPRESENTATIVE: "representative",
});

export const normalizeRole = (role) =>
  role === Roles.REPRESENTATIVE ? Roles.EMPLOYEE : role;

export const isManagerRole = (role) => normalizeRole(role) === Roles.MANAGER;

export const getDashboardPath = (role) =>
  isManagerRole(role) ? "/manager/dashboard" : "/dashboard";
