
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://lvxslzjgfweghhdzfprv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_t6RBDk7G8W1wr19OJDLHuA_fHuz-w2Q";
const STORAGE_BUCKET = "item-photos";

const $ = (selector) => document.querySelector(selector);

const dialog = $("#reportDialog");
const form = $("#reportForm");
const grid = $("#itemsGrid");
const toast = $("#toast");

let reports = [];
let supabase = null;

$("#year").textContent = new Date().getFullYear();
$("#itemDate")?.setAttribute("max", new Date().toISOString().slice(0, 10));
function generateDeleteCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    return "CF-" + hex.match(/.{1,4}/g).join("-");
}

async function hashDeleteCode(code) {
    const data = new TextEncoder().encode(code.trim().toUpperCase());
    const hash = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}
// TOAST MESSAGE
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3000);
}

// OPEN REPORT FORM
function openDialog() {
  dialog.showModal();
}

["#openReport", "#heroReport", "#browseReport"].forEach((id) => {
  const button = $(id);
  if (button) button.addEventListener("click", openDialog);
});

$("#closeDialog").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// HTML SECURITY
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// DATABASE DATA CONVERSION
function mapDatabaseItem(row) {
  return {
    id: row.id,
    type: row.item_type,
    title: row.title,
    category: row.category || "Other",
    description: row.description,
    location: row.campus_location,
    itemDate: row.item_date,
    contactName: row.reporter_name,
    contactEmail: row.contact_email,
    imageUrl: row.image_url || ""
  };
}

// DISPLAY REPORTS
function renderReports() {
  const search = $("#searchInput").value.trim().toLowerCase();
  const type = $("#typeFilter").value;
  const category = $("#categoryFilter").value;

  const filtered = reports.filter((item) => {
    const searchableText = [
      item.title,
      item.description,
      item.location,
      item.category,
      item.contactName
    ].join(" ").toLowerCase();

    return searchableText.includes(search)
      && (type === "all" || item.type === type)
      && (category === "all" || item.category === category);
  });

  $("#totalCount").textContent = reports.length;

  $("#lostCount").textContent =
    reports.filter((item) => item.type === "lost").length;

  $("#foundCount").textContent =
    reports.filter((item) => item.type === "found").length;

  $("#resultsLabel").textContent =
    `${filtered.length} report${filtered.length === 1 ? "" : "s"} found`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div>⌕</div>
        <h3>No reports yet</h3>
        <p>Try another search or be the first to post an item.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((item) => `
    <article class="item-card">
      <div class="item-image">
        ${item.imageUrl
          ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}">`
          : "📦"}
      </div>

      <div class="item-content">
        <div class="item-tags">
          <span class="tag ${item.type === "found" ? "found" : ""}">
            ${escapeHtml(item.type.toUpperCase())}
          </span>
          <span class="category-tag">
            ${escapeHtml(item.category)}
          </span>
        </div>

        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>

        <div class="item-meta">
          <span>📍 ${escapeHtml(item.location)}</span>
          <span>📅 ${escapeHtml(item.itemDate)}</span>
          <span>👤 ${escapeHtml(item.contactName)}</span>
        </div>

        <a class="contact-link"
   href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.contactEmail)}&su=${encodeURIComponent("CampusFind - " + item.title)}&body=${encodeURIComponent("Hello " + item.contactName + ",\n\nI am contacting you regarding your " + item.item_type + " item report: " + item.title + ".\n\nThank you.")}"
   target="_blank"
   rel="noopener noreferrer">
   Contact poster ↗
</a>
     <button
  class="contact-link delete-report-btn"
  type="button"
  data-item-id="${item.id}">
  Delete my report
