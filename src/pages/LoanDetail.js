import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLoans } from "../context/LoanContext";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, Button, Modal, Input, Textarea, Alert, ConfirmDialog, Spinner } from "../components/UI";
import { formatCurrency, formatDate, formatDateTime, loanBalance, statusColor, statusLabel } from "../utils/format";

function PaymentModal({ open, onClose, loan, onAdd }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const balance = loanBalance(loan);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
    if (Number(amount) > balance) { setError(`Amount exceeds outstanding balance (${formatCurrency(balance)})`); return; }
    setLoading(true);
    try {
      await onAdd({ amount: Number(amount), date, method, note });
      setAmount(""); setDate(new Date().toISOString().slice(0, 10)); setMethod("cash"); setNote(""); setError("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
          Outstanding balance: <strong className="text-slate-900">{formatCurrency(balance, loan.currency)}</strong>
        </div>
        <Input label="Amount received *" type="number" placeholder="0.00" min="0.01" step="0.01" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
        <Input label="Payment date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Payment method</label>
          <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Textarea label="Note" placeholder="Reference number, remarks…" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Record payment</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loans, loading, fetchLoans, deleteLoan, addPayment, updateLoan } = useLoans();
  const { can } = useAuth();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => { fetchLoans(); }, []);

  const loan = loans.find((l) => l.id === id);

  if (loading && !loan) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!loan) return (
    <div className="text-center py-16">
      <p className="text-slate-500">Loan not found.</p>
      <Button variant="secondary" className="mt-4" onClick={() => navigate("/loans")}>Back to loans</Button>
    </div>
  );

  const balance = loanBalance(loan);
  const totalPaid = (loan.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const isOverdue = loan.status === "active" && loan.dueDate && new Date(loan.dueDate) < new Date();

  const handleDelete = async () => {
    try {
      await deleteLoan(id);
      navigate("/loans");
    } catch (e) {
      setActionError(e.message);
      setDeleteOpen(false);
    }
  };

  const handleMarkSettled = async () => {
    try {
      await updateLoan(id, { status: "settled" });
    } catch (e) {
      setActionError(e.message);
    }
  };

  const fields = [
    { label: "Type", value: loan.type === "lending" ? "💸 I lent this money" : "🤝 I borrowed this money" },
    { label: "Counterparty", value: loan.counterpartyName },
    { label: "Relationship", value: loan.counterpartyRelation || "—" },
    { label: "Phone", value: loan.counterpartyPhone || "—" },
    { label: "Email", value: loan.counterpartyEmail || "—" },
    { label: "Principal", value: formatCurrency(loan.principalAmount, loan.currency) },
    { label: "Interest", value: loan.interestType === "none" ? "None" : `${loan.interestRate}% p.a. (${loan.interestType})` },
    { label: "Start date", value: formatDate(loan.startDate) },
    { label: "Due date", value: loan.dueDate ? formatDate(loan.dueDate) : "Open-ended" },
    { label: "Repayment", value: loan.repaymentSchedule?.replace("_", " ") || "—" },
    { label: "Purpose", value: loan.purpose || "—" },
    { label: "Collateral", value: loan.collateral || "—" },
    { label: "Witness", value: loan.witnessName || "—" },
    { label: "Added by", value: loan.addedByName || "—" },
    { label: "Created", value: formatDateTime(loan.createdAt) },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{loan.counterpartyName}</h1>
            <Badge color={statusColor(isOverdue ? "overdue" : loan.status)}>{isOverdue ? "Overdue" : statusLabel(loan.status)}</Badge>
          </div>
          <p className="text-sm text-slate-500">{loan.type === "lending" ? "Lent" : "Borrowed"} {formatCurrency(loan.principalAmount, loan.currency)}</p>
        </div>
      </div>

      {actionError && <Alert type="error" onClose={() => setActionError("")}>{actionError}</Alert>}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-indigo-50 p-4 text-center">
          <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">Principal</p>
          <p className="text-lg font-bold text-indigo-900 mt-1">{formatCurrency(loan.principalAmount, loan.currency)}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wide">Received</p>
          <p className="text-lg font-bold text-emerald-900 mt-1">{formatCurrency(totalPaid, loan.currency)}</p>
        </div>
        <div className={`rounded-2xl p-4 text-center ${balance > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${balance > 0 ? "text-amber-500" : "text-slate-400"}`}>Balance</p>
          <p className={`text-lg font-bold mt-1 ${balance > 0 ? "text-amber-900" : "text-slate-400"}`}>{formatCurrency(balance, loan.currency)}</p>
        </div>
      </div>

      {/* Progress bar */}
      {loan.principalAmount > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Repayment progress</span>
            <span>{Math.min(100, Math.round((totalPaid / Number(loan.principalAmount)) * 100))}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalPaid / Number(loan.principalAmount)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {can("edit_loan") && loan.status === "active" && (
        <div className="flex gap-2 flex-wrap">
          {loan.type === "lending" && (
            <Button variant="success" size="sm" onClick={() => setPaymentOpen(true)}>Record payment</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/loans/${id}/edit`)}>Edit</Button>
          {balance === 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkSettled}>Mark as settled</Button>
          )}
          {can("delete_loan") && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
          )}
        </div>
      )}

      {/* Notes */}
      {loan.notes && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{loan.notes}</p>
        </Card>
      )}

      {/* Details */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Loan Details</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between px-5 py-3 text-sm">
              <span className="text-slate-500 shrink-0 mr-4">{label}</span>
              <span className="text-slate-900 text-right font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment history */}
      {(loan.payments || []).length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Payment History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {[...(loan.payments || [])].reverse().map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{formatCurrency(p.amount, loan.currency)}</p>
                  <p className="text-xs text-slate-500">{formatDate(p.date)} · {p.method?.replace("_", " ")} {p.note ? `· ${p.note}` : ""}</p>
                </div>
                <Badge color="emerald">Received</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} loan={loan} onAdd={(payment) => addPayment(id, payment)} />
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Delete loan" message={`Are you sure you want to delete the loan for ${loan.counterpartyName}? This cannot be undone.`} confirmLabel="Delete loan" />
    </div>
  );
}
