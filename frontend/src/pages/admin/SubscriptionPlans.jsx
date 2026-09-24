import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Pencil, Plus, Power, Trash2, XCircle } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Input } from "../../components/Field";
import {
  adminCreateSubscriptionPlan,
  adminDeleteSubscriptionPlan,
  adminListSubscriptionPlans,
  adminUpdateSubscriptionPlan,
} from "../../api/admin";
import "./SubscriptionPlans.css";

const emptyForm = () => ({
  id: "",
  name: "",
  price: "",
  durationDays: "30",
  tagline: "",
  description: "",
  features: "",
  popular: false,
  active: true,
  limits: {
    maxTrips: "Unlimited",
    priority: "Priority placement",
    support: "Priority support",
  },
});

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `plan-${Date.now()}`;
}

function splitFeatures(rawValue) {
  return String(rawValue || "")
    .split(/\n|,|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const loadPlans = async () => {
    try {
      const response = await adminListSubscriptionPlans();
      setPlans(response || []);
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const summary = useMemo(() => {
    const active = plans.filter((plan) => plan.active !== false).length;
    const inactive = plans.length - active;
    const revenue = plans.reduce((total, plan) => total + Number(plan.price || 0), 0);
    return { active, inactive, revenue };
  }, [plans]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "price" || name === "durationDays") {
      setForm((current) => ({ ...current, [name]: value }));
      return;
    }

    if (name.startsWith("limits.")) {
      const key = name.split(".")[1];
      setForm((current) => ({
        ...current,
        limits: {
          ...current.limits,
          [key]: value,
        },
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      id: plan.id,
      name: plan.name || plan.label || "",
      price: String(plan.price ?? ""),
      durationDays: String(plan.durationDays ?? plan.days ?? "30"),
      tagline: plan.tagline || "",
      description: plan.description || "",
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      popular: Boolean(plan.popular),
      active: plan.active !== false,
      limits: {
        maxTrips: plan.limits?.maxTrips || "Unlimited",
        priority: plan.limits?.priority || "Priority placement",
        support: plan.limits?.support || "Priority support",
      },
    });
  };

  const handleSave = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const durationDays = Number(form.durationDays);

    if (!name) {
      window.alert("Plan name is required.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      window.alert("Price must be a valid number greater than zero.");
      return;
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      window.alert("Duration must be a valid number greater than zero.");
      return;
    }

    const payload = {
      id: editingId || slugify(name),
      slug: editingId || slugify(name),
      name,
      label: name,
      price,
      days: durationDays,
      durationDays,
      tagline: form.tagline.trim() || "Flexible access",
      description: form.description.trim(),
      features: splitFeatures(form.features),
      popular: Boolean(form.popular),
      active: form.active !== false,
      limits: {
        maxTrips: form.limits?.maxTrips || "Unlimited",
        priority: form.limits?.priority || "Priority placement",
        support: form.limits?.support || "Priority support",
      },
    };

    const action = editingId
      ? adminUpdateSubscriptionPlan(editingId, payload)
      : adminCreateSubscriptionPlan(payload);

    action.then(() => {
      resetForm();
      loadPlans();
    }).catch((error) => {
      window.alert(error.message || "Unable to save subscription plan.");
    });
  };

  const handleDelete = async (planId) => {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;

    const confirmed = window.confirm(`Delete the ${plan.name} plan? This will remove it from the public subscription page.`);
    if (!confirmed) return;

    try {
      await adminDeleteSubscriptionPlan(planId);
      if (editingId === planId) resetForm();
      loadPlans();
    } catch (error) {
      window.alert(error.message || "Unable to delete subscription plan.");
    }
  };

  const toggleActive = async (planId) => {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;

    try {
      await adminUpdateSubscriptionPlan(planId, { ...plan, active: plan.active === false });
      loadPlans();
    } catch (error) {
      window.alert(error.message || "Unable to update plan status.");
    }
  };

  return (
    <div className="admin-page subscription-plans-page">
      <div className="subscription-plan-summary-grid">
        <Card className="subscription-plan-summary-card">
          <span className="subscription-plan-summary-label">Active plans</span>
          <strong>{summary.active}</strong>
        </Card>
        <Card className="subscription-plan-summary-card">
          <span className="subscription-plan-summary-label">Inactive plans</span>
          <strong>{summary.inactive}</strong>
        </Card>
        <Card className="subscription-plan-summary-card">
          <span className="subscription-plan-summary-label">Plan value</span>
          <strong>₹{summary.revenue}</strong>
        </Card>
      </div>

      <Card className="subscription-plan-form-card">
        <div className="subscription-plan-form-header">
          <div>
            <p className="subscription-plan-form-kicker">Plan management</p>
            <h3>{editingId ? "Edit subscription plan" : "Create subscription plan"}</h3>
          </div>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="subscription-plan-form">
          <div className="subscription-plan-form-grid">
            <label className="subscription-plan-field">
              <span>Plan name</span>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Monthly" />
            </label>

            <label className="subscription-plan-field">
              <span>Price (₹)</span>
              <Input name="price" type="number" min="0" step="1" value={form.price} onChange={handleChange} placeholder="599" />
            </label>

            <label className="subscription-plan-field">
              <span>Duration (days)</span>
              <Input name="durationDays" type="number" min="1" step="1" value={form.durationDays} onChange={handleChange} placeholder="30" />
            </label>

            <label className="subscription-plan-field">
              <span>Tagline</span>
              <Input name="tagline" value={form.tagline} onChange={handleChange} placeholder="Most popular" />
            </label>
          </div>

          <label className="subscription-plan-field">
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Describe what this plan includes." />
          </label>

          <label className="subscription-plan-field">
            <span>Features (one per line or comma separated)</span>
            <textarea name="features" value={form.features} onChange={handleChange} rows="5" placeholder="Unlimited rides\nPriority matching\nAnalytics access" />
          </label>

          <div className="subscription-plan-form-grid subscription-plan-limits-grid">
            <label className="subscription-plan-field">
              <span>Max trips</span>
              <Input name="limits.maxTrips" value={form.limits.maxTrips} onChange={handleChange} placeholder="Unlimited" />
            </label>

            <label className="subscription-plan-field">
              <span>Priority</span>
              <Input name="limits.priority" value={form.limits.priority} onChange={handleChange} placeholder="Priority placement" />
            </label>

            <label className="subscription-plan-field">
              <span>Support</span>
              <Input name="limits.support" value={form.limits.support} onChange={handleChange} placeholder="Priority support" />
            </label>
          </div>

          <div className="subscription-plan-toggle-row">
            <label className="subscription-plan-checkbox">
              <input type="checkbox" name="popular" checked={form.popular} onChange={handleChange} />
              Mark as popular
            </label>

            <label className="subscription-plan-checkbox">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              Active plan
            </label>
          </div>

          <div className="subscription-plan-form-actions">
            <Button type="submit" size="md">
              <CheckCircle2 size={16} /> {editingId ? "Save changes" : "Create plan"}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={resetForm}>
              <XCircle size={16} /> Clear
            </Button>
          </div>
        </form>
      </Card>

      <Card className="subscription-plan-list-card">
        <div className="subscription-plan-list-header">
          <div>
            <p className="subscription-plan-form-kicker">Published plans</p>
            <h3>Current subscription catalogue</h3>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => resetForm()}>
            <Plus size={16} /> New plan
          </Button>
        </div>

        <div className="subscription-plan-list">
          {plans.length === 0 && (
            <div className="subscription-plan-empty">
              No plans yet. Create your first subscription offering to activate the user-facing subscription page.
            </div>
          )}

          {plans.map((plan) => (
            <div key={plan.id} className={`subscription-plan-item ${plan.active === false ? "subscription-plan-item--inactive" : ""}`}>
              <div className="subscription-plan-item-topline">
                <div>
                  <div className="subscription-plan-item-title-row">
                    <h4>{plan.name || plan.label}</h4>
                    {plan.popular && <span className="subscription-plan-pill">Popular</span>}
                  </div>
                  <p className="subscription-plan-item-tagline">{plan.tagline || "Flexible access"}</p>
                </div>
                <div className="subscription-plan-item-price">₹{plan.price}</div>
              </div>

              <div className="subscription-plan-item-meta">
                <span><CreditCard size={14} /> {plan.durationDays || plan.days || 30} days</span>
                <span className={plan.active === false ? "subscription-plan-status subscription-plan-status--inactive" : "subscription-plan-status subscription-plan-status--active"}>
                  {plan.active === false ? "Inactive" : "Active"}
                </span>
              </div>

              <p className="subscription-plan-item-description">{plan.description || "No description yet."}</p>

              <ul className="subscription-plan-feature-list">
                {(plan.features || []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="subscription-plan-item-limits">
                <span><strong>Trips:</strong> {plan.limits?.maxTrips || "Unlimited"}</span>
                <span><strong>Priority:</strong> {plan.limits?.priority || "Priority placement"}</span>
                <span><strong>Support:</strong> {plan.limits?.support || "Priority support"}</span>
              </div>

              <div className="subscription-plan-item-actions">
                <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                  <Pencil size={14} /> Edit
                </Button>

                <Button type="button" variant={plan.active === false ? "secondary" : "ghost"} size="sm" onClick={() => toggleActive(plan.id)}>
                  <Power size={14} /> {plan.active === false ? "Activate" : "Deactivate"}
                </Button>

                <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(plan.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
