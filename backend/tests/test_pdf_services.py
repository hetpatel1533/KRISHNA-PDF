import io
import pytest
import fitz  # PyMuPDF
from PIL import Image

from models import CompressionPreset, AnnotationType
from services.merge_service import MergeService
from services.split_service import SplitService
from services.compress_service import CompressService
from services.editor_service import EditorService
from services.signature_service import SignatureService


def create_sample_pdf(text: str = "Test PDF Page") -> bytes:
    """Helper utility to generate a minimal valid PDF byte stream for testing."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 72), text, fontsize=20)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_sample_image() -> bytes:
    """Helper utility to generate a tiny PNG image in bytes."""
    img = Image.new("RGB", (100, 50), color="blue")
    output = io.BytesIO()
    img.save(output, format="PNG")
    return output.getvalue()


def test_merge_service():
    pdf1 = create_sample_pdf("Page One Content")
    pdf2 = create_sample_pdf(
        "Page Two Content")

    merged_bytes = MergeService.merge_pdfs([pdf1, pdf2])
    assert isinstance(merged_bytes, bytes)
    assert len(merged_bytes) > 0

    doc = fitz.open(stream=merged_bytes, filetype="pdf")
    assert doc.page_count == 2
    doc.close()


def test_split_service_parse_ranges():
    total_pages = 10
    parsed = SplitService.parse_page_ranges("1-3, 5, 8-9", total_pages)
    assert parsed == [0, 1, 2, 4, 7, 8]


def test_split_service_extract():
    pdf_bytes = create_sample_pdf("Multi-page test")
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    doc.new_page().insert_text((72, 72), "Second Page")
    doc.new_page().insert_text((72, 72), "Third Page")
    multi_page_bytes = doc.write()
    doc.close()

    split_result = SplitService.extract_pages(multi_page_bytes, "2")
    assert isinstance(split_result, bytes)

    doc_res = fitz.open(stream=split_result, filetype="pdf")
    assert doc_res.page_count == 1
    doc_res.close()


def test_compress_service():
    pdf_bytes = create_sample_pdf("Compression Test")
    compressed_bytes = CompressService.compress_pdf(pdf_bytes, CompressionPreset.RECOMMENDED)
    assert isinstance(compressed_bytes, bytes)
    assert len(compressed_bytes) > 0


def test_editor_service():
    pdf_bytes = create_sample_pdf(
        "Editor Test")
    annotations = [
        {
            "page_index": 0,
            "type": AnnotationType.TEXT,
            "x": 100,
            "y": 150,
            "content": "Approved Document",
            "font_size": 14,
            "color": "#FF0000"
        }
    ]
    flattened_bytes = EditorService.flatten_annotations(pdf_bytes, annotations)
    assert isinstance(flattened_bytes, bytes)
    assert len(flattened_bytes) > 0


def test_signature_service():
    pdf_bytes = create_sample_pdf("Sign Test")
    import base64
    img_bytes = create_sample_image()
    encoded_img = base64.b64encode(img_bytes).decode('utf-8')

    signatures = [
        {
            "page_index": 0,
            "x": 200,
            "y": 400,
            "width": 150,
            "height": 75,
            "image_data": encoded_img
        }
    ]

    signed_bytes = SignatureService.embed_signatures(pdf_bytes, signatures)
    assert isinstance(signed_bytes, bytes)
    assert len(signed_bytes) > 0
