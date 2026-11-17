"""Builds the SkillLens mini project report (PDF), following the structure of the reference report.

Run:  python build_report.py
Needs: reportlab  (pip install reportlab)
"""
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, Image, KeepTogether, NextPageTemplate,
                                PageBreak, PageTemplate, Paragraph, Preformatted, Spacer, Table, TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
OUTPUT = os.path.join(HERE, "SkillLens_Project_Report.pdf")

PROJECT = "SkillLens : AI Based Resume Analysis"
SUBTITLE = "AI-Based Resume Quality Analysis Platform"
GUIDE, HOD, PRINCIPAL = "Prof. N. P. Kamble", "Prof. Dr. Ashwini A. Patil", "Prof. Dr. S. M. Jagade"
BLANK_LINE = "_" * 34
STUDENT, SEAT_NO = "Shriyash Kurud", "2502129111911502"

W, H = A4
MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM = 74, 72, 72
TEXT_W = W - 2 * MARGIN_X

# ---------------------------------------------------------------- styles
BASE = dict(fontName="Times-Roman", fontSize=12, leading=17.5, alignment=TA_JUSTIFY, spaceAfter=7)
body = ParagraphStyle("body", **BASE)
bullet = ParagraphStyle("bullet", **{**BASE, "spaceAfter": 4}, leftIndent=36, bulletIndent=18)
bullet_left = ParagraphStyle("bullet_left", parent=bullet, alignment=TA_LEFT)
numbered = ParagraphStyle("numbered", **{**BASE, "spaceAfter": 6}, leftIndent=36, bulletIndent=14)
center = ParagraphStyle("center", **{**BASE, "alignment": TA_CENTER})
chapter_no = ParagraphStyle("chapter_no", fontName="Times-Bold", fontSize=14, leading=18, alignment=TA_CENTER, spaceAfter=2)
chapter_title = ParagraphStyle("chapter_title", fontName="Times-Bold", fontSize=16, leading=20, alignment=TA_CENTER, spaceAfter=14)
h1 = ParagraphStyle("h1", fontName="Times-Bold", fontSize=14, leading=18, spaceBefore=8, spaceAfter=8, keepWithNext=1)
h2 = ParagraphStyle("h2", fontName="Times-Bold", fontSize=12, leading=16, spaceBefore=6, spaceAfter=4, keepWithNext=1)
caption = ParagraphStyle("caption", fontName="Times-Bold", fontSize=11, leading=14, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)
cell = ParagraphStyle("cell", fontName="Times-Roman", fontSize=10.5, leading=13.5, alignment=TA_LEFT)
cell_head = ParagraphStyle("cell_head", parent=cell, fontName="Times-Bold")
code = ParagraphStyle("code", fontName="Courier", fontSize=8.5, leading=10.5, leftIndent=6, rightIndent=6,
                      backColor=colors.HexColor("#F3F3F3"), borderColor=colors.HexColor("#BBBBBB"), borderWidth=0.6, borderPadding=6,
                      spaceBefore=6, spaceAfter=12)

# ---------------------------------------------------------------- contents structure (same layout as the reference)
STRUCTURE = [
    ("ack", "", "ACKNOWLEDGEMENT", 0), ("abs", "", "ABSTRACT", 0),
    ("1", "1", "INTRODUCTION", 0), ("1.1", "1.1", "Introduction", 1), ("1.2", "1.2", "Problem Statement", 1),
    ("1.3", "1.3", "Objectives", 1), ("1.4", "1.4", "Scope of the Project", 1),
    ("2", "2", "REQUIREMENT GATHERING", 0), ("2.1", "2.1", "Functional Requirements", 1),
    ("2.2", "2.2", "Non-Functional Requirements", 1), ("2.3", "2.3", "Hardware and Software Requirements", 1),
    ("3", "3", "PROPOSED SYSTEM", 0), ("3.1", "3.1", "Overview", 1), ("3.2", "3.2", "Working of the System", 1),
    ("4", "4", "DESIGN AND MODELING", 0), ("4.1", "4.1", "Flowchart", 1), ("4.2", "4.2", "System Architecture", 1),
    ("4.3", "4.3", "Workflow", 1),
    ("5", "5", "SDLC MODEL USED FOR IMPLEMENTATION", 0), ("5.1", "5.1", "Agile Model", 1), ("5.2", "5.2", "Sprint Plan", 1),
    ("6", "6", "TECHNOLOGY USED", 0), ("6.1", "6.1", "Technology Stack", 1), ("6.2", "6.2", "Description of Technologies", 1),
    ("7", "7", "IMPLEMENTATION", 0), ("7.1", "7.1", "Setting up the Environment", 1), ("7.2", "7.2", "Importing the Project", 1),
    ("7.3", "7.3", "Configuring the LLM API", 1), ("7.4", "7.4", "Running the Project", 1), ("7.5", "7.5", "Main Modules", 1),
    ("8", "8", "EXECUTION / SYSTEM OUTPUTS", 0), ("8.1", "8.1", "Output Screenshots", 1),
    ("9", "9", "OUTCOME", 0), ("9.1", "9.1", "Outcome of the Project", 1),
    ("10", "10", "CONCLUSION", 0), ("10.1", "10.1", "Conclusion", 1),
    ("11", "11", "FUTURE SCOPE", 0), ("11.1", "11.1", "Future Scope", 1),
    ("ref", "", "REFERENCES", 0),
]
TITLES = {key: (num, title, level) for key, num, title, level in STRUCTURE}


def esc(text):
    return text.replace("&", "&amp;")


def P(text, style=body):
    return Paragraph(esc(text) if "<" not in text else text, style)


def tagged(key, style, text):
    paragraph = Paragraph(text, style)
    paragraph.toc_key = key
    return paragraph


def chapter(key):
    num, title, _ = TITLES[key]
    return [PageBreak(), Paragraph(f"CHAPTER {num}", chapter_no), tagged(key, chapter_title, title)]


def section(key):
    num, title, _ = TITLES[key]
    return tagged(key, h1, f"{num} {title}")


def bullets(items, style=None):
    return [Paragraph(item, style or bullet, bulletText="\u2022") for item in items]


def numbered_list(items):
    return [Paragraph(item, numbered, bulletText=f"{i}.") for i, item in enumerate(items, 1)]


