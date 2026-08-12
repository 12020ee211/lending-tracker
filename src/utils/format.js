export function formatCurrency(amount, currency = "INR") {
  const n = Number(amount) || 0;
  const locales = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB" };
  return new Intl.NumberFormat(locales[currency] || "en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));
}

export function loanBalance(loan) {
  const principal = Number(loan.principalAmount) || 0;
  const paid = (loan.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  return Math.max(0, principal - paid);
}

export function statusColor(status) {
  return { active: "indigo", settled: "emerald", overdue: "rose", cancelled: "slate" }[status] || "slate";
}

export function statusLabel(status) {
  return { active: "Active", settled: "Settled", overdue: "Overdue", cancelled: "Cancelled" }[status] || status;
}
