import React, { createContext, useContext, useState, useCallback } from "react";
import { getLoans, saveLoans } from "../services/github";

const LoanContext = createContext(null);

export function LoanProvider({ children }) {
  const [loans, setLoans] = useState([]);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchLoans = useCallback(async (force = false) => {
    if (!force && lastFetched && Date.now() - lastFetched < 30_000) return;
    setLoading(true);
    setError(null);
    try {
      const { loans: data, sha: s } = await getLoans();
      setLoans(data);
      setSha(s);
      setLastFetched(Date.now());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  const addLoan = useCallback(async (loanData) => {
    setLoading(true);
    setError(null);
    try {
      const { loans: fresh, sha: freshSha } = await getLoans();
      const newLoan = {
        id: crypto.randomUUID(),
        ...loanData,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments: [],
      };
      const updated = [...fresh, newLoan];
      const res = await saveLoans(updated, freshSha);
      setLoans(updated);
      setSha(res.content?.sha || freshSha);
      setLastFetched(Date.now());
      return newLoan;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLoan = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { loans: fresh, sha: freshSha } = await getLoans();
      const updated = fresh.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      );
      const res = await saveLoans(updated, freshSha);
      setLoans(updated);
      setSha(res.content?.sha || freshSha);
      setLastFetched(Date.now());
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLoan = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { loans: fresh, sha: freshSha } = await getLoans();
      const updated = fresh.filter((l) => l.id !== id);
      const res = await saveLoans(updated, freshSha);
      setLoans(updated);
      setSha(res.content?.sha || freshSha);
      setLastFetched(Date.now());
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = useCallback(async (loanId, payment) => {
    setLoading(true);
    setError(null);
    try {
      const { loans: fresh, sha: freshSha } = await getLoans();
      const updated = fresh.map((l) => {
        if (l.id !== loanId) return l;
        const payments = [...(l.payments || []), { id: crypto.randomUUID(), ...payment, recordedAt: new Date().toISOString() }];
        const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
        const status = totalPaid >= Number(l.principalAmount) ? "settled" : "active";
        return { ...l, payments, status, updatedAt: new Date().toISOString() };
      });
      const res = await saveLoans(updated, freshSha);
      setLoans(updated);
      setSha(res.content?.sha || freshSha);
      setLastFetched(Date.now());
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <LoanContext.Provider value={{ loans, loading, error, fetchLoans, addLoan, updateLoan, deleteLoan, addPayment }}>
      {children}
    </LoanContext.Provider>
  );
}

export function useLoans() {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error("useLoans must be used inside LoanProvider");
  return ctx;
}
