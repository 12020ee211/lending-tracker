// GitHub API service — reads/writes JSON files to the private ledger-data repo

const TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const OWNER = process.env.REACT_APP_DATA_REPO_OWNER;
const REPO = process.env.REACT_APP_DATA_REPO_NAME;
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

const headers = {
  Authorization: `token ${TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/vnd.github.v3+json",
};

async function getFile(path) {
  const res = await fetch(`${BASE}/${path}`, { headers });
  if (res.status === 404) return { content: null, sha: null };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(atob(data.content));
  return { content, sha: data.sha };
}

async function putFile(path, content, sha) {
  const body = {
    message: `Update ${path}`,
    content: btoa(JSON.stringify(content, null, 2)),
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(`${BASE}/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub PUT failed: ${res.status}`);
  }
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUsers() {
  const { content, sha } = await getFile("users.json");
  return { users: content || [], sha };
}

export async function saveUsers(users, sha) {
  return putFile("users.json", users, sha);
}

// ── Loans ──────────────────────────────────────────────────────────────────

export async function getLoans() {
  const { content, sha } = await getFile("loans.json");
  return { loans: content || [], sha };
}

export async function saveLoans(loans, sha) {
  return putFile("loans.json", loans, sha);
}
