/** Medora style reminder — owner-only catalogue workspace with a calm, auditable clinical-search interface. */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Archive, CheckCircle2, ClipboardList, ExternalLink, Plus, ShieldAlert } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import "../adminCatalogue.css";

type UploadForm = {
  genericName: string;
  brandNames: string;
  searchTerms: string;
  activeIngredient: string;
  medicineClass: string;
  informationSummary: string;
  safetyNote: string;
  jurisdiction: string;
  sourceUrl: string;
  reviewerName: string;
  reviewedAt: string;
  status: "draft" | "approved";
};

const emptyForm = (): UploadForm => ({
  genericName: "",
  brandNames: "",
  searchTerms: "",
  activeIngredient: "",
  medicineClass: "",
  informationSummary: "",
  safetyNote: "",
  jurisdiction: "US",
  sourceUrl: "",
  reviewerName: "",
  reviewedAt: new Date().toISOString().slice(0, 10),
  status: "draft",
});

export default function AdminCatalogue() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<UploadForm>(emptyForm);
  const [attested, setAttested] = useState(false);
  const [openForm, setOpenForm] = useState(true);
  const isAdmin = user?.role === "admin";
  const catalogue = trpc.catalogue.listForAdmin.useQuery(undefined, { enabled: isAdmin });
  const itemCount = useMemo(() => catalogue.data?.length ?? 0, [catalogue.data]);

  const createItem = trpc.catalogue.create.useMutation({
    onSuccess: async () => {
      toast.success("Catalogue entry saved.");
      setForm(emptyForm());
      setAttested(false);
      await utils.catalogue.listForAdmin.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const setStatus = trpc.catalogue.setStatus.useMutation({
    onSuccess: async () => {
      toast.success("Catalogue status updated.");
      await utils.catalogue.listForAdmin.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!attested) {
      toast.error("Confirm that the entry was clinically reviewed before saving it.");
      return;
    }
    createItem.mutate({ ...form, reviewedAt: new Date(form.reviewedAt) });
  }

  return (
    <DashboardLayout>
      <div className="catalogue-admin-shell">
        {!isAdmin ? (
          <section className="catalogue-access-card">
            <ShieldAlert size={28} aria-hidden="true" />
            <p className="catalogue-kicker">OWNER ACCESS REQUIRED</p>
            <h1>Medicine uploads are reserved for the Medora owner.</h1>
            <p>Sign in with the project owner account. The public site only searches approved entries; it cannot add or change the catalogue.</p>
          </section>
        ) : (
          <>
            <section className="catalogue-hero">
              <div>
                <p className="catalogue-kicker">MEDORA ADMIN / CATALOGUE CONTROL</p>
                <h1>Upload a medicine once. Match it to the right search terms.</h1>
                <p>Each entry remains a <strong>draft</strong> until you explicitly approve it. Only approved entries can appear in public searches, and Medora will show them as informational catalogue matches—not diagnoses or dosing advice.</p>
              </div>
              <div className="catalogue-count-card"><ClipboardList size={22} aria-hidden="true" /><span>{itemCount}</span><b>catalogue entries</b></div>
            </section>

            <section className="catalogue-workspace">
              <div className="catalogue-section-heading">
                <div><p className="catalogue-kicker">NEW ENTRY</p><h2>Clinical information required before a listing is searchable.</h2></div>
                <button className="catalogue-toggle" type="button" onClick={() => setOpenForm((open) => !open)}>{openForm ? "Hide upload form" : "Add medicine"} <Plus size={16} /></button>
              </div>

              {openForm && (
                <form className="catalogue-form" onSubmit={submit}>
                  <label><span>Generic medicine name</span><input required name="genericName" value={form.genericName} onChange={updateField} placeholder="e.g., generic name on the label" /></label>
                  <label><span>Brand names <em>(optional)</em></span><input name="brandNames" value={form.brandNames} onChange={updateField} placeholder="Comma-separated brand names" /></label>
                  <label className="wide"><span>Search terms / symptoms / illnesses</span><input required name="searchTerms" value={form.searchTerms} onChange={updateField} placeholder="e.g., headache, sinus pressure, nasal congestion" /><small>Use commas to add the exact searches that may surface this entry. Avoid broad or unsupported claims.</small></label>
                  <label><span>Active ingredient(s)</span><input required name="activeIngredient" value={form.activeIngredient} onChange={updateField} placeholder="Copy from the approved product label" /></label>
                  <label><span>Medicine class</span><input required name="medicineClass" value={form.medicineClass} onChange={updateField} placeholder="e.g., antihistamine" /></label>
                  <label className="wide"><span>Information summary</span><textarea required name="informationSummary" value={form.informationSummary} onChange={updateField} placeholder="Plain-language informational description only. Do not add personalized instructions or dosage." /></label>
                  <label className="wide"><span>Safety note</span><textarea required name="safetyNote" value={form.safetyNote} onChange={updateField} placeholder="Key prompt to speak with a pharmacist, review a label, or seek professional care." /></label>
                  <label><span>Jurisdiction</span><input required name="jurisdiction" value={form.jurisdiction} onChange={updateField} placeholder="e.g., US" /></label>
                  <label><span>Clinical reviewer</span><input required name="reviewerName" value={form.reviewerName} onChange={updateField} placeholder="Name or team responsible for review" /></label>
                  <label className="wide"><span>Authoritative source URL</span><input required type="url" name="sourceUrl" value={form.sourceUrl} onChange={updateField} placeholder="https://…" /></label>
                  <label><span>Review date</span><input required type="date" name="reviewedAt" value={form.reviewedAt} onChange={updateField} /></label>
                  <label><span>Publishing status</span><select name="status" value={form.status} onChange={updateField}><option value="draft">Save as draft</option><option value="approved">Approve for public search</option></select></label>
                  <label className="catalogue-attestation wide"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} /><span>I confirm the uploaded entry has an appropriate source and clinical review. I understand this is informational content, not a patient-specific recommendation.</span></label>
                  <div className="catalogue-form-actions wide"><button className="catalogue-save" disabled={createItem.isPending} type="submit">{createItem.isPending ? "Saving…" : form.status === "approved" ? "Approve & add to search" : "Save draft"} <CheckCircle2 size={17} /></button><p>Drafts never appear to public visitors. Approved entries are matched only against the search terms you enter.</p></div>
                </form>
              )}
            </section>

            <section className="catalogue-list-section">
              <aside className="catalogue-owner-guide">
                <div><p className="catalogue-kicker">OWNER WORKFLOW</p><h3>How your upload becomes a public catalogue match.</h3></div>
                <div className="owner-guide-steps"><p><b>1. Add label-backed details.</b> Enter the generic name, active ingredient, source, reviewer, and the exact search terms you want to support.</p><p><b>2. Save a draft first.</b> Draft and archived records stay private. Check the language, source, jurisdiction, and safety note before approval.</p><p><b>3. Approve only reviewed records.</b> Public search matches the approved terms you entered. It does not diagnose, select a dose, or determine whether a medicine is appropriate for a person.</p></div>
                <div className="catalogue-match-example"><p className="catalogue-kicker">EXAMPLE MATCH SETUP</p><p>To make a search for <b>“fever”</b> surface your reviewed <b>Paracetamol</b> information record, enter <b>Paracetamol</b> as the medicine name and include <b>fever</b> in its <b>Search terms / symptoms / illnesses</b> field. Add your authoritative source, reviewer, safety note, and review date; then approve the entry when your review is complete.</p></div>
              </aside>
              <div className="catalogue-section-heading"><div><p className="catalogue-kicker">CURRENT CATALOGUE</p><h2>Control what can appear in search.</h2></div></div>
              {catalogue.isLoading ? <p className="catalogue-loading">Loading catalogue…</p> : catalogue.data?.length ? (
                <div className="catalogue-list">
                  {catalogue.data.map((item) => (
                    <article className="catalogue-item" key={item.id}>
                      <div className="catalogue-item-main"><p className={`status-chip ${item.status}`}>{item.status}</p><h3>{item.genericName}</h3><p className="catalogue-item-detail"><b>Active ingredient:</b> {item.activeIngredient}</p><p className="catalogue-item-detail"><b>Matches:</b> {item.searchTerms}</p></div>
                      <div className="catalogue-item-meta"><span>{item.jurisdiction} · reviewed {new Date(item.reviewedAt).toLocaleDateString()}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a></div>
                      <div className="catalogue-item-actions">
                        {item.status !== "approved" && <button type="button" onClick={() => setStatus.mutate({ id: item.id, status: "approved" })}>Approve</button>}
                        {item.status !== "draft" && <button type="button" onClick={() => setStatus.mutate({ id: item.id, status: "draft" })}>Move to draft</button>}
                        {item.status !== "archived" && <button className="archive" type="button" onClick={() => setStatus.mutate({ id: item.id, status: "archived" })}><Archive size={14} /> Archive</button>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="catalogue-empty"><ClipboardList size={23} /><p>No entries yet. Add the first clinically reviewed medicine record above. It will stay private until you approve it.</p></div>}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
