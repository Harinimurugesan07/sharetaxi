import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { Input } from "../../components/Field";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { formatDate } from "../../lib/format";
import { adminListCustomers } from "../../api/admin";
import "./AdminTable.css";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");

  const load = () => {
    setStatus("loading");
    adminListCustomers()
      .then((c) => {
        setCustomers(c || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(load, []);

  const filtered = customers.filter(
    (c) => (c.full_name || "").toLowerCase().includes(query.toLowerCase()) || (c.email || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-filter-search--compact">
        <Input icon={Search} placeholder="Search users by name or email..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {status === "loading" && <LoadingState label="Loading users..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && filtered.length === 0 && <EmptyState title="No users found" />}

      {status === "success" && filtered.length > 0 && (
        <Card className="admin-table-card">
          <table className="admin-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Rides</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="admin-table-cell-primary">{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.total_rides ?? 0}</td>
                  <td>
                    <Badge tone={c.is_active ? "success" : "danger"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}