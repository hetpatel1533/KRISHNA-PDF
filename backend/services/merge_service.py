import io
import pymupdf as fitz  # PyMuPDF
from pypdf import PdfWriter, PdfReader
from typing import List


class MergeService:
    @staticmethod
    def merge_pdfs(file_bytes_list: List[bytes]) -> bytes:
        """
        Concatenates multiple PDF byte streams into a single PDF byte stream
        using PyMuPDF for robust, high-performance merging.
        """
        try:
            merged_doc = fitz.open()

            for file_bytes in file_bytes_list:
                with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                    merged_doc.insert_pdf(doc)

            output_stream = io.BytesIO()
            merged_doc.save(output_stream)
            merged_doc.close()

            output_stream.seek(0)
            return output_stream.read()
        except Exception as e:
            writer = PdfWriter()
            try:
                for file_bytes in file_bytes_list:
                    reader = PdfReader(io.BytesIO(file_bytes))
                    for page in reader.pages:
                        writer.add_page(page)

                output_stream = io.BytesIO()
                writer.write(output_stream)
                writer.close()
                output_stream.seek(0)
                return output_stream.read()
            except Exception as inner_e:
                raise ValueError(f"Failed to merge PDFs: {str(e)} | Fallback error: {str(inner_e)}")

    @staticmethod
    def merge_custom_pages(file_page_specs: List[dict]) -> bytes:
        """
        Merges specific pages from multiple PDFs based on a detailed specification.
        """
        pass
