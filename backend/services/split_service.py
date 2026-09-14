import io
import zipfile
import pymupdf as fitz  # PyMuPDF
from typing import List


class SplitService:
    @staticmethod
    def parse_page_ranges(range_str: str, total_pages: int) -> List[int]:
        """
        Parses page range string (e.g., "1-3, 5, 8-10") into a zero-indexed list of page numbers.
        Validates ranges against total_pages.
        """
        pages = set()
        parts = range_str.split(",")
        for part in parts:
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                sub_parts = part.split("-")
                if len(sub_parts) == 2:
                    try:
                        start = int(sub_parts[0].strip())
                        end = int(sub_parts[1].strip())
                        for p in range(start, end + 1):
                            if 1 <= p <= total_pages:
                                pages.add(p - 1)
                    except ValueError:
                        continue
            else:
                try:
                    p = int(part)
                    if 1 <= p <= total_pages:
                        pages.add(p - 1)
                except ValueError:
                    continue
        return sorted(list(pages))

    @staticmethod
    def extract_pages(file_bytes: bytes, range_str: str) -> bytes:
        """
        Extracts specific pages into a single PDF document.
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        page_indices = SplitService.parse_page_ranges(range_str, total_pages)

        sub_doc = fitz.open()
        for p_idx in page_indices:
            sub_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)

        pdf_bytes = sub_doc.write()
        sub_doc.close()
        doc.close()
        return pdf_bytes

    @staticmethod
    def split_pdf_by_ranges(file_bytes: bytes, ranges: List[str]) -> bytes:
        """
        Splits a PDF into a ZIP archive containing multiple PDFs based on specified range strings.
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for idx, range_str in enumerate(ranges):
                page_indices = SplitService.parse_page_ranges(range_str, total_pages)
                if not page_indices:
                    continue

                sub_doc = fitz.open()
                for p_idx in page_indices:
                    sub_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)

                pdf_bytes = sub_doc.write()
                sub_doc.close()

                filename = f"split_part_{idx + 1}_pages_{range_str.replace(' ', '')}.pdf"
                zip_file.writestr(filename, pdf_bytes)

        doc.close()
        zip_buffer.seek(0)
        return zip_buffer.getvalue()

    @staticmethod
    def extract_single_pages(file_bytes: bytes) -> bytes:
        """
        Extracts every single page of the PDF as a separate file packaged inside a ZIP archive.
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for i in range(len(doc)):
                sub_doc = fitz.open()
                sub_doc.insert_pdf(doc, from_page=i, to_page=i)
                pdf_bytes = sub_doc.write()
                sub_doc.close()

                filename = f"page_{i + 1}.pdf"
                zip_file.writestr(filename, pdf_bytes)

        doc.close()
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
