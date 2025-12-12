const form = document.querySelector("#message-form");
const statusEl = document.querySelector("#status");

const updateStatus = (text, type = "") => {
  statusEl.textContent = text;
  statusEl.classList.remove("status-success", "status-error");
  if (type) statusEl.classList.add(type);
};

// Template information
const templates = {
  hello_world: {
    message: "Hello! This is a test message from our School ERP WhatsApp integration.",
    fields: "None (no parameters)",
    payload: "{}"
  },
  attendance_alert: {
    message: "Attendance alert: {{1}} was marked {{2}} on {{3}} as per school records.",
    fields: "student_name, status, date",
    payload: JSON.stringify({
      student_name: "Rahul",
      status: "Absent",
      date: "2025-11-04"
    }, null, 2)
  }
};

// Update template info when template changes
window.updateTemplateInfo = () => {
  const templateName = document.getElementById("templateName").value;
  const template = templates[templateName];
  
  if (template) {
    const infoDiv = document.getElementById("template-info");
    infoDiv.innerHTML = `
      <p><strong>Meta Template:</strong> ${template.message}</p>
      <p><strong>Required fields:</strong> ${template.fields}</p>
    `;
    document.getElementById("payload").value = template.payload;
  }
};

// Helper function to switch to hello_world template
window.useHelloWorld = () => {
  document.getElementById("templateName").value = "hello_world";
  updateTemplateInfo();
  updateStatus("Switched to hello_world template", "status-success");
};

const parseRecipients = (value) =>
  value
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean)
    .map((phone) => ({ phone }));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  updateStatus("Sending…");

  const formData = new FormData(form);
  const recipients = parseRecipients(formData.get("recipients"));
  if (recipients.length === 0) {
    updateStatus("Please add at least one recipient phone.", "status-error");
    return;
  }

  let payload;
  try {
    payload = JSON.parse(formData.get("payload"));
  } catch (error) {
    updateStatus("Payload must be valid JSON.", "status-error");
    return;
  }

  const body = {
    tenantId: formData.get("tenantId"),
    type: formData.get("type"),
    templateName: formData.get("templateName"),
    language: formData.get("language"),
    payload,
    recipients,
    priority: formData.get("priority")
  };

  try {
    const response = await fetch("/api/v1/message-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const details = errorBody.details || errorBody.error || JSON.stringify(errorBody);
      throw new Error(details || "Unknown error");
    }
    const result = await response.json();
    updateStatus(`Job queued! Job ID: ${result.jobId}`, "status-success");
  } catch (error) {
    updateStatus(`Failed to queue message: ${error.message}`, "status-error");
  }
});