def table(rows, widths, header=True):
    data = []
    for r, row in enumerate(rows):
        data.append([Paragraph(c, cell_head if (header and r == 0) else cell) for c in row])
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    style = [("GRID", (0, 0), (-1, -1), 0.6, colors.black), ("VALIGN", (0, 0), (-1, -1), "TOP"),
             ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
             ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF7")))
    t.setStyle(TableStyle(style))
    return [t, Spacer(1, 12)]


def figure(filename, number, text, max_h=285):
    path = os.path.join(FIG, filename)
    width, height = ImageReader(path).getSize()
    scale = min(TEXT_W / width, max_h / height)
    image = Image(path, width=width * scale, height=height * scale)
    image.hAlign = "CENTER"
    box = Table([[image]], colWidths=[width * scale + 2])
    box.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#888888")), ("LEFTPADDING", (0, 0), (-1, -1), 1),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 1), ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    box.hAlign = "CENTER"
    return KeepTogether([box, Paragraph(f"Figure {number}: {esc(text)}", caption)])


# ---------------------------------------------------------------- diagrams
class Diagram(Flowable):
    """Small drawing helpers shared by the flowchart, architecture and workflow figures."""
    font = "Times-Roman"
    fill = colors.HexColor("#DCE8F5")
    decision = colors.HexColor("#FFF1C9")

    def y(self, top):  # convert "distance from top" to canvas y
        return self.height - top

    def label(self, x, y, text, size=8.5, bold=False, color=colors.black):
        c = self.canv
        c.setFillColor(color)
        c.setFont("Times-Bold" if bold else self.font, size)
        lines = text.split("\n")
        start = y + (len(lines) - 1) * (size + 1.5) / 2 - size * 0.3
        for i, line in enumerate(lines):
            c.drawCentredString(x, start - i * (size + 1.5), line)

    def rect(self, cx, top, w, h, text, fill=None, size=8.5):
        c = self.canv
        c.setFillColor(fill or self.fill)
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.8)
        c.rect(cx - w / 2, self.y(top) - h, w, h, fill=1, stroke=1)
        self.label(cx, self.y(top) - h / 2, text, size)

    def oval(self, cx, top, w, h, text):
        c = self.canv
        c.setFillColor(self.fill)
        c.setLineWidth(0.8)
        c.ellipse(cx - w / 2, self.y(top) - h, cx + w / 2, self.y(top), fill=1, stroke=1)
        self.label(cx, self.y(top) - h / 2, text, 8.5)

    def diamond(self, cx, top, w, h, text):
        c = self.canv
        cy = self.y(top) - h / 2
        path = c.beginPath()
        path.moveTo(cx - w / 2, cy)
        path.lineTo(cx, cy + h / 2)
        path.lineTo(cx + w / 2, cy)
        path.lineTo(cx, cy - h / 2)
        path.close()
        c.setFillColor(self.decision)
        c.setLineWidth(0.8)
        c.drawPath(path, fill=1, stroke=1)
        self.label(cx, cy, text, 8)

    def line(self, *points, arrow=True):
        c = self.canv
        c.setStrokeColor(colors.black)
        c.setFillColor(colors.black)
        c.setLineWidth(0.8)
        path = c.beginPath()
        path.moveTo(*points[0])
        for point in points[1:]:
            path.lineTo(*point)
        c.drawPath(path, fill=0, stroke=1)
        if arrow:
            (x1, y1), (x2, y2) = points[-2], points[-1]
            dx, dy = x2 - x1, y2 - y1
            length = (dx * dx + dy * dy) ** 0.5 or 1
            ux, uy = dx / length, dy / length
            head = c.beginPath()
            head.moveTo(x2, y2)
            head.lineTo(x2 - 5 * ux + 2.6 * uy, y2 - 5 * uy - 2.6 * ux)
            head.lineTo(x2 - 5 * ux - 2.6 * uy, y2 - 5 * uy + 2.6 * ux)
            head.close()
            c.drawPath(head, fill=1, stroke=0)


class FlowChart(Diagram):
    """Figure 4.1: what happens from opening the site to seeing the result."""
    def __init__(self):
        super().__init__()
        self.width, self.height = TEXT_W, 486

    def wrap(self, availW, availH):
        return self.width, self.height

    def draw(self):
        cx, gap = 135, 11
        nodes = [("oval", "START", 24), ("rect", "Open the SkillLens website", 26),
                 ("rect", "Upload PDF resume\n(drag and drop or browse)", 32), ("dia", "Valid PDF?\n(type, size)", 46),
                 ("rect", "Backend reads the text of\nevery page (PyMuPDF)", 32), ("dia", "Enough text\nfound?", 46),
                 ("rect", "Send resume text and\nprompt to Gemini API", 32), ("dia", "Valid AI\nresponse?", 46),
                 ("rect", "Python calculates the\nweighted overall score", 32), ("rect", "Show results dashboard", 26),
                 ("oval", "END / STOP", 24)]
        tops, top = [], 4
        for kind, text, h in nodes:
            tops.append((top, h))
            top += h + gap
        for (kind, text, h), (t, _) in zip(nodes, tops):
            if kind == "oval":
                self.oval(cx, t, 120, h, text)
            elif kind == "rect":
                self.rect(cx, t, 180, h, text)
            else:
                self.diamond(cx, t, 150, h, text)
        for i in range(len(nodes) - 1):  # straight arrows between neighbouring boxes
            (t1, h1), (t2, _) = tops[i], tops[i + 1]
            self.line((cx, self.y(t1 + h1)), (cx, self.y(t2)))
            if nodes[i][0] == "dia":
                self.label(cx + 13, self.y(t1 + h1 + gap / 2), "Yes", 7.5)
        errors = {3: "Show error message\nand ask again", 5: "Ask for a text-based\nPDF (not scanned)", 7: "Try next AI model,\nor show a clear error"}
        back_to = {3: 2, 5: 2, 7: 6}  # decision index -> node it loops back to
        bx, bw, bh = 330, 122, 34
        lane = {3: 408, 5: 424, 7: 398}
        for idx, text in errors.items():
            t, h = tops[idx]
            mid = t + h / 2
            self.line((cx + 75, self.y(mid)), (bx - bw / 2, self.y(mid)))
            self.label(cx + 88, self.y(mid) + 6, "No", 7.5)
            self.rect(bx, mid - bh / 2, bw, bh, text, fill=colors.HexColor("#F9DADA"), size=8)
            target_top, target_h = tops[back_to[idx]]
            target_mid = target_top + target_h / 2
            self.line((bx + bw / 2, self.y(mid)), (lane[idx], self.y(mid)), (lane[idx], self.y(target_mid)),
                      (cx + 90, self.y(target_mid)))


class ArchitectureFigure(Diagram):
    """Figure 4.2: the three parts of the system."""
    def __init__(self):
        super().__init__()
        self.width, self.height = TEXT_W, 193

    def wrap(self, availW, availH):
        return self.width, self.height

    def draw(self):
        c = self.canv
        lx, mx, rx = 52, 223, 395
        self.rect(lx, 30, 104, 120, "FRONTEND\n(Browser)\n\nReact + TypeScript\n+ Vite\n\nUpload page,\nresults dashboard", size=8)
        self.rect(rx, 30, 104, 120, "AI SERVICE\n\nGoogle Gemini API\n(existing LLM)\n\nReads the resume text\nand returns the\nanalysis as JSON", size=8)
        c.setFillColor(colors.HexColor("#EEF3FA"))
        c.setLineWidth(0.8)
        c.rect(mx - 68, self.y(30) - 150, 136, 150, fill=1, stroke=1)
        self.label(mx, self.y(30) - 10, "BACKEND (Python + Flask)", 8, bold=True)
        modules = ["app.py : API route", "pdf_parser.py : PDF text", "ai_analyzer.py : Gemini", "scoring.py : final score"]
        for i, text in enumerate(modules):
            self.rect(mx, 52 + i * 31, 124, 24, text, size=7.5)
        for (x1, x2, up, down) in ((lx + 52, mx - 68, "PDF file", "JSON result"), (mx + 68, rx - 52, "Resume text", "Analysis JSON")):
            self.line((x1, self.y(68)), (x2, self.y(68)))
            self.line((x2, self.y(102)), (x1, self.y(102)))
            self.label((x1 + x2) / 2, self.y(60), up, 7.5)
            self.label((x1 + x2) / 2, self.y(110), down, 7.5)
        self.label(self.width / 2, 4, "Requests travel left to right; results travel back right to left.", 8.5)


