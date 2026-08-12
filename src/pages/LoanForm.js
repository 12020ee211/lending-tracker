import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoans } from "../context/LoanContext";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Select, Textarea, Alert, Card } from "../components/UI";

const EMPTY = {
  type: "lending",
  counterpartyName: "",
  counterpartyPhone: "",
  counterpartyEmail: "",
  counterpartyRelation: "",
  principalAmount: "",
  currency: "INR",
  interestRate: "",
  interestType: "none",
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  repaymentSchedule: "lump_sum",
  purpose: "",
  collateral: "",
  witnessName: "",
  notes: "",
};

const RELATIONS = ["Friend", "Family", "Colleague", "Business Partner", "Neighbour", "Other"];
const SCHEDULES = [
  { value: "lump_sum", label: "Lump sum" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "flexible", label: "Flexible" },
];

export default function LoanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loans, addLoan, updateLoan, loading } = useLoans();
  const { currentUser, can } = useAuth();
  const isEdit = Boolean(id);

  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const loan = loans.find((l) => l.id === id);
      if (loan) setFields({ ...EMPTY, ...loan });
    }
  }, [id, loans, isEdit]);

  if (!can("add_loan")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-lg font-semibold text-slate-900">Access restricted</h2>
        <p className="text-sm text-slate-500 mt-1">You need Editor or Admin access to manage loans.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const set = (k) => (ev) => {
    setFields((f) => ({ ...f, [k]: ev.target.value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.counterpartyName.trim()) e.counterpartyName = "Name is required";
    if (!fields.principalAmount || isNaN(Number(fields.principalAmount)) || Number(fields.principalAmount) <= 0)
      e.principalAmount = "Enter a valid amount";
    if (!fields.startDate) e.startDate = "Start date is required";
    if (fields.dueDate && fields.dueDate < fields.startDate) e.dueDate = "Due date must be after start date";
    if (fields.interestType !== "none" && fields.interestRate) {
      if (isNaN(Number(fields.interestRate)) || Number(fields.interestRate) < 0)
        e.interestRate = "Enter a valid rate";
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setApiError("");
    try {
      const payload = {
        ...fields,
        principalAmount: Number(fields.principalAmount),
        interestRate: fields.interestRate ? Number(fields.interestRate) : 0,
        addedBy: currentUser.id,
        addedByName: currentUser.name,
      };
      if (isEdit) {
        await updateLoan(id, payload);
      } else {
        await addLoan(payload);
      }
      setSuccess(true);
      setTimeout(() => navigate("/loans"), 1200);
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition">←</button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{isEdit ? "Edit Loan" : "Add New Loan"}</h1>
          <p className="text-sm text-slate-500">Fill in all relevant details for accurate tracking</p>
        </div>
      </div>

      {success && <Alert type="success">Loan {isEdit ? "updated" : "added"} successfully! Redirecting…</Alert>}
      {apiError && <Alert type="error" onClose={() => setApiError("")}>{apiError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type toggle */}
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Loan type</p>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {[
              { v: "lending", label: "💸 I lent money", sub: "Someone owes me" },
              { v: "borrowing", label: "🤝 I borrowed money", sub: "I owe someone" },
            ].map(({ v, label, sub }) => (
              <button
                key={v}
                type="button"
                onClick={() => setFields((f) => ({ ...f, type: v }))}
                className={`flex-1 flex flex-col items-center py-3 px-4 text-sm transition ${
                  fields.type === v ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold">{label}</span>
                <span className={`text-xs mt-0.5 ${fields.type === v ? "text-indigo-200" : "text-slate-400"}`}>{sub}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Counterparty */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            {fields.type === "lending" ? "Borrower" : "Lender"} Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full name *" placeholder="Rahul Sharma" value={fields.counterpartyName} onChange={set("counterpartyName")} error={errors.counterpartyName} />
            <Select label="Relationship" value={fields.counterpartyRelation} onChange={set("counterpartyRelation")}>
              <option value="">Select relationship</option>
              {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Input label="Phone number" type="tel" placeholder="+91 98765 43210" value={fields.counterpartyPhone} onChange={set("counterpartyPhone")} />
            <Input label="Email" type="email" placeholder="rahul@example.com" value={fields.counterpartyEmail} onChange={set("counterpartyEmail")} />
          </div>
        </Card>

        {/* Loan details */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Loan Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <Select label="Currency" value={fields.currency} onChange={set("currency")} className="w-24 shrink-0">
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </Select>
              <Input label="Principal amount *" type="number" placeholder="50000" min="0" step="0.01" value={fields.principalAmount} onChange={set("principalAmount")} error={errors.principalAmount} className="flex-1" />
            </div>
            <Select label="Interest type" value={fields.interestType} onChange={set("interestType")}>
              <option value="none">No interest</option>
              <option value="simple">Simple interest</option>
              <option value="compound">Compound interest</option>
            </Select>
            {fields.interestType !== "none" && (
              <Input label="Interest rate (% per annum)" type="number" placeholder="12" min="0" max="100" step="0.01" value={fields.interestRate} onChange={set("interestRate")} error={errors.interestRate} />
            )}
            <Input label="Start date *" type="date" value={fields.startDate} onChange={set("startDate")} error={errors.startDate} />
            <Input label="Due date" type="date" value={fields.dueDate} onChange={set("dueDate")} error={errors.dueDate} hint="Leave blank if open-ended" min={fields.startDate} />
            <Select label="Repayment schedule" value={fields.repaymentSchedule} onChange={set("repaymentSchedule")}>
              {SCHEDULES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </Card>

        {/* Additional */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Additional Information</h3>
          <Input label="Purpose / reason" placeholder="e.g. Medical emergency, House renovation" value={fields.purpose} onChange={set("purpose")} />
          <Input label="Collateral / security" placeholder="e.g. Gold jewellery, Property documents (if any)" value={fields.collateral} onChange={set("collateral")} />
          <Input label="Witness name" placeholder="Full name of witness (if any)" value={fields.witnessName} onChange={set("witnessName")} />
          <Textarea label="Notes" placeholder="Any additional terms, conditions, or remarks…" value={fields.notes} onChange={set("notes")} />
        </Card>

        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? "Save changes" : "Add loan"}</Button>
        </div>
      </form>
    </div>
  );
}
