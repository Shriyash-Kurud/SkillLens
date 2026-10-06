/* ---------- 1. Mobile navigation (runs on every page) ---------- */
const menuButton = document.getElementById("menu-button");
const navLinks = document.getElementById("nav-links");

menuButton.addEventListener("click", function () {
  const isOpen = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen);
});

/* ---------- 2. Resume upload (only exists on analyze.html) ---------- */
const fileInput = document.getElementById("file-input");

if (fileInput) {
  const uploadBox = document.getElementById("upload-box");
  const selectedBox = document.getElementById("selected-box");
  const browseButton = document.getElementById("browse-button");
  const replaceButton = document.getElementById("replace-button");
  const removeButton = document.getElementById("remove-button");
  const fileName = document.getElementById("file-name");
  const fileInfo = document.getElementById("file-info");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  const MAX_SIZE_MB = 10;
  let selectedFile = null; // kept only in memory; never read or uploaded

  // Check the file and either show it or show an error
  function handleFile(file) {
    errorMessage.textContent = "";
    successMessage.textContent = "";

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      errorMessage.textContent = "Please upload a PDF file.";
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      errorMessage.textContent = "File size must be less than 10 MB.";
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileInfo.textContent = "PDF Document • " + (file.size / (1024 * 1024)).toFixed(1) + " MB";
    uploadBox.hidden = true;
    selectedBox.hidden = false;
    successMessage.textContent = "Resume selected successfully.";
  }

  // Go back to the empty upload box
  function removeFile() {
    selectedFile = null;
    fileInput.value = "";
    selectedBox.hidden = true;
    uploadBox.hidden = false;
    errorMessage.textContent = "";
    successMessage.textContent = "";
  }

  // Browse / Replace open the file picker
  browseButton.addEventListener("click", function () { fileInput.click(); });
  replaceButton.addEventListener("click", function () { fileInput.click(); });
  removeButton.addEventListener("click", removeFile);

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    fileInput.value = ""; // lets the same file be chosen again
  });

  // Drag and drop (works on both boxes, so dropping also replaces)
  [uploadBox, selectedBox].forEach(function (box) {
    box.addEventListener("dragover", function (event) {
      event.preventDefault();
      box.classList.add("dragging");
    });
    box.addEventListener("dragleave", function () {
      box.classList.remove("dragging");
    });
    box.addEventListener("drop", function (event) {
      event.preventDefault();
      box.classList.remove("dragging");
      if (event.dataTransfer.files.length > 0) handleFile(event.dataTransfer.files[0]);
    });
  });

  // The Analyze button stays disabled in this version (it is disabled in the HTML).
  // Later, enable it when selectedFile is set and send selectedFile to a backend.
}