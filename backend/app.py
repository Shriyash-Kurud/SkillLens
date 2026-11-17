import logging
import os

from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

# Load GEMINI_API_KEY etc. from backend/.env before anything reads os.environ.
load_dotenv()

import ai_analyzer  # noqa: E402  (must be imported after load_dotenv)
import pdf_parser  # noqa: E402
import scoring  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("skilllens")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

DISCLAIMER = (
    "This score reflects general resume quality (content, clarity and presentation). "
    "It is not a prediction of hiring success."
)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv("FRONTEND_ORIGIN", "https://shriyash-kurud.github.io"),
    }
})
# Slightly above 10 MB so multipart overhead doesn't reject a file that is exactly at the limit;
# the exact file-size check is done in analyze().
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + 64 * 1024


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
def analyze():
    upload = request.files.get("resume")
    if upload is None or not upload.filename:
        return error_response("No file was uploaded. Please choose a PDF resume.", 400)

    if not upload.filename.lower().endswith(".pdf"):
        return error_response("Unsupported file type. Please upload a PDF file.", 415)

    pdf_bytes = upload.read(MAX_UPLOAD_BYTES + 1)
    if len(pdf_bytes) > MAX_UPLOAD_BYTES:
        return error_response("The file is larger than 10 MB. Please upload a smaller PDF.", 413)
    if not pdf_bytes:
        return error_response("The uploaded file is empty. Please choose another PDF.", 400)
    # Real PDFs start with "%PDF-"; this catches renamed files of other types.
    if not pdf_bytes.lstrip().startswith(b"%PDF-"):
        return error_response("This file is not a valid PDF. Please upload a PDF file.", 415)

    try:
        text, page_count = pdf_parser.extract_text(pdf_bytes)
        analysis = ai_analyzer.analyze_resume(text)
        scores = analysis.category_scores.model_dump()
        overall_score = scoring.calculate_overall_score(scores)
    except pdf_parser.PDFError as error:
        return error_response(error.message, error.status_code)
    except ai_analyzer.AIError as error:
        return error_response(error.message, error.status_code)

    # Log only sizes, never resume content.
    logger.info("Analyzed resume: pages=%d chars=%d score=%d", page_count, len(text), overall_score)

    return jsonify(
        {
            "overall_score": overall_score,
            "score_label": scoring.score_label(overall_score),
            "category_scores": scoring.build_breakdown(scores),
            "overall_summary": analysis.overall_summary,
            "strengths": [item.model_dump() for item in analysis.strengths],
            "weaknesses": [item.model_dump() for item in analysis.weaknesses],
            "missing_elements": [item.model_dump() for item in analysis.missing_elements],
            "suggestions": [item.model_dump() for item in analysis.suggestions],
            "category_feedback": [item.model_dump() for item in analysis.category_feedback],
            "sections_to_rewrite": [item.model_dump() for item in analysis.sections_to_rewrite],
            "metadata": {"page_count": page_count},
            "disclaimer": DISCLAIMER,
        }
    )


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    # Keep HTTP errors (404, 405, 413...) as they are, but return them as JSON.
    if isinstance(error, HTTPException):
        message = "The file is larger than 10 MB. Please upload a smaller PDF." if error.code == 413 else error.description
        return error_response(message, error.code)
    logger.exception("Unexpected error")
    return error_response("Something went wrong on the server. Please try again.", 500)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
