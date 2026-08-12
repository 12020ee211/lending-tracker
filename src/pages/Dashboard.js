import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoans } from "../context/LoanContext";
import { useAuth } from "../context/AuthContext";
import { StatCard, Card, Badge, Button, Spinner, EmptyState } from "../components/UI";
import { formatCurrency, formatDate, loanBalance, statusColor, statusLabel } from "../utils/format";

export default function Dashboard() {
  const { loans, loading, fetchLoans } = useLoans();
  const { currentUser, can } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const lending = loans.filter((l) => l.type === "lending");
  const borrowing = loans.filter((l) => l.type === "borrowing");
  const activeLoans = loans.filter((l) => l.status === "active");
  const overdueLoans = activeLoans.filter((l) => l.dueDate && new Date(l.dueDate) < new Date());

  const totalLent = lending.filter(l => l.status === "active").reduce((s, l) => s + Number(l.principalAmount), 0);
  const totalBorrowed = borrowing.filter(l => l.status === "active").reduce((s, l) => s + Number(l.principalAmount), 0);
  const totalOutstanding = lending.reduce((s, l) => s + loanBalance(l), 0);

  const recent = [...loans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {currentUser?.name?.split(" ")[0]}</p>
        </div>
        {can("add_loan") && (
          <Button onClick={() => navigate("/add-loan")}>+ Add Loan</Button>
        )}
      </div>

      {loading && loans.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Lent" value={formatCurrency(totalLent)} sub={`${lending.filter(l=>l.status==="active").length} active`} accent="indigo" />
            <StatCard label="Total Borrowed" value={formatCurrency(totalBorrowed)} sub={`${borrowing.filter(l=>l.status==="active").length} active`} accent="amber" />
            <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} sub="amount to collect" accent="emerald" />
            <StatCard label="Overdue" value={overdueLoans.length} sub={overdueLoans.length > 0 ? "needs attention" : "all on track"} accent={overdueLoans.length > 0 ? "rose" : "emerald"} />
          </div>

          {/* Overdue alert */}
          {overdueLoans.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-rose-800">⚠ {overdueLoans.length} overdue loan{overdueLoans.length > 1 ? "s" : ""}</p>
              <p className="text-xs text-rose-600 mt-0.5">
                {overdueLoans.slice(0, 3).map((l) => l.counterpartyName).join(", ")}
                {overdueLoans.length > 3 ? ` and ${overdueLoans.length - 3} more` : ""}
              </p>
            </div>
          )}

          {/* Recent activity */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/loans")}>View all →</Button>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                title="No loans yet"
                description="Add your first loan to get started tracking."
                action={can("add_loan") ? <Button onClick={() => navigate("/add-loan")}>Add your first loan</Button> : null}
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {recent.map((loan) => {
                  const balance = loanBalance(loan);
                  return (
                    <div key={loan.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition" onClick={() => navigate(`/loans/${loan.id}`)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${loan.type === "lending" ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"}`}>
                          {loan.type === "lending" ? "↑" : "↓"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{loan.counterpartyName}</p>
                          <p className="text-xs text-slate-500">{loan.type === "lending" ? "Lent" : "Borrowed"} · {formatDate(loan.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(loan.principalAmount)}</p>
                        <Badge color={statusColor(loan.status)}>{statusLabel(loan.status)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
