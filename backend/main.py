from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from model import analyze_resume

import pytesseract
from pdf2image import convert_from_bytes
from pdfminer.high_level import extract_text as pdfminer_extract_text
import io

app = FastAPI(title="AI Resume Screener API")

# ✅ Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "API running"}


# 🔥 SMART EXTRACTION
def extract_text_from_pdf(pdf_bytes):
    text = ""

    # 1️⃣ Try PDFMiner (correct way)
    try:
        text = pdfminer_extract_text(io.BytesIO(pdf_bytes))
        print("PDFMiner length:", len(text))
    except Exception as e:
        print("PDFMiner failed:", e)
        text = ""

    # 2️⃣ OCR fallback
    if not text or len(text.strip()) < 50:
        print("Using OCR fallback...")

        try:
            images = convert_from_bytes(
                pdf_bytes,
                poppler_path=r"C:\poppler-25.12.0\Library\bin"
            )

            text = ""
            for img in images:
                extracted = pytesseract.image_to_string(img)
                text += extracted + "\n"

            print("OCR length:", len(text))

        except Exception as e:
            print("OCR ERROR:", e)
            return ""

    return text.strip()


# 🔥 MAIN ENDPOINT
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        content = await file.read()
        text = ""

        print("File received:", file.filename)

        # ✅ TXT
        if file.filename.lower().endswith(".txt"):
            try:
                text = content.decode("utf-8")
                print("TXT length:", len(text))
            except Exception as e:
                print("TXT decode error:", e)
                text = ""

        # ✅ PDF
        elif file.filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf(content)

        # ❌ OTHER
        else:
            return {
                "match_score": 0,
                "error": "Unsupported file type"
            }

        print("Final text length:", len(text))
        print("TEXT SAMPLE:", text[:300])

        # 🚨 Safety
        if not text or len(text.strip()) < 50:
            return {
                "match_score": 0,
                "error": "Empty or unreadable resume"
            }

        # 🔥 ANALYZE
        result = analyze_resume(text, job_description)

        return result

    except Exception as e:
        print("SERVER ERROR:", str(e))
        return {
            "match_score": 0,
            "error": str(e)
        }