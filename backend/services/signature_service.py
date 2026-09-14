import io
import base64
import pymupdf as fitz  # PyMuPDF
from typing import List, Dict, Any, Optional


class SignatureService:
    @staticmethod
    def embed_signatures(file_bytes: bytes, signatures: List[Dict[str, Any]]) -> bytes:
        """
        Embeds and permanently stamps base64-encoded or binary signature image overlays
        onto target PDF pages at exact point coordinates.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")

            for sig in signatures:
                page_index = sig.get("page_index", 0)
                if page_index < 0 or page_index >= len(doc):
                    continue

                page = doc[page_index]

                data_str = sig.get("image_data") or sig.get("data", "")
                if "," in data_str:
                    _, encoded = data_str.split(",", 1)
                else:
                    encoded = data_str

                if not encoded:
                    continue

                try:
                    img_bytes = base64.b64decode(encoded)
                except Exception:
                    continue

                x = float(sig.get("x", 100))
                y = float(sig.get("y", 100))
                width = float(sig.get("width", 150))
                height = float(sig.get("height", 50))

                rect = fitz.Rect(x, y, x + width, y + height)
                page.insert_image(rect, stream=img_bytes, keep_proportion=True, overlay=True)

            output_stream = io.BytesIO()
            doc.save(output_stream, garbage=4, deflate=True)
            doc.close()

            return output_stream.getvalue()
        except Exception as e:
            raise RuntimeError(f"Failed to embed signatures: {str(e)}")