class WorkflowFigure(Diagram):
    """Figure 4.3: the workflow as six numbered steps."""
    def __init__(self):
        super().__init__()
        self.width, self.height = TEXT_W, 134

    def wrap(self, availW, availH):
        return self.width, self.height

    def draw(self):
        w, h, xs = 112, 44, (62, 223, 385)
        row1 = ["1. Upload PDF\nresume", "2. Validate file and\nextract text", "3. AI analysis\n(Gemini)"]
        row2 = ["4. Check AI\nresponse", "5. Calculate\nweighted score", "6. Show results\ndashboard"]
        for x, text in zip(xs, row1):
            self.rect(x, 4, w, h, text)
        for x, text in zip(reversed(xs), row2):
            self.rect(x, 88, w, h, text)
        for i in range(2):
            self.line((xs[i] + w / 2, self.y(26)), (xs[i + 1] - w / 2, self.y(26)))
            self.line((xs[2 - i] - w / 2, self.y(110)), (xs[1 - i] + w / 2, self.y(110)))
        self.line((xs[2], self.y(48)), (xs[2], self.y(88)))


# ---------------------------------------------------------------- document
class ReportDoc(BaseDocTemplate):
    def __init__(self, filename, pages):
        super().__init__(filename, pagesize=A4, title=PROJECT + " - Mini Project Report", author="", leftMargin=MARGIN_X,
                         rightMargin=MARGIN_X, topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM)
        self.known_pages = pages
        self.found_pages = {}
        full = Frame(MARGIN_X, MARGIN_BOTTOM, TEXT_W, H - MARGIN_TOP - MARGIN_BOTTOM, id="f", leftPadding=0, rightPadding=0,
                     topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id="cover", frames=[full], onPage=self.draw_border),
                               PageTemplate(id="main", frames=[full], onPage=self.draw_number)])

    @staticmethod
    def draw_border(canvas, doc):
        canvas.saveState()
        canvas.setLineWidth(2.5)
        canvas.rect(40, 40, W - 80, H - 80)
        canvas.restoreState()

    @staticmethod
    def draw_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Times-Roman", 11)
        canvas.drawCentredString(W / 2, 34, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        key = getattr(flowable, "toc_key", None)
        if key:
            self.found_pages[key] = self.page


def logo(width):
    path = os.path.join(FIG, "college_logo.png")
    w, h = ImageReader(path).getSize()
    image = Image(path, width=width, height=width * h / w, mask="auto")
    image.hAlign = "CENTER"
    return image


def cover_page():
    return [Spacer(1, 38), logo(150), Spacer(1, 22),
            Paragraph("<b>A MINI PROJECT REPORT</b>", center), Spacer(1, 14),
            Paragraph(f'<font size="26"><b>{PROJECT}</b></font>', ParagraphStyle("t", parent=center, leading=32)), Spacer(1, 6),
            Paragraph(SUBTITLE, center), Spacer(1, 22),
            Paragraph("SUBMITTED IN THE PARTIAL FULFILLMENT OF THE REQUIREMENTS OF", center), Spacer(1, 8),
            Paragraph('<font size="14">THIRD YEAR ENGINEERING</font>', center), Spacer(1, 16),
            Paragraph("<b>SUBMITTED BY</b>", center), Spacer(1, 10),
            Paragraph(f"<b>STUDENT NAME:</b> {STUDENT}", center),
            Paragraph(f"<b>EXAM SEAT NO:</b> {SEAT_NO}", center), Spacer(1, 46),
            Paragraph("Department of Artificial Intelligence and Machine Learning", center),
            Paragraph("<b>M.S. Bidve Engineering College, Latur</b>", center),
            Paragraph("<b>A.Y. 2026-2027</b>", center)]


def signature_block(name, title, width=190):
    """Name centered above a short line, with the designation centered below the line."""
    centered = ParagraphStyle("sig", parent=body, alignment=TA_CENTER, spaceAfter=0, leading=16)
    t = Table([[Paragraph(f"<b>{name}</b>", centered)], [Paragraph(f"<b>{title}</b>", centered)]], colWidths=[width])
    t.setStyle(TableStyle([("LINEABOVE", (0, 1), (0, 1), 0.8, colors.black), ("TOPPADDING", (0, 0), (-1, -1), 3),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    return t


def certificate_page():
    sig_w = 190
    names = Table([[signature_block(GUIDE, "Guide Name", sig_w), "", signature_block(HOD, "Head of Department", sig_w)]],
                  colWidths=[sig_w, TEXT_W - 2 * sig_w, sig_w])
    names.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    principal = signature_block(PRINCIPAL, "Principal", sig_w)
    principal.hAlign = "CENTER"
    return [Spacer(1, 30), logo(130), Spacer(1, 16), Paragraph("CERTIFICATE", chapter_title),
            Paragraph("This is to certify that the Project report entitled", center),
            Paragraph(f"<b>\"{PROJECT}\"</b>", center), Paragraph("Submitted by", center), Spacer(1, 6),
            Paragraph(f"<b>{STUDENT}</b>", center), Paragraph(f"Exam Seat No: {SEAT_NO}", center), Spacer(1, 12),
            Paragraph(f"is a bonafide student of this institute and the work has been carried out by him/her under the "
                      f"supervision of <b>{GUIDE}</b> and it is approved for the partial fulfillment of the requirement of Third "
                      f"Year Engineering (Artificial Intelligence and Machine Learning).", body), Spacer(1, 42),
            names, Spacer(1, 28), principal, Spacer(1, 22),
            Paragraph("<b>DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING</b>", center),
            Paragraph("<b>M.S. Bidve Engineering College, Latur</b>", center), Paragraph("<b>2026-27</b>", center),
            NextPageTemplate("main")]


def acknowledgement_page():
    return [PageBreak(), tagged("ack", chapter_title, "ACKNOWLEDGEMENT"),
            P(f"First and foremost, I would like to express my sincere gratitude to my project guide, {GUIDE}, for the invaluable "
              f"guidance, constant encouragement and support provided throughout the development of this project. Their knowledge and "
              f"experience helped me to successfully complete the project \"{PROJECT}\"."),
            P("I would like to thank M.S. Bidve Engineering College, Latur, for giving me the opportunity to work on this project. I also "
              "extend my thanks to the faculty members of the Department of Artificial Intelligence and Machine Learning for their "
              "continuous support and valuable suggestions."),
            P(f"I am also grateful to {HOD}, Head of the Department, and {PRINCIPAL}, Principal, for providing the facilities and a "
              "supportive environment for the project work."),
            P("I am thankful to my classmates and friends for their feedback during various stages of the project. Last but not least, I "
              "would like to thank my family for their unwavering support and motivation."),
            Spacer(1, 14), Paragraph("<b>NAME OF STUDENT</b>", ParagraphStyle("n", parent=body, alignment=TA_LEFT)),
            Paragraph(f"<b>{STUDENT}</b>", ParagraphStyle("n2", parent=body, alignment=TA_LEFT))]


def contents_pages(pages):
    """Two tidy pages like the reference: chapters in bold with space between groups, page numbers centered."""
    def make_table(first, last):
        rows = [[Paragraph("<b>No.</b>", ParagraphStyle("th1", fontName="Times-Bold", fontSize=12, leading=15)),
                 Paragraph("<b>Contents</b>", ParagraphStyle("th2", fontName="Times-Bold", fontSize=12, leading=15)),
                 Paragraph("<b>Page No.</b>", ParagraphStyle("th3", fontName="Times-Bold", fontSize=12, leading=15, alignment=TA_CENTER))]]
        style = [("LINEBELOW", (0, 0), (-1, 0), 0.9, colors.black), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                 ("LEFTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, 0), 4), ("BOTTOMPADDING", (0, 0), (-1, 0), 7)]
        for i, (key, num, title, level) in enumerate(STRUCTURE[first:last], start=1):
            bold = level == 0
            font = "Times-Bold" if bold else "Times-Roman"
            size = 12 if bold else 11.5
            rows.append([Paragraph(num, ParagraphStyle(f"tn{first}{i}", fontName=font, fontSize=size, leading=15)),
                         Paragraph(esc(title), ParagraphStyle(f"tt{first}{i}", fontName=font, fontSize=size, leading=15, leftIndent=0 if bold else 16)),
                         Paragraph(str(pages.get(key, "")), ParagraphStyle(f"tp{first}{i}", fontName=font, fontSize=size, leading=15, alignment=TA_CENTER))])
            r = len(rows) - 1
            if bold and r > 1:  # more room above each chapter, with a thin separator line
                style += [("TOPPADDING", (0, r), (-1, r), 10), ("LINEABOVE", (0, r), (-1, r), 0.4, colors.HexColor("#BBBBBB"))]
            else:
                style.append(("TOPPADDING", (0, r), (-1, r), 4))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 4))
        t = Table(rows, colWidths=[46, TEXT_W - 46 - 80, 80])
        t.setStyle(TableStyle(style))
        return t

    split = next(i for i, row in enumerate(STRUCTURE) if row[0] == "6")  # chapters 1-5 on the first page, the rest on the second
    return [PageBreak(), Paragraph("CONTENTS", chapter_title), make_table(0, split), PageBreak(), make_table(split, len(STRUCTURE))]


# ---------------------------------------------------------------- report text
def abstract():
    return [PageBreak(), tagged("abs", chapter_title, "ABSTRACT"),
            P("A resume is the first thing an employer or a recruiter sees, yet many students are not sure whether their resume is "
              "good enough. They rarely get honest, detailed feedback, because mentors and seniors are not always available and "
              "online templates only show how a resume should look, not how good a particular resume is. SkillLens : AI Based Resume "
              "Analysis is a web application that lets a student upload a resume in PDF format and receive an instant, AI-generated "
              "evaluation of it. The frontend is built with React, TypeScript and Vite, and the backend is built with Python and the "
              "Flask framework. The PyMuPDF library reads the text from the PDF, and an existing Large Language Model (LLM), the "
              "Google Gemini API, analyzes that text."),
            P("The AI reviews the resume for education, skills, projects, work experience and internships, achievements and "
              "certifications, structure, language and clarity, and overall completeness. It reports what the resume does well, what "
              "is missing, where it is weak, and what to improve, including sections that could be rewritten. The AI gives a score from "
              "0 to 100 for six categories, and the Python backend then combines these into one overall score using fixed, visible "
              "weights (25%, 20%, 20%, 15%, 10% and 10%). The score shows the general quality of the resume; it is not a prediction of "
              "whether the student will be hired. The results are displayed on a dashboard with a score ring, a score breakdown and "
              "chat-style feedback."),
            P("The resume is processed in memory and is not stored by the application. In its current version the system works with "
              "text-based PDF files only and has no user login. Reading scanned resumes with OCR, user accounts with session history, "
              "and exporting the report are planned as future enhancements. The project aims to give students a simple, always-available "
              "and stress-free way to improve their resumes before they apply for internships and jobs.")]


def chapter_1():
    return [*chapter("1"), section("1.1"),
            P("A resume is one of the most important documents in a student's career. It is the first impression that a recruiter gets "
              "and, very often, the only chance to be selected for an interview. Even so, many students are not sure what a good resume "
              "looks like. They may forget to include important sections, list skills without any proof, describe projects in a vague "
              "way, or use a confusing layout. Getting reviews from mentors, seniors or placement officers is helpful, but these people "
              "are not always available, and the advice often differs from person to person."),
            P("SkillLens : AI Based Resume Analysis is a web application that solves this problem. The student uploads a resume as a PDF "
              "file and clicks the Analyze button. Within a short time the system shows an overall quality score, a score for each part "
              "of the resume, what is good, what is missing and clear steps to improve it. The system does not need a job description and "
              "does not compare the resume with any company; it simply checks how complete, clear and well-presented the resume is."),
            P("The system works in simple steps. The website sends the PDF to a Python (Flask) backend. The backend checks that the file "
              "is a proper PDF within the size limit and reads the text from it using the PyMuPDF library. This text is sent to the Google "
              "Gemini API (an existing Large Language Model) together with a carefully written set of instructions. Gemini replies with "
              "structured data in JSON format. The backend checks this reply, calculates the final score using a fixed formula, and "
              "returns the result to the website, which shows it in an easy-to-read dashboard."),
            P("The project combines React, TypeScript and Vite for the user interface, Python and Flask for the backend logic, PyMuPDF "
              "for PDF reading, JSON for data exchange, and the Gemini API for the artificial intelligence part. No machine learning model "
              "was trained for this project; the project uses prompt design and an existing AI service instead."),
            section("1.2"),
            P("Students often lack access to honest and detailed feedback on their resumes. Mock reviews by mentors or seniors depend on "
              "their free time, and the quality of the feedback is different every time. Online resume templates only show how a resume "
              "should look; they do not tell the student whether their own resume is complete or well written. Many existing online "
              "resume checkers also match the resume with a job description or ask the user to create an account, which is not suitable "
              "for a student who just wants general feedback."),
            P("As a result, many students send resumes that miss key information, do not show their projects and skills properly, or are "
              "hard to read. They also do not know which part of the resume to improve first. There is a need for a simple, always "
              "available system that can read a resume, point out its strengths and weaknesses, tell the student what is missing and "
              "suggest practical improvements, while keeping the student's personal data safe."),
            section("1.3"),
            *bullets(["To develop a web-based system that analyzes a student's resume uploaded as a PDF file.",
                      "To read the text of the PDF reliably and give a clear message when the PDF is empty, damaged, scanned or too large.",
                      "To use an existing LLM API (Google Gemini) to evaluate the resume for education, skills, projects, experience, "
                      "achievements, structure, clarity and completeness.",
                      "To produce a transparent overall score between 0 and 100, calculated in Python from the AI's category scores using "
                      "fixed weights.",
                      "To show what the resume does well, what is missing, what is weak and which sections can be rewritten.",
                      "To give specific, practical suggestions instead of generic advice, without inventing any facts about the student.",
                      "To protect the student's privacy by keeping the API key secret and by not storing the uploaded resume.",
                      "To provide a modern, responsive and easy-to-use interface that works on computers and mobile screens."]),
            PageBreak(), section("1.4"),
            P("The scope of SkillLens in its current version includes the following:"),
            *bullets(["Uploading a resume in PDF format (up to 10 MB) and reading text from all of its pages.",
                      "Detecting and explaining problems with the file: wrong file type, empty PDF, damaged PDF, scanned (image-only) PDF "
                      "and files that are too large.",
                      "AI-based evaluation of general resume quality using the Google Gemini API, with the reply returned in a fixed JSON "
                      "structure.",
                      "A weighted overall score and six category scores, calculated by the Python backend.",
                      "A results dashboard showing the score, the score breakdown, detailed feedback, key insights, missing elements, "
                      "sections to rewrite and prioritized suggestions."]),
            P("The following are outside the scope of the current version: matching a resume with a job description or a particular "
              "company, training our own machine learning model, running a local LLM, reading scanned PDFs with OCR, user login with "
              "saved history, and predicting whether a person will get a job. The score shows only the general quality of the resume.")]


def chapter_2():
    return [*chapter("2"), section("2.1"),
            Paragraph("Resume Upload", h2),
            *bullets(["A page where the student can choose a PDF file by clicking or by dragging and dropping it.",
                      "Checking on the page itself that the file is a PDF, is not empty and is not larger than 10 MB.",
                      "Showing the selected file name and size, with an option to remove it."]),
            Paragraph("PDF Processing", h2),
            *bullets(["Accepting the uploaded file at the backend endpoint POST /api/analyze and validating it again on the server.",
                      "Extracting the text from all pages of the PDF using PyMuPDF.",
                      "Detecting empty, damaged, password-protected and scanned (image-only) PDFs and returning a clear error message.",
                      "Processing the file in memory and not saving the resume or its text permanently."]),
            Paragraph("AI Analysis", h2),
            *bullets(["Sending the extracted text to the Google Gemini API with a detailed set of evaluation instructions.",
                      "Evaluating education, skills, projects, experience, achievements, structure, clarity and completeness.",
                      "Receiving the result in a fixed JSON structure (strengths, weaknesses, missing elements, suggestions, category "
                      "scores, feedback and rewrite ideas) and validating it.",
                      "Never inventing qualifications, skills or projects, and not penalizing a fresher for having no work experience."]),
            Paragraph("Scoring", h2),
            *bullets(["Calculating the overall score in Python as the sum of (category score x category weight).",
                      "Keeping the final score between 0 and 100 and giving it a simple label such as Good Foundation.",
                      "Making the weights easy to change in one place."]),
            Paragraph("Results Display", h2),
            *bullets(["A results dashboard with an animated score ring and the six category scores.",
                      "Five sections: Detailed feedback, Key insights, Missing elements, Sections to rewrite and Suggestions.",
                      "Detailed feedback and Suggestions are shown in a chat-style layout that is easy to read."]),
            Paragraph("User Interface", h2),
            *bullets(["Simple, user-friendly navigation on every page (Home, How It Works, Features, About, Analyze Resume).",
                      "A loading screen while the analysis is running and meaningful error messages when something goes wrong.",
                      "A responsive design that works on different devices and screen sizes."]),
            Paragraph("Backend and API Integration", h2),
            *bullets(["A Flask backend that receives requests from the frontend.",
                      "Secure integration with the Gemini API using an API key stored in a .env file.",
                      "Data exchange between the frontend, the backend and the AI service in JSON format."]),
            section("2.2"),
            *bullets(["<b>Quick response:</b> the analysis normally finishes within a few seconds to about a minute, depending on how "
                      "busy the AI service is.",
                      "<b>Security:</b> the API key is stored only on the server (in a .env file that is not uploaded to GitHub) and is never "
                      "sent to the browser.",
                      "<b>Privacy:</b> the uploaded resume is processed in memory and not stored; resume contents are never written to the logs.",
                      "<b>Reliability:</b> the application must not crash when the file is bad or the AI service is busy, slow or returns an "
                      "incomplete answer. If one AI model is overloaded, other models are tried automatically.",
                      "<b>Usability:</b> clear messages in simple language, so that the student always knows what to do next.",
                      "<b>Accessibility:</b> animations are turned off for users who have asked their device to reduce motion.",
                      "<b>Maintainability:</b> a clean file structure with separate files for PDF reading, AI analysis and scoring, so new "
                      "features such as OCR or login can be added later."]),
            section("2.3"),
            *table([["Item", "Requirement"], ["Processor", "Intel Core i3 or higher"],
                    ["RAM", "4 GB or more (8 GB recommended while developing)"], ["Operating System", "Windows / Linux / macOS"],
                    ["Storage", "About 1 GB of free space for Python and Node.js packages"],
                    ["Software", "Python 3.10 or higher (3.12 used), Node.js with npm, Visual Studio Code, Web Browser (Chrome or Edge)"],
                    ["Network", "Internet connection (for the Gemini API and for installing packages)"],
                    ["Other", "A free Google Gemini API key from Google AI Studio"]], [150, TEXT_W - 150])]


def chapter_3():
    return [*chapter("3"), section("3.1"),
            P("The proposed system, SkillLens, is a web application in which a student uploads a resume as a PDF file and receives an "
              "AI-generated review of it. The system reads the text of the resume, sends it to the Google Gemini API, and checks the "
              "answer that comes back. The review focuses on how complete the resume is, how well the skills, projects and experience "
              "are presented, how well it is organized and how clearly it is written."),
            P("A very important design decision is that the <b>AI does not decide the final score on its own</b>. The AI only gives a "
              "score from 0 to 100 for each of six categories. The Python backend then combines these six scores using fixed weights. "
              "This makes the score transparent and consistent, and the weights can be changed later by editing one line of code. The "
              "score represents the general quality of the resume; it is not a prediction of whether the person will be hired."),
            P("The system also follows some safety rules for the AI: it must not invent skills, projects or experience that are not in "
              "the resume; it must not punish a fresher just because there is no work experience; and it must separate information that "
              "is really missing from information that may simply not apply to the student."),
            section("3.2"),
            *table([["Step", "Description"],
                    ["1. Upload", "The student opens the Analyze page and selects or drags a PDF resume. The page checks the file type and "
                                  "size (maximum 10 MB)."],
                    ["2. Validation", "The browser sends the file to the Flask backend, which checks the file again: it must have the .pdf "
                                      "extension, start like a real PDF, not be empty and not be larger than 10 MB."],
                    ["3. Text Extraction", "PyMuPDF reads the text from all pages. If the PDF is empty, damaged, password-protected or "
                                           "scanned, the student gets a clear error and no AI report is made."],
                    ["4. AI Analysis", "The text and a detailed set of instructions are sent to the Gemini API, which returns the review "
                                       "in JSON format with category scores from 0 to 100."],
                    ["5. Response Checking", "The backend validates the JSON against a fixed structure. If the answer is incomplete, the "
                                             "student gets a friendly error. If a model is busy, another model is tried."],
                    ["6. Score Calculation", "Python multiplies each category score by its weight and adds them to get the overall score "
                                             "between 0 and 100."],
                    ["7. Result Display", "The dashboard shows the score, the six category scores, detailed feedback, key insights, missing "
                                          "elements, sections to rewrite and suggestions."]],
                   [112, TEXT_W - 112]),
            P("<b>How the overall score is calculated.</b> The formula is: Overall Score = sum of (Category Score x Category Weight). "
              "The six categories and their weights are shown below.", body),
            *table([["Category", "Weight", "What it looks at"],
                    ["Content and completeness", "25%", "Whether the important information is present and the resume looks complete and professional"],
                    ["Skills presentation", "20%", "How clearly the technical and non-technical skills are listed and grouped"],
                    ["Projects and achievements", "20%", "Practical work, results, awards and certifications"],
                    ["Education and experience", "15%", "Education details, internships and work experience (judged fairly for freshers)"],
                    ["Structure and organization", "10%", "Section headings, order and layout of the information"],
                    ["Clarity and readability", "10%", "Language, sentence quality and ease of reading"]],
                   [140, 50, TEXT_W - 190]),
            P("For example, if the AI gives 80, 70, 90, 60, 50 and 40 to the six categories, the overall score is "
              "80 x 0.25 + 70 x 0.20 + 90 x 0.20 + 60 x 0.15 + 50 x 0.10 + 40 x 0.10 = 20 + 14 + 18 + 9 + 5 + 4 = 70.")]


def chapter_4():
    return [*chapter("4"), section("4.1"), FlowChart(), Paragraph("Figure 4.1. Flowchart", caption),
            P("The flowchart shows the actions and decisions in SkillLens. If the file is not a valid PDF, or has too little text, "
              "the student gets a clear message and uploads again. If the AI answer is not valid, another model is tried or a clear "
              "error is shown. Otherwise the weighted score is calculated and the results dashboard is displayed."),
            PageBreak(), section("4.2"),
            P("The system follows a three-part architecture:"),
            *bullets(["<b>Frontend (React, TypeScript, Vite):</b> shows the website pages, the upload page, the loading screen and the "
                      "results dashboard. It sends the PDF to the backend and displays the answer. A development proxy forwards "
                      "calls starting with /api to the Flask server, so the browser never needs the API key.",
                      "<b>Backend (Python, Flask):</b> receives the PDF, validates it, extracts the text with PyMuPDF, builds the "
                      "prompt, calls the Gemini API, validates the reply, calculates the score and returns the result as JSON.",
                      "<b>AI service (Google Gemini API):</b> reads the resume text and returns the evaluation: strengths, "
                      "weaknesses, missing elements, suggestions, category scores and feedback."]),
            ArchitectureFigure(), Paragraph("Figure 4.2. System Architecture", caption),
            section("4.3"),
            P("Upload Resume -> Validate and Extract Text -> AI Analysis (Gemini) -> Check AI Response -> Calculate Weighted Score -> "
              "Show Results Dashboard. Every step runs automatically after the student clicks Analyze; if a step fails, the workflow "
              "stops and a short message explains the problem."),
            KeepTogether([WorkflowFigure(), Paragraph("Figure 4.3. Workflow of the system", caption)])]


def chapter_5():
    return [*chapter("5"), section("5.1"),
            P("The Agile software development model was chosen for the implementation of SkillLens because of its iterative and "
              "incremental approach. The behavior of an LLM-based system depends heavily on how the instructions (prompts) are written, "
              "and on how the AI service behaves in real use. So the developer had to build a small part, test it, observe the output "
              "and improve it again and again. Agile supports this kind of continuous improvement."),
            P("In the Agile model, the work is divided into small, manageable iterations called sprints. After every sprint a working "
              "version of the application was reviewed with the guide, and the suggestions were included in the next sprint. This allowed "
              "early feedback, faster delivery of working features and the flexibility to change requirements, for example when the "
              "project moved from a browser-only prototype to a Python backend with real AI analysis."),
            section("5.2"),
            *table([["Sprint", "Work Done"],
                    ["Sprint 1", "Requirement gathering, design of the website pages (home, how it works, features, about), the upload page "
                                 "and the results page in React, and an early prototype of the analysis"],
                    ["Sprint 2", "Flask backend setup, PDF validation and text extraction with PyMuPDF, and the POST /api/analyze endpoint"],
                    ["Sprint 3", "Google Gemini integration, prompt design, structured JSON output with validation, weighted scoring in "
                                 "Python, error handling and automatic fallback between AI models"],
                    ["Sprint 4", "Connecting the frontend to the backend, results dashboard with chat-style feedback, animations and "
                                 "responsive design, testing and bug fixing"]],
                   [70, TEXT_W - 70])]


def chapter_6():
    return [*chapter("6"), section("6.1"),
            *table([["Component", "Technology"],
                    ["Frontend", "React, TypeScript, Vite (with React Router, Framer Motion and Lucide icons)"],
                    ["Backend", "Python, Flask"], ["PDF Processing", "PyMuPDF"],
                    ["AI / NLP", "Google Gemini API (existing Large Language Model) using the google-genai Python SDK"],
                    ["Data Validation", "Pydantic (checks the structure of the AI reply)"],
                    ["Configuration", "python-dotenv (.env file for the API key)"], ["Data Format", "JSON"],
                    ["Testing", "Python unittest, plus manual testing in the browser"],
                    ["Development Environment", "Visual Studio Code"], ["Version Control", "Git / GitHub"]],
                   [150, TEXT_W - 150]),
            section("6.2"),
            P("<b>React, TypeScript and Vite:</b> React is a JavaScript library for building user interfaces from small reusable "
              "pieces called components. TypeScript adds data types to JavaScript, which helps to catch mistakes early. Vite is a fast "
              "development tool that runs the website locally and builds it for release. React Router handles moving between pages "
              "without reloading, Framer Motion creates the animations, and Lucide provides the icons."),
            P("<b>Python:</b> Python is the primary backend language. Its simple syntax and large collection of libraries make it well "
              "suited for working with web frameworks, PDF files and web APIs."),
            P("<b>Flask:</b> Flask is a lightweight Python web framework. It is used to create the endpoints (routes) that receive "
              "requests from the frontend, call the other modules, and return the results as JSON."),
            P("<b>PyMuPDF:</b> PyMuPDF is a fast library for reading PDF files. In this project it opens the PDF from memory, goes "
              "through every page and extracts the text. It also helps to detect damaged, empty, password-protected and scanned PDFs."),
            P("<b>Google Gemini API (LLM):</b> Gemini is a Large Language Model from Google that understands and writes text. Instead "
              "of training a model from scratch, the project sends the resume text with carefully designed instructions and receives "
              "the review. The official google-genai Python library is used to talk to the service, and the reply is requested in a "
              "fixed JSON structure."),
            P("<b>Pydantic:</b> Pydantic describes the expected structure of the AI reply (for example, the six category scores must be "
              "numbers). Every reply is checked against this structure, so a wrong or incomplete reply is caught instead of crashing the "
              "application."),
            P("<b>python-dotenv:</b> It reads secret settings, such as the API key, from a .env file so that they are never written "
              "inside the code or uploaded to GitHub."),
            P("<b>JSON:</b> JSON (JavaScript Object Notation) is the data format used for exchanging data between the frontend, the "
              "Flask backend and the Gemini API."),
            P("<b>Visual Studio Code:</b> A code editor used for writing and debugging the project."),
            P("<b>Git / GitHub:</b> Used for version control and for storing and tracking code changes.")]


def chapter_7():
    sample = ('{\n  "overall_score": 70,\n  "score_label": "GOOD FOUNDATION",\n  "category_scores": [\n'
              '    {"label": "Content and completeness",\n     "weight": 25, "score": 80},\n'
              '    {"label": "Skills presentation",\n     "weight": 20, "score": 70},\n    ...\n  ],\n'
              '  "overall_summary": "...",\n  "strengths": [{"title": "...", "detail": "..."}],\n'
              '  "weaknesses": [{"title": "...", "detail": "..."}],\n'
              '  "missing_elements": [\n    {"element": "...", "detail": "...", "importance": "Important"}\n  ],\n'
              '  "suggestions": [\n    {"title": "...", "detail": "...",\n     "next_step": "...", "priority": "High"}\n  ],\n'
              '  "category_feedback": [...],\n  "sections_to_rewrite": [...],\n'
              '  "metadata": {"page_count": 1},\n  "disclaimer": "General resume quality, not hiring odds."\n}')
    return [*chapter("7"), section("7.1"),
            *bullets(["Install Python 3.10 or higher (Python 3.12 was used), Node.js with npm, and Visual Studio Code on your system.",
                      "Open a terminal in the project folder and create a Python virtual environment for the backend: "
                      "<font name=\"Courier\">py -3.12 -m venv .venv</font>",
                      "Install the backend libraries (Flask, PyMuPDF, google-genai, python-dotenv): "
                      "<font name=\"Courier\">.venv\\Scripts\\python.exe -m pip install -r requirements.txt</font> (run inside the backend folder).",
                      "Install the frontend packages from the project folder: <font name=\"Courier\">npm install</font>"], bullet_left),
            section("7.2"),
            *bullets(["Download or clone the project files from the GitHub repository: "
                      "<font name=\"Courier\">git clone https://github.com/Shriyash-Kurud/SkillLens.git</font>",
                      "Open the project folder in Visual Studio Code. The frontend files are in the <font name=\"Courier\">src</font> "
                      "folder and the backend files are in the <font name=\"Courier\">backend</font> folder."], bullet_left),
            section("7.3"),
            *bullets(["Create a free API key from Google AI Studio (the Gemini API).",
                      "In the backend folder, copy <font name=\"Courier\">.env.example</font> to <font name=\"Courier\">.env</font> and "
                      "write the key in it: <font name=\"Courier\">GEMINI_API_KEY=your_key_here</font>. The model name can be changed with "
                      "<font name=\"Courier\">GEMINI_MODEL</font>.",
                      "The .env file is listed in <font name=\"Courier\">.gitignore</font>, so the key is never uploaded to GitHub. It must "
                      "never be written directly in the code or shared.",
                      "Note: on free API plans the content sent to the service may be used by the provider to improve its products, so "
                      "real personal resumes should be used only after reading the provider's current data policy."], bullet_left),
            section("7.4"),
            *bullets(["Start the backend from the backend folder: <font name=\"Courier\">.venv\\Scripts\\python.exe app.py</font> "
                      "(it runs at http://127.0.0.1:5000).",
                      "Start the frontend from the project folder in a second terminal: <font name=\"Courier\">npm run dev</font>",
                      "Open the web browser and visit http://localhost:5173, click Analyze Resume, upload a text-based PDF and press "
                      "Analyze to see the results.",
                      "To run the automated backend tests: <font name=\"Courier\">.venv\\Scripts\\python.exe -m unittest test_backend</font>"], bullet_left),
            section("7.5"),
            *table([["Module", "File", "Description"],
                    ["Upload and Validation", "src/fileValidation.ts, app.py", "Checks file type, size and emptiness in the browser and "
                                                                                 "again on the server (PDF signature check)."],
                    ["PDF Text Extraction", "pdf_parser.py", "Reads text from all pages in memory with PyMuPDF and raises clear errors for "
                                                               "empty, damaged, locked or scanned PDFs."],
                    ["AI Analysis", "ai_analyzer.py", "Builds the instructions, calls the Gemini API, requests a fixed JSON structure, "
                                                        "validates it, handles errors and tries other models when one is busy."],
                    ["Scoring", "scoring.py", "Holds the category weights, calculates the overall score and gives the score label."],
                    ["API Layer", "app.py", "Provides POST /api/analyze and GET /api/health, and returns every error as simple JSON."],
                    ["API Client", "resumeAnalysisService.ts", "Sends the PDF from the browser, handles timeouts and errors, "
                                                                              "and converts the reply for the dashboard."],
                    ["Results Dashboard", "src/App.tsx", "Shows the animated score, the score breakdown and the five result sections "
                                                          "including the chat-style feedback."]],
                   [105, 125, TEXT_W - 230]),
            P("<b>Important implementation details</b> (explained simply):"),
            *bullets(["<b>In-memory processing:</b> the PDF is kept only in memory while it is analyzed, so no resume is saved on the disk "
                      "and there is nothing to clean up.",
                      "<b>Structured output:</b> the AI is told to reply in a fixed JSON format and the reply is checked again in Python. "
                      "This keeps the data consistent for the frontend.",
                      "<b>Score in Python:</b> the AI only gives category scores; the final score is calculated by Python with the "
                      "visible weights, so it is easy to explain and to change.",
                      "<b>Safe prompts:</b> the resume text is marked as data to be reviewed, and the AI is told never to follow "
                      "instructions found inside the resume.",
                      "<b>Model fallback:</b> if one Gemini model is overloaded (error 503) or slow, the backend automatically tries "
                      "another model before showing an error.",
                      "<b>Readable results:</b> if the AI writes internal field names such as content_completeness in its text, they are "
                      "replaced by readable names such as Content and completeness before display.",
                      "<b>No secrets in logs:</b> the logs record only sizes and status codes, never the resume text."]),
            P("<b>Sample of the JSON returned by the backend</b> (shortened):"),
            Preformatted(sample, code)]


def chapter_8():
    figs = [("fig_home.png", "Home page of SkillLens with navigation bar and call-to-action buttons"),
            ("fig_analyze.png", "Analyze page where the student uploads the PDF resume (PDF only, maximum 10 MB)"),
            ("fig_analyze_selected.png", "Analyze page after a resume has been selected, showing the file name and size"),
            ("fig_loading.png", "Loading screen shown while the resume is being analyzed"),
            ("fig_results_top.png", "Results page showing the overall score and the weighted score breakdown"),
            ("fig_tab_feedback.png", "Detailed feedback tab shown as a chat-style reply, one paragraph for each area"),
            ("fig_tab_insights.png", "Key insights tab listing the strengths and the opportunities found in the resume"),
            ("fig_tab_missing.png", "Missing elements tab, with information marked as Important or Optional"),
            ("fig_tab_rewrite.png", "Sections to rewrite tab showing the problem in a section and how to present it better"),
            ("fig_tab_suggestions.png", "Suggestions tab shown as a chat-style reply, with the most important changes first"),
            ("fig_weak_results_top.png", "Results for a weaker sample resume: lower scores and the label Needs More Detail (54 out of 100)")]
    story = [*chapter("8"), section("8.1"),
             P("The following screenshots show SkillLens while it is running. The results shown were produced by the real application, "
               "using the Gemini API, for two fictional sample resumes (a strong one and a weak one) so that no real personal data is shown.")]
    for number, (file, text) in enumerate(figs, 1):
        story.append(figure(file, f"8.{number}", text, max_h=250 if number % 2 else 240))
    story += [P("<b>Test results.</b> The application was tested with the following situations. The file and PDF checks were tested with "
                "real generated files; the AI-related cases were tested with a simulated Gemini service in the automated tests (22 tests, "
                "all passed), and two real resumes were also analyzed with the live Gemini API."),
              *table([["No.", "Test case", "Expected behavior", "Result"],
                      ["1", "Valid, complete resume", "Analysis and score are shown", "Passed"],
                      ["2", "Resume with very little information", "Still analyzed; low scores and missing items", "Passed"],
                      ["3", "Resume with missing sections", "Missing elements are listed", "Passed"],
                      ["4", "Empty PDF (blank page) and zero-byte file", "Clear error; no AI report is made", "Passed"],
                      ["5", "Corrupted PDF", "Error: the PDF could not be read", "Passed"],
                      ["6", "Scanned / image-only PDF", "Error asking for a text-based PDF", "Passed"],
                      ["7", "Unsupported format (.docx, or a text file renamed to .pdf)", "File is rejected as not a PDF", "Passed"],
                      ["8", "PDF larger than 10 MB", "Error: file larger than 10 MB", "Passed"],
                      ["9", "Gemini failure, rate limit, network error, busy model", "Friendly error without a crash; another model is "
                                                                                    "tried when one is busy", "Passed"],
                      ["10", "Invalid or incomplete AI response", "Error asking the student to try again", "Passed"]],
                     [30, 160, TEXT_W - 245, 55])]
    return story


def chapter_9():
    return [*chapter("9"), section("9.1"),
            *numbered_list(["<b>Clear picture of resume quality:</b> Students get an overall score and six category scores, so they "
                            "can see at a glance which parts are strong and which parts need work.",
                            "<b>Instant AI-generated feedback:</b> The system shows what the resume does well, what is missing and "
                            "what is weak, within seconds, at any time of the day.",
                            "<b>Practical improvement tips:</b> Prioritized suggestions and rewrite ideas tell the student exactly what to "
                            "change first, using the student's own information and without inventing facts.",
                            "<b>Fair and transparent scoring:</b> The AI gives category scores, but the final score is calculated in "
                            "Python with visible weights, and freshers are not penalized for having no work experience.",
                            "<b>Safe handling of bad files:</b> Empty, damaged, scanned, wrong-type and oversized files are detected and "
                            "explained, so the student never receives a meaningless report.",
                            "<b>Privacy and security:</b> The API key stays on the server, the resume is processed in memory and not "
                            "stored, and the logs never contain resume text.",
                            "<b>Modern and accessible interface:</b> A responsive website with a clear dashboard, a chat-style reading "
                            "experience and animations that respect the reduce-motion setting.",
                            "<b>Foundation for future enhancements:</b> The modular design makes it easy to add OCR, user login, "
                            "history and report download later."])]


def chapter_10():
    return [*chapter("10"), section("10.1"),
            P("In conclusion, SkillLens : AI Based Resume Analysis provides a simple and effective way for students to check and improve "
              "their resumes. By combining a modern web interface, a Flask backend, PyMuPDF for reading PDFs and the Google Gemini API, the "
              "system reads a resume, evaluates it on eight areas of quality, gives a transparent overall score and explains the "
              "strengths, the missing information and the improvements to make."),
            P("The project addresses the problem of limited access to honest resume feedback. It gives students an always-available, "
              "private and stress-free tool in which they can find the weak parts of their resume and fix them before applying for "
              "internships and jobs. The score is only a measure of general resume quality and not a prediction of hiring success, and "
              "AI feedback can sometimes be imperfect, so the student should treat it as guidance."),
            P("During the project, the student gained practical experience in web development with React and Flask, file handling and "
              "PDF processing, API integration, prompt design, JSON validation, error handling, API-key security, testing and version "
              "control using Git and GitHub. One real challenge was that the AI service was sometimes overloaded, which was solved by "
              "retrying and by automatically trying other models. The system lays a strong foundation for further improvement and can be "
              "extended into a complete career-preparation platform.")]


def chapter_11():
    return [*chapter("11"), section("11.1"),
            P("SkillLens can be enhanced in many ways in the future. Some potential areas are:"),
            *numbered_list(["<b>OCR for scanned resumes:</b> Read image-only PDFs and photos of resumes so that students are not "
                            "limited to text-based PDFs.",
                            "<b>User login with history:</b> Allow students to create accounts, save past analyses and track how their score "
                            "improves over time using charts.",
                            "<b>Resume comparison:</b> Compare two versions of a resume and show what improved.",
                            "<b>Optional job-description matching:</b> Let the student optionally paste a job description to see how well "
                            "the resume fits that role.",
                            "<b>Download as PDF:</b> Export the analysis report so that it can be saved or shared with a mentor.",
                            "<b>Resume builder and templates:</b> Suggest layouts and help the student rewrite weak sections directly.",
                            "<b>More languages and file types:</b> Support resumes written in other languages and Word documents.",
                            "<b>Institute-level dashboard:</b> Provide a dashboard for the placement cell to see overall trends and "
                            "plan training, with the students' permission.",
                            "<b>Production deployment:</b> Host the application with a production web server and HTTPS, and use a paid "
                            "API plan for stable availability."])]


def references():
    refs = ["Python Software Foundation, Python Documentation - https://docs.python.org",
            "Pallets Projects, Flask Documentation - https://flask.palletsprojects.com",
            "React Documentation - https://react.dev",
            "Vite Documentation - https://vite.dev",
            "Motion (Framer Motion) Documentation - https://motion.dev",
            "PyMuPDF Documentation - https://pymupdf.readthedocs.io",
            "Google, Gemini API Documentation - https://ai.google.dev/gemini-api/docs",
            "Google, Google Gen AI Python SDK (google-genai) - https://github.com/googleapis/python-genai",
            "Pydantic Documentation - https://docs.pydantic.dev",
            "python-dotenv Documentation - https://pypi.org/project/python-dotenv",
            "MDN Web Docs, HTML, CSS and JavaScript Documentation - https://developer.mozilla.org",
            "Git and GitHub Documentation - https://docs.github.com",
            "Visual Studio Code Documentation - https://code.visualstudio.com/docs",
            "Ian Sommerville, <i>Software Engineering</i>, Pearson Education (for SDLC and Agile model)."]
    return [PageBreak(), tagged("ref", chapter_title, "REFERENCES"),
            *[Paragraph(f"[{i}] {ref}", ParagraphStyle(f"r{i}", parent=body, alignment=TA_LEFT, leftIndent=26, firstLineIndent=-26))
              for i, ref in enumerate(refs, 1)]]


def story(pages):
    return [*cover_page(), NextPageTemplate("cover"), PageBreak(), *certificate_page(), *acknowledgement_page(),
            *contents_pages(pages), *abstract(), *chapter_1(), *chapter_2(), *chapter_3(), *chapter_4(), *chapter_5(),
            *chapter_6(), *chapter_7(), *chapter_8(), *chapter_9(), *chapter_10(), *chapter_11(), *references()]


def build():
    pages = {}
    for _ in range(3):  # repeat until the contents page numbers stop changing
        doc = ReportDoc(OUTPUT, pages)
        doc.build(story(pages))
        if doc.found_pages == pages:
            break
        pages = doc.found_pages
    print("pages:", doc.page, "-> ", OUTPUT)


if __name__ == "__main__":
    build()
