import io
import pymupdf as fitz  # PyMuPDF
from typing import List, Dict, Any, Optional
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from models import AnnotationType


class EditorService:
    @staticmethod
    def flatten_annotations(file_bytes: bytes, annotations: List[Dict[str, Any]]) -> bytes:
        """
        Takes raw PDF bytes and structured annotation objects, renders them 
        onto pages using ReportLab, and flattens them into the PDF using PyMuPDF.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")

            # Group annotations by page (supporting both 'page' and 'page_index')
            annotations_by_page: Dict[int, List[Dict[str, Any]]] = {}
            for ann in annotations:
                p_idx = ann.get("page_index", ann.get("page", 0))
                if p_idx not in annotations_by_page:
                    annotations_by_page[p_idx] = []
                annotations_by_page[p_idx].append(ann)

            for page_idx, page_anns in annotations_by_page.items():
                if page_idx < 0 or page_idx >= len(doc):
                    continue

                page = doc[page_idx]
                rect = page.rect
                pdf_width = rect.width
                pdf_height = rect.height

                packet = io.BytesIO()
                canv = canvas.Canvas(packet, pagesize=(pdf_width, pdf_height))

                for ann in page_anns:
                    ann_type = ann.get("type")
                    x = float(ann.get("x", 0))
                    y = float(ann.get("y", 0))
                    w = float(ann.get("width", 100))
                    h = float(ann.get("height", 30))
                    color_str = ann.get("color", "#000000")
                    line_width = float(ann.get("thickness", ann.get("line_width", 2.0)))

                    rgb_color = EditorService._parse_color(color_str)
                    canv.saveState()

                    # 1. TEXT ANNOTATIONS
                    if ann_type == AnnotationType.TEXT or ann_type == 'text':
                        content = ann.get("text", ann.get("content", ""))
                        font_size = float(ann.get("font_size", 12))
                        canv.setFillColor(rgb_color)
                        canv.setFont("Helvetica", font_size)
                        py_y = pdf_height - y - font_size
                        canv.drawString(x, py_y, content)

                    # 2. RECTANGLE ANNOTATIONS
                    elif ann_type == AnnotationType.RECTANGLE or ann_type == 'rectangle':
                        canv.setStrokeColor(rgb_color)
                        canv.setLineWidth(line_width)
                        py_y = pdf_height - y - h
                        canv.rect(x, py_y, w, h, stroke=1, fill=0)

                    # 3. CIRCLE ANNOTATIONS
                    elif ann_type == AnnotationType.CIRCLE or ann_type == 'circle':
                        canv.setStrokeColor(rgb_color)
                        canv.setLineWidth(line_width)
                        cx = x + (w / 2)
                        cy = pdf_height - y - (h / 2)
                        radius = max(w, h) / 2
                        canv.circle(cx, cy, radius, stroke=1, fill=0)

                    # 4. HIGHLIGHT ANNOTATIONS
                    elif ann_type == AnnotationType.HIGHLIGHT or ann_type == 'highlight':
                        canv.setFillColor(rgb_color)
                        opacity = float(ann.get("opacity", 0.35))
                        try:
                            canv.setFillAlpha(opacity)
                        except AttributeError:
                            pass
                        py_y = pdf_height - y - h
                        canv.rect(x, py_y, w, h, stroke=0, fill=1)

                    # 5. FREEHAND / DRAWING ANNOTATIONS
                    elif ann_type == AnnotationType.FREEHAND or ann_type == 'freehand':
                        points = ann.get("points", [])
                        if len(points) > 1:
                            canv.setStrokeColor(rgb_color)
                            canv.setLineWidth(line_width)
                            path = canv.beginPath()

                            def parse_pt(pt):
                                if isinstance(pt, dict):
                                    return float(pt.get("x", 0)), float(pt.get("y", 0))
                                elif isinstance(pt, (list, tuple)) and len(pt) >= 2:
                                    return float(pt[0]), float(pt[1])
                                return 0.0, 0.0

                            fx, fy = parse_pt(points[0])
                            path.moveTo(fx, pdf_height - fy)
                            for pt in points[1:]:
                                px, py = parse_pt(pt)
                                path.lineTo(px, pdf_height - py)
                            canv.drawPath(path, stroke=1, fill=0)

                    canv.restoreState()

                canv.save()
                packet.seek(0)

                overlay_doc = fitz.open(stream=packet.read(), filetype="pdf")
                page.show_pdf_page(page.rect, overlay_doc, 0)
                overlay_doc.close()

            output_stream = io.BytesIO()
            doc.save(output_stream, garbage=4, deflate=True)
            doc.close()
            output_stream.seek(0)
            return output_stream.read()

        except Exception as e:
            raise RuntimeError(f"Failed to flatten annotations onto PDF: {str(e)}")

    @staticmethod
    def _parse_color(color_str: str) -> colors.Color:
        try:
            if color_str.startswith("#") and len(color_str) == 7:
                r = int(color_str[1:3], 16) / 255.0
                g = int(color_str[3:5], 16) / 255.0
                b = int(color_str[5:7], 16) / 255.0
                return colors.Color(r, g, b)
            elif color_str.startswith("#") and len(color_str) == 4:
                r = int(color_str[1] * 2, 16) / 255.0
                g = int(color_str[2] * 2, 16) / 255.0
                b = int(color_str[3] * 2, 16) / 255.0
                return colors.Color(r, g, b)
            else:
                return colors.HexColor(color_str)
        except Exception:
            return colors.black