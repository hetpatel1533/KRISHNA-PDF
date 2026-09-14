import io
import pymupdf as fitz
from typing import List, Dict, Any

class TextEditService:
    @staticmethod
    def extract_text_blocks(file_bytes: bytes) -> List[Dict[str, Any]]:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        all_pages_blocks = []
        
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_blocks = []
            
            text_page = page.get_text("dict")
            if "blocks" in text_page:
                for b in text_page["blocks"]:
                    if "lines" in b:
                        for line in b["lines"]:
                            for span in line["spans"]:
                                text = span["text"].strip()
                                if text:
                                    page_blocks.append({
                                        "bbox": list(span["bbox"]),
                                        "text": text,
                                        "size": span.get("size", 12),
                                        "font": span.get("font", "Helvetica"),
                                        "page_index": page_idx,
                                        "is_widget": False
                                    })
            
            for widget in page.widgets():
                if widget.rect:
                    val = widget.field_value or widget.field_name or "Form Field"
                    page_blocks.append({
                        "bbox": [widget.rect.x0, widget.rect.y0, widget.rect.x1, widget.rect.y1],
                        "text": str(val),
                        "size": 12,
                        "font": "Helvetica",
                        "page_index": page_idx,
                        "is_widget": True,
                        "field_name": widget.field_name
                    })

            all_pages_blocks.append({"page_index": page_idx, "blocks": page_blocks})
        
        doc.close()
        return all_pages_blocks

    @staticmethod
    def apply_text_edits(file_bytes: bytes, edits: List[Dict[str, Any]]) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        for edit in edits:
            p_idx = edit.get("page_index", 0)
            if p_idx < 0 or p_idx >= len(doc):
                continue
            page = doc[p_idx]
            bbox = edit.get("bbox")
            new_text = edit.get("new_text", "")
            is_widget = edit.get("is_widget", False)
            field_name = edit.get("field_name")
            
            if is_widget:
                for widget in page.widgets():
                    if widget.field_name == field_name or (widget.rect and list(widget.rect) == bbox):
                        widget.field_value = new_text
                        widget.update()
            else:
                if not bbox or len(bbox) != 4:
                    continue
                rect = fitz.Rect(bbox)
                page.add_redact_annot(rect, fill=(1, 1, 1))
                page.apply_redactions()
                
                font_size = edit.get("font_size", 12)
                
                # Dynamic expansion of the output text bounds so added text doesn't wrap or clip vertically
                old_text = edit.get("old_text", "")
                if len(new_text) > len(old_text) and len(old_text) > 0:
                    expansion_ratio = len(new_text) / len(old_text)
                    current_width = rect.x1 - rect.x0
                    expanded_width = current_width * max(1.25, expansion_ratio)
                    rect.x1 = rect.x0 + expanded_width
                
                page.insert_textbox(rect, new_text, fontsize=font_size, color=(0, 0, 0))
            
        output_stream = io.BytesIO()
        doc.save(output_stream, garbage=4, deflate=True)
        bytes_data = output_stream.getvalue()
        doc.close()
        return bytes_data
