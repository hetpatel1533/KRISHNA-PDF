from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Response
from fastapi.responses import JSONResponse
import json
import traceback
from typing import List, Optional
import pymupdf as fitz

from models import CompressionPreset
from services.merge_service import MergeService
from services.split_service import SplitService
from services.compress_service import CompressService
from services.signature_service import SignatureService
from services.organizer_security_service import OrganizerSecurityService
from services.text_edit_service import TextEditService
from services.editor_service import EditorService

router = APIRouter(tags=["PDF Operations"])

@router.post("/merge")
async def merge_pdfs_endpoint(files: List[UploadFile] = File(...)):
    if not files or len(files) < 2:
        raise HTTPException(status_code=400, detail="At least two PDF files are required for merging.")
    try:
        file_bytes_list = [await f.read() for f in files]
        merged_pdf_bytes = MergeService.merge_pdfs(file_bytes_list)
        return Response(content=merged_pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="merged.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/repair")
async def repair_pdf_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        repaired_bytes = OrganizerSecurityService.repair_pdf(content)
        return Response(content=repaired_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="repaired.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-to-markdown")
async def convert_to_markdown_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        md_text = OrganizerSecurityService.convert_to_markdown(content)
        return Response(content=md_text, media_type="text/markdown", headers={"Content-Disposition": 'attachment; filename="document.md"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/split")
async def split_pdf_endpoint(
    file: UploadFile = File(...), 
    ranges: Optional[str] = Form(None), 
    range_str: Optional[str] = Form(None), 
    mode: str = Form("extract"), 
    every_n: Optional[int] = Form(None)
):
    try:
        content = await file.read()
        active_range = ranges or range_str or "1"
        if mode == "fixed" and every_n:
            zip_bytes = SplitService.split_pdf_fixed(content, every_n)
            return Response(content=zip_bytes, media_type="application/zip", headers={"Content-Disposition": 'attachment; filename="split_fixed.zip"'})
        elif "," in active_range or "-" in active_range or mode == "ranges":
            range_list = [r.strip() for r in active_range.split(",") if r.strip()]
            zip_bytes = SplitService.split_pdf_by_ranges(content, range_list)
            return Response(content=zip_bytes, media_type="application/zip", headers={"Content-Disposition": 'attachment; filename="split_ranges.zip"'})
        else:
            extracted_pdf = SplitService.extract_pages(content, active_range)
            return Response(content=extracted_pdf, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="extracted.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compress")
async def compress_pdf_endpoint(file: UploadFile = File(...), preset: CompressionPreset = Form(CompressionPreset.RECOMMENDED)):
    try:
        content = await file.read()
        compressed_bytes = CompressService.compress_pdf(content, preset=preset)
        return Response(content=compressed_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="compressed.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-word-to-pdf")
async def convert_word_to_pdf_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        fname = file.filename or "document.docx"
        pdf_bytes = OrganizerSecurityService.convert_word_to_pdf(content, fname)
        clean_name = fname.rsplit(".", 1)[0] if "." in fname else "converted"
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{clean_name}.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-image-to-pdf")
async def convert_image_to_pdf_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        fname = file.filename or "image.png"
        pdf_bytes = OrganizerSecurityService.convert_image_to_pdf(content, fname)
        clean_name = fname.rsplit(".", 1)[0] if "." in fname else "converted_image"
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{clean_name}.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sign/flatten")
async def sign_flatten_endpoint(file: UploadFile = File(...), signatures: str = Form(...)):
    try:
        content = await file.read()
        parsed_signatures = json.loads(signatures)
        signed_bytes = SignatureService.embed_signatures(content, parsed_signatures)
        return Response(content=signed_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="signed.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/organize")
async def organize_pdf_endpoint(file: UploadFile = File(...), operations: str = Form(...)):
    try:
        content = await file.read()
        ops = json.loads(operations)
        res = OrganizerSecurityService.organize_pdf(content, ops)
        return Response(content=res, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="organized.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/security/watermark")
async def secure_watermark_endpoint(file: UploadFile = File(...), password: Optional[str] = Form(None), watermark: Optional[str] = Form(None)):
    try:
        content = await file.read()
        res = OrganizerSecurityService.secure_and_watermark(content, password, watermark)
        return Response(content=res, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="secured.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/security/remove-watermark")
async def remove_watermark_endpoint(file: UploadFile = File(...), keyword: Optional[str] = Form(None)):
    try:
        content = await file.read()
        fname = file.filename or "document.pdf"
        res = OrganizerSecurityService.remove_watermark(content, keyword, fname)
        fname_lower = fname.lower()
        if fname_lower.endswith('.xml'):
            mime = "application/xml"
            out_name = f"clean_{fname}"
        elif fname_lower.endswith('.docx') or fname_lower.endswith('.doc'):
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            out_name = f"clean_{fname}"
        elif fname_lower.endswith('.txt'):
            mime = "text/plain"
            out_name = f"clean_{fname}"
        elif fname_lower.endswith('.png') or fname_lower.endswith('.jpg') or fname_lower.endswith('.jpeg'):
            mime = "image/png" if fname_lower.endswith('.png') else "image/jpeg"
            out_name = f"clean_{fname}"
        else:
            mime = "application/pdf"
            out_name = f"clean_{fname.rsplit('.', 1)[0]}.pdf"

        return Response(content=res, media_type=mime, headers={"Content-Disposition": f'attachment; filename="{out_name}"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unlock")
async def unlock_pdf_endpoint(file: UploadFile = File(...), password: Optional[str] = Form(None)):
    try:
        content = await file.read()
        res = OrganizerSecurityService.unlock_pdf(content, password)
        return Response(content=res, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="unlocked.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/page-numbers")
async def page_numbers_endpoint(file: UploadFile = File(...), position: str = Form("bottom-center"), font_size: int = Form(10)):
    try:
        content = await file.read()
        res = OrganizerSecurityService.add_page_numbers(content, position, font_size)
        return Response(content=res, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="numbered.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert")
async def convert_format_endpoint(file: UploadFile = File(...), target_format: str = Form(...)):
    try:
        content = await file.read()
        res = OrganizerSecurityService.convert_format(content, target_format)
        clean_fmt = (target_format or "txt").lower().strip()
        mime = "application/zip" if clean_fmt in ["png", "jpeg", "jpg"] else ("application/vnd.openxmlformats-officedocument.wordprocessingml.document" if clean_fmt == "docx" else "text/plain")
        ext = "zip" if clean_fmt in ["png", "jpeg", "jpg"] else clean_fmt
        return Response(content=res, media_type=mime, headers={"Content-Disposition": f'attachment; filename="converted_file.{ext}"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-text-blocks")
async def extract_text_blocks_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        blocks = TextEditService.extract_text_blocks(content)
        return JSONResponse(content=blocks)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply-text-edits")
async def apply_text_edits_endpoint(file: UploadFile = File(...), edits: Optional[str] = Form(None), text_edits: Optional[str] = Form(None)):
    try:
        content = await file.read()
        raw_edits = edits or text_edits or "[]"
        parsed_edits = json.loads(raw_edits)
        edited_bytes = TextEditService.apply_text_edits(content, parsed_edits)
        return Response(content=edited_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="edited.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edit/export")
async def export_editor_endpoint(file: UploadFile = File(...), annotations: Optional[str] = Form(None), overlays: Optional[str] = Form(None)):
    try:
        content = await file.read()
        raw_annotations = annotations or overlays or "[]"
        parsed_annotations = json.loads(raw_annotations)
        exported_bytes = EditorService.flatten_annotations(content, parsed_annotations)
        return Response(content=exported_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="annotated.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ocr")
@router.post("/ocr/")
async def ocr_pdf_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        ocr_bytes = OrganizerSecurityService.ocr_pdf(content)
        return Response(content=ocr_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="ocr_searchable.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/redact")
@router.post("/redact/")
async def redact_pdf_endpoint(file: UploadFile = File(...), keyword: Optional[str] = Form(None)):
    try:
        content = await file.read()
        redacted_bytes = OrganizerSecurityService.redact_pdf(content, keyword)
        return Response(content=redacted_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="redacted.pdf"'})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
