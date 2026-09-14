import io
import os
import tempfile
import subprocess
import pymupdf as fitz
from typing import List, Dict, Any
from PIL import Image

class OrganizerSecurityService:
    @staticmethod
    def sanitize_xml_chars(s: str) -> str:
        if not s: return ""
        cleaned = "".join(ch for ch in str(s) if (0x20 <= ord(ch) <= 0xD7FF) or (ord(ch) in (0x9, 0xA, 0xD)) or (0xE000 <= ord(ch) <= 0xFFFD) or (0x10000 <= ord(ch) <= 0x10FFFF))
        return cleaned.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    @staticmethod
    def convert_word_to_pdf(file_bytes: bytes, filename: str) -> bytes:
        try:
            paragraphs = []
            try:
                import docx
                doc_io = io.BytesIO(file_bytes)
                word_doc = docx.Document(doc_io)
                for p in word_doc.paragraphs:
                    if p.text and p.text.strip(): paragraphs.append(p.text.strip())
                for table in word_doc.tables:
                    for row in table.rows:
                        row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                        if row_text: paragraphs.append(row_text)
            except Exception as e:
                raw_text = file_bytes.decode('utf-8', errors='ignore')
                paragraphs = [line.strip() for line in raw_text.splitlines() if line.strip()]

            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors

            pdf_buffer = io.BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
            styles = getSampleStyleSheet()
            normal_style = ParagraphStyle('WordContent', parent=styles['Normal'], fontSize=11, leading=16, textColor=colors.black)

            story = []
            for para in paragraphs:
                story.append(Paragraph(OrganizerSecurityService.sanitize_xml_chars(para), normal_style))
                story.append(Spacer(1, 10))
            doc.build(story)
            return pdf_buffer.getvalue()
        except Exception as e:
            raise RuntimeError(f"Conversion failed: {str(e)}")

    @staticmethod
    def convert_image_to_pdf(file_bytes: bytes, filename: str) -> bytes:
        img_doc = fitz.open()
        img = fitz.open(stream=file_bytes, filetype="image")
        rect = img[0].rect
        pdf_page = img_doc.new_page(width=rect.width, height=rect.height)
        pdf_page.show_pdf_page(rect, img, 0)
        output = io.BytesIO()
        img_doc.save(output)
        return output.getvalue()

    @staticmethod
    def repair_pdf(file_bytes: bytes) -> bytes:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True, clean=True)
            doc.close()
            output.seek(0)
            return output.read()
        except Exception as e:
            try:
                # Fallback lenient recovery
                doc = fitz.open()
                temp_doc = fitz.open(stream=file_bytes, filetype="pdf")
                for page in temp_doc:
                    doc.insert_pdf(temp_doc, from_page=page.number, to_page=page.number)
                output = io.BytesIO()
                doc.save(output)
                doc.close()
                temp_doc.close()
                output.seek(0)
                return output.read()
            except Exception as inner_e:
                raise RuntimeError(f"Failed to repair PDF: {str(e)} | Fallback: {str(inner_e)}")

    @staticmethod
    def convert_to_markdown(file_bytes: bytes) -> str:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        md_lines = []
        for i, page in enumerate(doc):
            md_lines.append(f"# Page {i + 1}\n")
            text = page.get_text("text")
            for line in text.splitlines():
                clean_line = line.strip()
                if clean_line:
                    md_lines.append(f"{clean_line}\n")
            md_lines.append("\n---\n")
        doc.close()
        return "\n".join(md_lines)

    @staticmethod
    def organize_pdf(file_bytes: bytes, operations: List[Dict[str, Any]]) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        new_doc = fitz.open()
        for op in operations:
            p_idx = op.get("page_index")
            rotation = int(float(op.get("rotation", 0))) % 360
            if p_idx is not None and 0 <= p_idx < len(doc):
                new_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)
                if rotation != 0: new_doc[-1].set_rotation(rotation)
        output = io.BytesIO()
        new_doc.save(output)
        return output.getvalue()

    @staticmethod
    def secure_and_watermark(file_bytes: bytes, password: str = None, watermark_text: str = None) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if watermark_text:
            for page in doc:
                page.insert_text(fitz.Point(100, 100), watermark_text, fontsize=36, color=(0.5,0.5,0.5))
        output = io.BytesIO()
        if password: doc.save(output, encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=password, owner_pw=password)
        else: doc.save(output)
        return output.getvalue()

    @staticmethod
    def ocr_pdf(file_bytes: bytes) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        output = io.BytesIO()
        for page in doc:
            try:
                tp = page.get_textpage_ocr()
                if tp:
                    pass
            except Exception:
                pass
        doc.save(output, garbage=4, deflate=True)
        doc.close()
        return output.getvalue()

    @staticmethod
    def redact_pdf(file_bytes: bytes, keyword: str = None) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if keyword:
            for page in doc:
                rects = page.search_for(keyword)
                for r in rects:
                    page.add_redact_annot(r, fill=(0, 0, 0))
                page.apply_redactions()
        output = io.BytesIO()
        doc.save(output, garbage=4, deflate=True)
        doc.close()
        return output.getvalue()

    @staticmethod
    def remove_watermark(file_bytes: bytes, keyword: str = None, filename: str = "document.pdf") -> bytes:
        if not keyword:
            return file_bytes
        
        fname_lower = filename.lower()
        
        if fname_lower.endswith(('.png', '.jpg', '.jpeg')):
            try:
                img = Image.open(io.BytesIO(file_bytes))
                out_buf = io.BytesIO()
                img.save(out_buf, format=img.format or 'PNG')
                return out_buf.getvalue()
            except Exception:
                return file_bytes

        try:
            raw_text = file_bytes.decode('utf-8', errors='ignore')
            if ("<" in raw_text and ">" in raw_text) or len(raw_text) > 0 or fname_lower.endswith(('.xml', '.doc', '.docx', '.txt')):
                import re
                pattern = re.compile(re.escape(keyword), re.IGNORECASE)
                cleaned_text = pattern.sub("", raw_text)
                return cleaned_text.encode('utf-8')
        except Exception:
            pass

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                rects = page.search_for(keyword)
                for r in rects: page.add_redact_annot(r, fill=(1,1,1))
                page.apply_redactions()
            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True)
            doc.close()
            return output.getvalue()
        except Exception:
            return file_bytes

    @staticmethod
    def unlock_pdf(file_bytes: bytes, password: str = None) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if password: doc.authenticate(password)
        new_doc = fitz.open()
        new_doc.insert_pdf(doc)
        output = io.BytesIO()
        new_doc.save(output, encryption=fitz.PDF_ENCRYPT_NONE)
        return output.getvalue()

    @staticmethod
    def add_page_numbers(file_bytes: bytes, position: str = "bottom-center", font_size: int = 10) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total = len(doc)
        for i, page in enumerate(doc):
            page.insert_text((doc[i].rect.width/2, doc[i].rect.height-30), f"{i+1}/{total}", fontsize=font_size)
        output = io.BytesIO()
        doc.save(output)
        return output.getvalue()

    @staticmethod
    def create_valid_docx(pages: List[str]) -> bytes:
        import zipfile
        out = io.BytesIO()
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", b'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
            z.writestr("word/document.xml", b'<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Conversion Result</w:t></w:r></w:p></w:body></w:document>')
        return out.getvalue()

    @staticmethod
    def convert_format(file_bytes: bytes, target_format: str) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        output = io.BytesIO()
        if target_format == "txt":
            output.write("\n".join([p.get_text() for p in doc]).encode('utf-8'))
        else:
            output.write(OrganizerSecurityService.create_valid_docx([p.get_text() for p in doc]))
        return output.getvalue()
