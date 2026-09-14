import io
import pymupdf as fitz  # PyMuPDF
from PIL import Image
from models import CompressionPreset


class CompressService:
    @staticmethod
    def compress_pdf(file_bytes: bytes, preset: CompressionPreset = CompressionPreset.RECOMMENDED) -> bytes:
        """
        Compresses a PDF byte stream using PyMuPDF by adjusting image quality,
        downsampling high-resolution images, and removing redundant objects/metadata.
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        if preset == CompressionPreset.EXTREME:
            image_quality = 40
            image_dpi = 96
            deflate = True
        elif preset == CompressionPreset.RECOMMENDED:
            image_quality = 65
            image_dpi = 150
            deflate = True
        else:  # LOW
            image_quality = 85
            image_dpi = 200
            deflate = True

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)

            for img_info in image_list:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]

                    img = Image.open(io.BytesIO(image_bytes))

                    if img.mode in ("CMYK", "P"):
                        img = img.convert("RGB")

                    width, height = img.size
                    if width > 1500 or height > 1500:
                        ratio = min(1500 / width, 1500 / height)
                        new_width = int(width * ratio)
                        new_height = int(height * ratio)
                        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                    output_buffer = io.BytesIO()
                    if image_ext.lower() in ["png", "webp"] and img.mode in ("RGBA", "LA"):
                        img.save(output_buffer, format="PNG", optimize=True)
                    else:
                        img.save(output_buffer, format="JPEG", quality=image_quality, optimize=True)

                    compressed_bytes = output_buffer.getvalue()
                    doc.update_stream(xref, compressed_bytes)
                except Exception:
                    continue

        output_stream = io.BytesIO()
        doc.save(
            output_stream,
            garbage=4,
            deflate=deflate,
            clean=True,
        )
        doc.close()

        return output_stream.getvalue()
