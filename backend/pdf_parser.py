import pymupdf

# Fewer non-whitespace characters than this almost always means a scanned/image-only PDF.
MIN_TEXT_CHARS = 100


class PDFError(Exception):
    """A problem with the uploaded PDF that the user can understand and fix."""

    def __init__(self, message, status_code=422):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def extract_text(pdf_bytes):
    """Return (text, page_count) from a PDF held in memory.

    The file is never written to disk, so there is nothing to clean up afterwards.
    """
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        raise PDFError("This PDF could not be read. It may be corrupted. Please upload a different file.")

    with doc:
        if doc.needs_pass:
            raise PDFError("This PDF is password-protected. Please upload an unprotected copy.")
        if doc.page_count == 0:
            raise PDFError("This PDF has no pages. Please upload your resume as a PDF.")
        try:
            pages = [page.get_text() for page in doc]
        except Exception:
            raise PDFError("This PDF could not be read. It may be corrupted. Please upload a different file.")
        page_count = doc.page_count

    text = "\n".join(pages).replace("\r", "").strip()
    if len("".join(text.split())) < MIN_TEXT_CHARS:
        raise PDFError(
            "We could not find enough text in this PDF. It may be scanned or image-only. "
            "Please upload a text-based PDF (for example, exported from Word or Google Docs)."
        )
    return text, page_count
