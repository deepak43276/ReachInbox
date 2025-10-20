import React, { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [emails, setEmails] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("");
  const [folder, setFolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState({}); // store per email

  // Fetch accounts for dropdown
  useEffect(() => {
    axios.get("/api/accounts").then(res => setAccounts(res.data));
  }, []);

  // Fetch emails on filter/search change
  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/emails/search", { params: { q, account, folder } })
      .then(res => setEmails(res.data))
      .finally(() => setLoading(false));
  }, [q, account, folder]);

  // Trigger Slack/Webhook for a specific email
  const triggerWebhook = async (email) => {
    try {
      await axios.post(`/api/emails/${email.id}/trigger-webhook`);
      alert(`Webhook triggered for "${email.subject}"`);
    } catch (err) {
      console.error(err);
      alert("Failed to trigger webhook");
    }
  };

  // Request suggested reply for an email
  const generateReply = async (email) => {
    try {
      const res = await axios.post(`/api/emails/${email.id}/suggest-reply`, { text: email.body });
      setSuggestedReplies(prev => ({ ...prev, [email.id]: res.data.reply }));
    } catch (err) {
      console.error(err);
      alert("Failed to generate suggested reply");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>ReachInbox - AI Email Onebox</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Search Emails"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ marginRight: "1rem", padding: "0.5rem" }}
        />

        <select onChange={e => setAccount(e.target.value)} value={account} style={{ marginRight: "1rem", padding: "0.5rem" }}>
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.email}>{a.email}</option>)}
        </select>

        <select onChange={e => setFolder(e.target.value)} value={folder} style={{ padding: "0.5rem" }}>
          <option value="">All Folders</option>
          <option value="INBOX">INBOX</option>
          <option value="Sent">Sent</option>
        </select>
      </div>

      {loading ? <p>Loading emails...</p> :
        <ul style={{ listStyle: "none", padding: 0 }}>
          {emails.map(email => (
            <li key={email.id} style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem", borderRadius: "8px" }}>
              <div>
                <b>{email.subject}</b> | {email.from} | {email.aiCategory} | {new Date(email.date).toLocaleString()}
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <button onClick={() => triggerWebhook(email)} style={{ marginRight: "1rem" }}>
                  Trigger Slack/Webhook
                </button>
                <button onClick={() => generateReply(email)}>Generate Suggested Reply</button>
              </div>
              {suggestedReplies[email.id] && (
                <div style={{ marginTop: "0.5rem", background: "#f4f4f4", padding: "0.5rem", borderRadius: "4px" }}>
                  <b>Suggested Reply:</b> {suggestedReplies[email.id]}
                </div>
              )}
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
