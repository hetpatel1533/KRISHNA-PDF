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
            raise ValueError("Google Gemini API Key is required. Please enter your valid API key starting with 'AQ' or 'AIza' in your account vault.")
        
        # Try official google-genai SDK first if available
        if GENAI_SDK_AVAILABLE:
            try:
                client = genai.Client(api_key=api_key)
                sdk_models = ["gemini-3.5-flash", "gemini-3.6-flash"]
                for m in sdk_models:
                    try:
                        config = {}
                        if response_mime_type == "application/json":
                            config["response_mime_type"] = "application/json"
                        response = client.models.generate_content(
                            model=m,
                            contents=prompt,
                            config=config if config else None
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as sdk_err:
                        print(f"[Gemini SDK Model {m} Error]: {sdk_err}")
                        continue
            except Exception as e:
                print(f"[Gemini SDK Init Error]: {e}")

        # Fallback to robust HTTP REST API using current stable models
        models = ["gemini-3.5-flash", "gemini-3.6-flash"]
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
        
        raise last_error or RuntimeError("Gemini API query execution failed on all targets. Verify your API key format ('AQ...' or 'AIza...').")

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
        import platform
        system = platform.system()
        if system == "Windows":
            candidates = ["Nirmala.ttf", "mangal.ttf", "arial.ttf", "Calibri.ttf", "tahoma.ttf"]
            for c in candidates:
                p = os.path.join(r"C:\Windows\Fonts", c)
                if os.path.exists(p) and os.path.getsize(p) > 1000:
                    return p

        font_urls = {
            "hi": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
            "bn": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
            "te": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf",
            "ta": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf",
            "ur": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf",
            "gu": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf",
            "kn": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf",
            "ml": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf",
            "pa": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf"
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
            with urllib.request.urlopen(req, timeout=10) as response:
                with open(font_path, "wb") as f:
                    f.write(response.read())
            return font_path
        except Exception as e:
            print(f"[Font Download Warning]: {e}")
            return "helv"

    @staticmethod
    def summarize_pdf(file_bytes: bytes, summary_length: str = "medium", focus: str = "general", api_key: Optional[str] = None) -> Dict[str, Any]:
        if not api_key or not (api_key.startswith("AQ") or api_key.startswith("AIza") or api_key.startswith("AIzaSy")):
            raise ValueError("Valid Google Gemini API Key starting with 'AQ' or 'AIza' is strictly required for summarization.")

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            total_pages = len(doc)
            full_text = ""
            for page in doc:
                full_text += page.get_text("text") + "\n"
            doc.close()

            clean_text = re.sub(r'\s+', ' ', full_text).strip()
            if not clean_text:
                return {
                    "summary": "The uploaded PDF does not contain extractable machine-readable text structures.",
                    "highlights": ["Unable to extract text from document content blocks."],
                    "key_topics": ["Visual PDF"],
                    "word_count": 0,
                    "reading_time_mins": 0,
                    "pages": total_pages
                }

            words = clean_text.split()
            word_count = len(words)
            reading_time_mins = max(1, math.ceil(word_count / 200))

            length_instruction = {
                "brief": "Provide a concise summary of roughly 4-6 sentences.",
                "medium": "Provide a balanced, multi-paragraph executive summary covering all primary sections.",
                "detailed": "Provide a comprehensive, highly thorough, in-depth analysis and summary covering all nuanced clauses and data points."
            }.get(summary_length, "Provide a balanced summary.")

            prompt = (
                f"You are an expert document analyst. Summarize the following document text with a focus on '{focus}' "
                f"and follow this length requirement: {length_instruction}\n\n"
                "Return your response ONLY as a valid JSON object. Do not format with markdown blocks.\n"
                "Structure your JSON exactly with this template:\n"
                "{\n"
                "  \"summary\": \"A detailed summary paragraph matching requested length...\",\n"
                "  \"highlights\": [\"Key takeaway item 1\", \"Key takeaway item 2\", \"Key takeaway item 3\"]\n"
                "}\n\n"
                f"Document Text excerpt:\n{clean_text[:28000]}"
            )

            ai_response = AiService._generate_with_gemini_http(prompt, api_key, response_mime_type="application/json")
            parsed_res = AiService._clean_and_parse_json(ai_response)
            return {
                "summary": parsed_res.get("summary", ""),
                "highlights": parsed_res.get("highlights", []),
                "key_topics": [focus.capitalize(), "AI Summary"],
                "word_count": word_count,
                "reading_time_mins": reading_time_mins,
                "pages": total_pages
            }
        except Exception as e:
            raise RuntimeError(f"AI Summarization critical error: {str(e)}")

    @staticmethod
    def translate_pdf(file_bytes: bytes, target_language: str = "hi", api_key: Optional[str] = None) -> bytes:
        if not api_key or not (api_key.startswith("AQ") or api_key.startswith("AIza") or api_key.startswith("AIzaSy")):
            raise ValueError("Valid Google Gemini API Key starting with 'AQ' or 'AIza' is strictly required for translation.")

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
                        if isinstance(res_font, str) and res_font:
                            registered_font_name = res_font
                        else:
                            registered_font_name = f"font_{target_language}"
                        break
                except Exception as fe:
                    print(f"[Font Registration Warning]: {fe}")
                    registered_font_name = "helv"

            for page_idx, page in enumerate(doc):
                text_blocks_to_translate = []
                try:
                    text_page = page.get_text("dict")
                    if "blocks" in text_page:
                        for b in text_page["blocks"]:
                            if "lines" in b:
                                for line in b["lines"]:
                                    for span in line["spans"]:
                                        text = span["text"].strip()
                                        if text:
                                            text_blocks_to_translate.append({
                                                "rect": list(span["bbox"]),
                                                "text": text
                                            })
                except Exception as ex:
                    print(f"[AI Translate Span Extraction Warning]: {ex}")

                if not text_blocks_to_translate:
                    continue

                chunk_size = 25
                translated_map = {}
                for i in range(0, len(text_blocks_to_translate), chunk_size):
                    chunk = text_blocks_to_translate[i:i+chunk_size]
                    payload_texts = [{"id": i + idx, "text": item["text"]} for idx, item in enumerate(chunk)]

                    prompt = (
                        f"Translate the following JSON list of text blocks into {lang_name}. Maintain exact numbers, acronyms, and formatting.\n"
                        "Return your response strictly as a JSON array of objects with 'id' (integer) and 'translated_text' (string) properties, or a JSON object containing them. No markdown formatting.\n"
                        f"Inputs:\n{json.dumps(payload_texts, ensure_ascii=False)}"
                    )

                    try:
                        ai_text = AiService._generate_with_gemini_http(prompt, api_key, response_mime_type="application/json")
                        res_array = AiService._clean_and_parse_json(ai_text)
                        if isinstance(res_array, dict):
                            res_array = res_array.get("translations", res_array.get("results", res_array.get("data", [])))
                        if isinstance(res_array, list):
                            for item in res_array:
                                if isinstance(item, dict) and ("id" in item or "index" in item) and ("translated_text" in item or "translation" in item):
                                    try:
                                        idx_val = int(item.get("id", item.get("index", 0)))
                                        trans_val = str(item.get("translated_text", item.get("translation", "")))
                                        translated_map[idx_val] = trans_val
                                    except (ValueError, TypeError):
                                        continue
                    except Exception as inner_err:
                        print(f"[AI Translate Chunk Warning]: {inner_err}")

                for idx, item in enumerate(text_blocks_to_translate):
                    x0, y0, x1, y1 = item["rect"]
                    rect = fitz.Rect(x0, y0, x1, y1)
                    
                    try:
                        page.add_redact_annot(rect, fill=(1, 1, 1))
                        page.apply_redactions()
                    except Exception:
                        pass

                    translated_text = translated_map.get(idx, item["text"])
                    box_height = max(12, y1 - y0)
                    fontsize = max(8, min(12, box_height * 0.85))
                    
                    try:
                        page.insert_textbox(
                            rect,
                            translated_text,
                            fontname=registered_font_name,
                            fontsize=fontsize,
                            color=(0, 0, 0),
                            align=0
                        )
                    except Exception:
                        try:
                            page.insert_textbox(
                                rect,
                                translated_text,
                                fontname="helv",
                                fontsize=fontsize,
                                color=(0, 0, 0),
                                align=0
                            )
                        except Exception:
                            pass

            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True)
            bytes_data = output.getvalue()
            doc.close()
            return bytes_data
        except Exception as e:
            raise RuntimeError(f"AI Translation failed: {str(e)}")
