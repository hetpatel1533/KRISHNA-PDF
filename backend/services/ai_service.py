import io
import re
import math
import os
import json
import urllib.parse
import urllib.request
from typing import Dict, Any, List, Optional
import pymupdf as fitz

try:
    from google import genai
    from google.genai import types
    GENAI_SDK_AVAILABLE = True
except ImportError:
    GENAI_SDK_AVAILABLE = False

class AiService:
    @staticmethod
    def _generate_with_gemini_http(prompt: str, api_key: str, response_mime_type: Optional[str] = None) -> str:
        if not api_key or "your_gemini" in api_key.lower():
            raise ValueError("Google Gemini API Key is required.")
        
        # Priority model sequence including your requested models with standard fallbacks
        models = [
            "gemini-3.5-flash",
            "gemini-3.6-flash",
        ]

        # 1. Primary execution via official `google.genai` modern SDK
        if GENAI_SDK_AVAILABLE:
            try:
                client = genai.Client(api_key=api_key)
                for m in models:
                    try:
                        config = None
                        if response_mime_type == "application/json":
                            config = types.GenerateContentConfig(response_mime_type="application/json")
                        
                        response = client.models.generate_content(
                            model=m,
                            contents=prompt,
                            config=config
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as sdk_err:
                        print(f"[Gemini SDK Model {m} Error]: {sdk_err}")
                        continue
            except Exception as e:
                print(f"[Gemini SDK Init Error]: {e}")

        # 2. Secondary execution fallback via Direct HTTP REST API
        last_error = None
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            if response_mime_type == "application/json":
                payload["generationConfig"] = {"responseMimeType": "application/json"}
            
            try:
                req = urllib.request.Request(
                    url, 
                    data=json.dumps(payload).encode('utf-8'), 
                    headers=headers, 
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=45) as resp:
                    res_data = json.loads(resp.read().decode('utf-8'))
                    candidates = res_data.get("candidates", [])
                    if candidates and isinstance(candidates, list):
                        for cand in candidates:
                            content = cand.get("content", {})
                            parts = content.get("parts", [])
                            for p in parts:
                                content_text = p.get("text", "")
                                if content_text and content_text.strip():
                                    return content_text.strip()
            except Exception as e:
                last_error = e
                print(f"[AI Engine HTTP] Model {model} request retry: {e}")
                continue
        
        raise last_error or RuntimeError("Gemini API query execution failed on all target models.")

    @staticmethod
    def _clean_and_parse_json(text: str) -> Any:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*\n", "", text)
            text = re.sub(r"\n\s*```$", "", text).strip()
        try:
            return json.loads(text)
        except Exception:
            match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    pass
            raise ValueError(f"Failed to parse valid JSON from AI response: {text[:200]}")

    @staticmethod
    def _get_font_for_lang(lang: str) -> str:
        font_urls = {
            "hi": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf)",
            "mr": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf)",
            "bn": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf)",
            "te": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf)",
            "ta": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf)",
            "ur": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf)",
            "gu": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf)",
            "kn": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf)",
            "ml": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf)",
            "pa": "[https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf](https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf)"
        }

        if lang not in font_urls:
            return "helv"

        font_dir = os.path.join(os.path.dirname(__file__), "fonts")
        os.makedirs(font_dir, exist_ok=True)
        font_path = os.path.join(font_dir, f"font_{lang}.ttf")

        if os.path.exists(font_path) and os.path.getsize(font_path) > 1000:
            return font_path

        url = font_urls[lang]
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as response:
                with open(font_path, "wb") as f:
                    f.write(response.read())
            return font_path
        except Exception as e:
            print(f"[Font Download Warning]: {e}")
            return "helv"

    @staticmethod
    def translate_pdf(file_bytes: bytes, target_language: str = "hi", api_key: Optional[str] = None) -> bytes:
        if not api_key:
            raise ValueError("Valid Google Gemini API Key is required for translation.")

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            font_path_or_name = AiService._get_font_for_lang(target_language)

            lang_names = {
                "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "mr": "Marathi",
                "ta": "Tamil", "ur": "Urdu", "gu": "Gujarati", "kn": "Kannada",
                "ml": "Malayalam", "pa": "Punjabi", "or": "Odia", "es": "Spanish", "fr": "French", "de": "German"
            }
            lang_name = lang_names.get(target_language, target_language)

            registered_font_name = "helv"
            if font_path_or_name != "helv" and os.path.exists(font_path_or_name):
                try:
                    for page in doc:
                        res_font = page.insert_font(fontname=f"font_{target_language}", fontfile=font_path_or_name)
                        registered_font_name = res_font if isinstance(res_font, str) else f"font_{target_language}"
                        break
                except Exception as fe:
                    print(f"[Font Registration Warning]: {fe}")

            for page in doc:
                text_blocks_to_translate = []
                try:
                    text_page = page.get_text("dict")
                    if "blocks" in text_page:
                        for b in text_page["blocks"]:
                            if "lines" in b:
                                for line in b["lines"]:
                                    line_text = "".join([span["text"] for span in line.get("spans", [])]).strip()
                                    if line_text:
                                        # Use line bounding box to avoid clipping text
                                        x0 = min(span["bbox"][0] for span in line["spans"])
                                        y0 = min(span["bbox"][1] for span in line["spans"])
                                        x1 = max(span["bbox"][2] for span in line["spans"])
                                        y1 = max(span["bbox"][3] for span in line["spans"])
                                        text_blocks_to_translate.append({
                                            "rect": [x0, y0, x1, y1],
                                            "text": line_text
                                        })
                except Exception as ex:
                    print(f"[AI Translate Extraction Warning]: {ex}")

                if not text_blocks_to_translate:
                    continue

                chunk_size = 20
                translated_map = {}
                for i in range(0, len(text_blocks_to_translate), chunk_size):
                    chunk = text_blocks_to_translate[i:i+chunk_size]
                    payload_texts = [{"id": i + idx, "text": item["text"]} for idx, item in enumerate(chunk)]

                    prompt = (
                        f"Translate the following text items into {lang_name}.\n"
                        "Return your response strictly as a JSON array of objects with 'id' (integer) and 'translated_text' (string) properties. No markdown.\n"
                        f"Inputs:\n{json.dumps(payload_texts, ensure_ascii=False)}"
                    )

                    try:
                        ai_text = AiService._generate_with_gemini_http(prompt, api_key, response_mime_type="application/json")
                        res_array = AiService._clean_and_parse_json(ai_text)
                        if isinstance(res_array, dict):
                            res_array = res_array.get("translations", res_array.get("results", res_array.get("data", [])))
                        if isinstance(res_array, list):
                            for item in res_array:
                                if isinstance(item, dict) and ("id" in item or "index" in item):
                                    idx_val = int(item.get("id", item.get("index", 0)))
                                    trans_val = str(item.get("translated_text", item.get("translation", "")))
                                    translated_map[idx_val] = trans_val
                    except Exception as inner_err:
                        print(f"[AI Translate Chunk Error]: {inner_err}")

                for idx, item in enumerate(text_blocks_to_translate):
                    x0, y0, x1, y1 = item["rect"]
                    width_buffer = max(20.0, (x1 - x0) * 0.25)
                    rect = fitz.Rect(max(0, x0 - 2), max(0, y0 - 1), min(page.rect.width, x1 + width_buffer), min(page.rect.height, y1 + 3))

                    try:
                        page.add_redact_annot(rect, fill=(1, 1, 1))
                        page.apply_redactions()
                    except Exception:
                        pass

                    translated_text = translated_map.get(idx, item["text"])
                    box_height = max(10, y1 - y0)
                    initial_fontsize = max(7, min(12, box_height * 0.8))

                    fitted = False
                    for fs in range(int(initial_fontsize), 4, -1):
                        rc = page.insert_textbox(
                            rect,
                            translated_text,
                            fontname=registered_font_name,
                            fontsize=fs,
                            color=(0, 0, 0),
                            align=0
                        )
                        if rc >= 0:
                            fitted = True
                            break
                    
                    if not fitted:
                        page.insert_textbox(rect, translated_text, fontname="helv", fontsize=6, color=(0, 0, 0), align=0)

            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True)
            bytes_data = output.getvalue()
            doc.close()
            return bytes_data
        except Exception as e:
            raise RuntimeError(f"AI Translation failed: {str(e)}")