</button>
 </div>
    </article>
  `).join("");
}
// DELETE REPORT USING PRIVATE DELETE CODE
grid.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-report-btn");

  if (!button) return;

  const itemId = button.dataset.itemId;

  const deleteCode = prompt(
    "Enter your private Delete Code to delete this report:"
  );

  if (!deleteCode) return;

  try {
    button.disabled = true;
    button.textContent = "Deleting...";

    const tokenHash = await hashDeleteCode(deleteCode);

    const { data, error } = await supabase.rpc(
      "delete_item_with_code",
      {
        p_item_id: itemId,
        p_token_hash: tokenHash
      }
    );

    if (error) throw error;

    if (data === true) {
      showToast("Your report has been deleted!");
      await loadReports();
    } else {
      showToast("Incorrect Delete Code. Report not deleted.");
      button.disabled = false;
      button.textContent = "Delete my report";
    }

  } catch (error) {
    console.error("Delete error:", error);
    showToast(error.message || "Could not delete report.");
    button.disabled = false;
    button.textContent = "Delete my report";
  }
});

// SEARCH AND FILTERS
["#searchInput", "#typeFilter", "#categoryFilter"].forEach((id) => {
  $(id).addEventListener(
    id === "#searchInput" ? "input" : "change",
    renderReports
  );
});

// CONNECTION ERROR
function setConnectionError(message) {
  grid.innerHTML = `
    <div class="empty-state">
      <div>⚙</div>
      <h3>Database connection needed</h3>
      <p>${escapeHtml(message)}</p>
      <p>Check Supabase URL and Publishable key in js/app.js.</p>
    </div>`;
}

// LOAD DATABASE REPORTS
async function loadReports() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  reports = (data || []).map(mapDatabaseItem);
  renderReports();
}

// CONNECT SUPABASE
async function connectSupabase() {
  if (
    SUPABASE_URL.includes("YOUR_PROJECT_ID") ||
    SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY"
  ) {
    setConnectionError(
      "Add your Supabase Project URL and Publishable key in js/app.js."
    );
    return;
  }

  try {
    supabase = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    await loadReports();

    // REAL-TIME UPDATES
    const channel = supabase
      .channel("campusfind-items-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items"
        },
        () => {
          loadReports().catch((error) =>
            setConnectionError(error.message)
          );
        }
      )
      .subscribe();

    window.campusFindRealtimeChannel = channel;

  } catch (error) {
    setConnectionError(
      error.message || "Could not connect to Supabase."
    );
  }
}

// SUBMIT REPORT
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  $("#formError").textContent = "";

  if (!supabase) {
    $("#formError").textContent =
      "Supabase is not connected. Check your project URL and key.";
    return;
  }

  const data = new FormData(form);
  const photo = data.get("photo");

  if (photo && photo.size > 5 * 1024 * 1024) {
    $("#formError").textContent =
      "Photo must be smaller than 5 MB.";
    return;
  }

  const submit = $("#submitReport");
  submit.disabled = true;
  submit.textContent = "Publishing…";

  try {
    let imageUrl = "";

    // UPLOAD PHOTO TO SUPABASE STORAGE
    if (photo && photo.size > 0) {
      if (!photo.type.startsWith("image/")) {
        throw new Error("Please select a valid image.");
      }

      const safeName = photo.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const filePath =
        `reports/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(filePath, photo, {
          cacheControl: "3600",
          upsert: false,
          contentType: photo.type
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // PREPARE DATABASE DATA
    const newItem = {
      item_type: data.get("type"),
      title: String(data.get("title")).trim(),
      category: data.get("category") || "Other",
      description: String(data.get("description")).trim(),
      campus_location: String(data.get("location")).trim(),
      item_date: data.get("itemDate"),
      reporter_name: String(data.get("contactName")).trim(),
      contact_email: String(data.get("contactEmail")).trim(),
      image_url: imageUrl
    };

    // GENERATE PRIVATE DELETE CODE
const deleteCode = generateDeleteCode();
const tokenHash = await hashDeleteCode(deleteCode);

// SUBMIT REPORT WITH DELETE CODE HASH
const { data: newItemId, error: insertError } = await supabase
  .rpc("submit_item_with_code", {
    p_item_type: newItem.item_type,
    p_title: newItem.title,
    p_category: newItem.category,
    p_description: newItem.description,
    p_campus_location: newItem.campus_location,
    p_item_date: newItem.item_date,
    p_reporter_name: newItem.reporter_name,
    p_contact_email: newItem.contact_email,
    p_image_url: newItem.image_url || null,
    p_token_hash: tokenHash
  });

if (insertError) throw insertError;

// SHOW PRIVATE DELETE CODE ONCE
alert(
  "Your report has been published successfully!\n\n" +
  "Your private Delete Code is:\n\n" +
  deleteCode +
  "\n\nSave this code safely. You will need it to delete your report later."
);

    form.reset();
    dialog.close();

    showToast("Your report has been published!");

    await loadReports();

  } catch (error) {
    $("#formError").textContent =
      error.message || "Could not publish the report.";

  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Publish report <span>↗</span>';
  }
});

// START APPLICATION
connectSupabase();
