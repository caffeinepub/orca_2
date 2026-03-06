import { triggerCloudSync } from "@/utils/storage";
import { Edit2, Search, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  category: "Client" | "Contractor" | "Vendor" | "Partner";
  notes: string;
  dateAdded: string;
}

const CATS: Contact["category"][] = [
  "Client",
  "Contractor",
  "Vendor",
  "Partner",
];
const CAT_COLORS: Record<string, string> = {
  Client: "bg-blue-100 text-blue-700",
  Contractor: "bg-green-100 text-green-700",
  Vendor: "bg-orange-100 text-orange-700",
  Partner: "bg-purple-100 text-purple-700",
};

export default function RolladexTab() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("orca_rolladex") || "[]");
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    role: "",
    email: "",
    phone: "",
    category: "Client" as Contact["category"],
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem("orca_rolladex", JSON.stringify(contacts));
    triggerCloudSync();
  }, [contacts]);

  const filtered = contacts.filter((c) => {
    const ms =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return ms && (catFilter === "All" || c.category === catFilter);
  });

  const resetForm = () => {
    setForm({
      name: "",
      company: "",
      role: "",
      email: "",
      phone: "",
      category: "Client",
      notes: "",
    });
    setShowForm(false);
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setContacts(
        contacts.map((c) => (c.id === editId ? { ...c, ...form } : c)),
      );
    } else {
      setContacts([
        ...contacts,
        { ...form, id: `c-${Date.now()}`, dateAdded: new Date().toISOString() },
      ]);
    }
    resetForm();
  };

  const handleEdit = (c: Contact) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      company: c.company,
      role: c.role,
      email: c.email,
      phone: c.phone,
      category: c.category,
      notes: c.notes,
    });
    setShowForm(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Delete this contact?"))
      setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-ocid="rolodex.search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div className="flex gap-1">
            {["All", ...CATS].map((c) => (
              <button
                type="button"
                key={c}
                data-ocid="rolodex.filter.tab"
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1 text-xs rounded-full ${catFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} contacts
          </span>
        </div>
        <button
          type="button"
          data-ocid="rolodex.add_button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
        >
          <UserPlus className="w-4 h-4" />
          Add Contact
        </button>
      </div>
      {showForm && (
        <div className="px-6 py-3 bg-primary/5 border-b flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <input
              data-ocid="rolodex.name.input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name *"
              className="px-3 py-1.5 text-sm border rounded flex-1"
            />
            <input
              data-ocid="rolodex.company.input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company"
              className="px-3 py-1.5 text-sm border rounded flex-1"
            />
            <input
              data-ocid="rolodex.role.input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Role"
              className="px-3 py-1.5 text-sm border rounded flex-1"
            />
            <select
              data-ocid="rolodex.category.select"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as Contact["category"],
                })
              }
              className="px-3 py-1.5 text-sm border rounded"
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              data-ocid="rolodex.email.input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="px-3 py-1.5 text-sm border rounded flex-1"
            />
            <input
              data-ocid="rolodex.phone.input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="px-3 py-1.5 text-sm border rounded flex-1"
            />
            <input
              data-ocid="rolodex.notes.input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes"
              className="px-3 py-1.5 text-sm border rounded flex-1"
            />
            <button
              type="button"
              data-ocid="rolodex.save_button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
            >
              {editId ? "Save" : "Add"}
            </button>
            <button
              type="button"
              data-ocid="rolodex.cancel_button"
              onClick={resetForm}
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" data-ocid="rolodex.table">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left px-6 py-2.5 font-semibold text-foreground">
                Name
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Company
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Role
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Email
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Phone
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Category
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-foreground w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr
                key={c.id}
                className="border-b hover:bg-muted/30"
                data-ocid={`rolodex.row.${idx + 1}`}
              >
                <td className="px-6 py-3 font-medium text-foreground">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.company || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.role || "—"}
                </td>
                <td className="px-4 py-3">
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="text-primary hover:underline"
                    >
                      {c.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.phone || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${CAT_COLORS[c.category] || ""}`}
                  >
                    {c.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      data-ocid={`rolodex.edit_button.${idx + 1}`}
                      onClick={() => handleEdit(c)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`rolodex.delete_button.${idx + 1}`}
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            data-ocid="rolodex.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            {contacts.length === 0
              ? "No contacts yet. Add your first contact."
              : "No matching contacts."}
          </div>
        )}
      </div>
    </div>
  );
}
