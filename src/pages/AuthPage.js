import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Alert } from "../components/UI";

function LoginForm() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!fields.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Enter a valid email";
    if (!fields.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setApiError("");
    try {
      await login(fields);
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message);
    }
  };

  const set = (k) => (ev) => {
    setFields((f) => ({ ...f, [k]: ev.target.value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <Alert type="error">{apiError}</Alert>}
      <Input label="Email address" type="email" placeholder="you@example.com" value={fields.email} onChange={set("email")} error={errors.email} autoComplete="email" />
      <Input label="Password" type="password" placeholder="••••••••" value={fields.password} onChange={set("password")} error={errors.password} autoComplete="current-password" />
      <Button type="submit" loading={loading} className="w-full mt-2">Sign in to Ledger</Button>
    </form>
  );
}

function RegisterForm({ onSuccess }) {
  const { register, loading } = useAuth();
  const [fields, setFields] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) e.name = "Full name is required";
    if (!fields.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Enter a valid email";
    if (fields.phone && !/^\+?[\d\s\-()]{7,15}$/.test(fields.phone)) e.phone = "Enter a valid phone number";
    if (!fields.password) e.password = "Password is required";
    else if (fields.password.length < 8) e.password = "Password must be at least 8 characters";
    if (fields.password !== fields.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setApiError("");
    try {
      await register(fields);
      onSuccess();
    } catch (err) {
      setApiError(err.message);
    }
  };

  const set = (k) => (ev) => {
    setFields((f) => ({ ...f, [k]: ev.target.value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <Alert type="error">{apiError}</Alert>}
      <Input label="Full name" placeholder="Aditya Pamisetty" value={fields.name} onChange={set("name")} error={errors.name} autoComplete="name" />
      <Input label="Email address" type="email" placeholder="you@example.com" value={fields.email} onChange={set("email")} error={errors.email} autoComplete="email" />
      <Input label="Phone number" type="tel" placeholder="+91 98765 43210" value={fields.phone} onChange={set("phone")} error={errors.phone} hint="Optional — used for contact reference" autoComplete="tel" />
      <Input label="Password" type="password" placeholder="Min. 8 characters" value={fields.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
      <Input label="Confirm password" type="password" placeholder="Re-enter password" value={fields.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
      <Button type="submit" loading={loading} className="w-full mt-2">Create account</Button>
      <p className="text-xs text-slate-500 text-center">New accounts start with Viewer access. An admin can upgrade your role.</p>
    </form>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-indigo-200">₹</div>
          <h1 className="text-2xl font-bold text-slate-900">Ledger Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track lending & borrowing with clarity</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === t ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "login" ? (
              <LoginForm />
            ) : (
              <RegisterForm onSuccess={() => navigate("/dashboard")} />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Your data is stored securely in a private GitHub repository.</p>
      </div>
    </div>
  );
}
