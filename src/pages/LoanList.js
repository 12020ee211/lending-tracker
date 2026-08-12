import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoans } from "../context/LoanContext";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, Button, Spinner, EmptyState, Input, Select } from "../components/UI";
import { formatCurrency, formatDate, loanBalance, statusColor, statusLabel } from "../utils/format";

export default function LoanList() {
  const { loans, loading, fetchLoans } = useLoans();
  const { can } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => { fetchLoans(true); }, []);

  const filtered = loans
    .filter((l) => {
      const q = search.toLowerCase();
      if (q && !l.counterpartyName.toLowerCase().includes(q) && !l.purpose?.toLowerCase().includes(q)) return false;
      if (filterType !== "all" && l.type !== filterType) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "amount_desc") return Number(b.principalAmount) - Number(a.principalAmount);
      if (sort === "amount_asc") return Number(a.principalAmount) - Number(b.principalAmount);
      if (sort === "due") return new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999");
      return 0;
    });

  const totalFiltered = filtered.reduce((s, l) => s + loanBalance(l), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Loans</h1>
        {can("add_loan") && <Button onClick={() => navigate("/add-loan")}>+ Add Loan</Button>}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input placeholder="Search by name or purpose…" value={search} onChange={(e) => setSearch(e.target.value)} className="col-span-2 md:col-span-1" />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All types</option>
            <option value="lending">Lending</option>
            <option value="borrowing">Borrowing</option>
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="settled">Settled</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_desc">Highest amount</option>
            <option value="amount_asc">Lowest amount</option>
            <option value="due">By due date</option>
          </Select>
        </div>
        {filtered.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">{filtered.length} loan{filtered.length !== 1 ? "s" : ""} · Outstanding balance: <strong>{formatCurrency(totalFiltered)}</strong></p>
        )}
      </Card>

      {/* List */}
      {loading && loans.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={loans.length === 0 ? "No loans yet" : "No matches found"}
          description={loans.length === 0 ? "Start by adding your first loan." : "Try adjusting your filters."}
          action={loans.length === 0 && can("add_loan") ? <Button onClick={() => navigate("/add-loan")}>Add your first loan</Button> : null}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((loan) => {
            const balance = loanBalance(loan);
            const isOverdue = loan.status === "active" && loan.dueDate && new Date(loan.dueDate) < new Date();
            return (
              <Card key={loan.id} onClick={() => navigate(`/loans/${loan.id}`)} className="px-5 py-4 hover:border-indigo-200">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${loan.type === "lending" ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"}`}>
                    {loan.type === "lending" ? "↑" : "↓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{loan.counterpartyName}</p>
                      {loan.counterpartyRelation && <span className="text-xs text-slate-400">({loan.counterpartyRelation})</span>}
                      <Badge color={statusColor(isOverdue ? "overdue" : loan.status)}>{isOverdue ? "Overdue" : statusLabel(loan.status)}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {loan.type === "lending" ? "Lent" : "Borrowed"} {formatDate(loan.startDate)}
                      {loan.dueDate ? ` · Due ${formatDate(loan.dueDate)}` : ""}
                      {loan.purpose ? ` · ${loan.purpose}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-slate-900">{formatCurrency(loan.principalAmount, loan.currency)}</p>
                    {balance !== Number(loan.principalAmount) && (
                      <p className="text-xs text-slate-500">Bal: {formatCurrency(balance, loan.currency)}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
