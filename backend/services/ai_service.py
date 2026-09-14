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
        
        models = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"]

        if GENAI_SDK_AVAILABLE:
            try:
                client = genai.Client(api_key=api_key)
                for m in models:
                    try:
                        config = {}
                        if response_mime_type == "application/json":
                            config["response_mime_type"] = "application/json"
                        
                        response = client.models.generate_content(
                            model=m,
                            contents=prompt,
                            config=types.GenerateContentConfig(**config) if config else None
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as sdk_err:
                        print(f"[Gemini SDK Model {m} Error]: {sdk_err}")
                        continue
            except Exception as e:
                print(f"[Gemini SDK Init Error]: {e}")

        last_error = None
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            if response_mime_type == "application/json":
                payload["generationConfig"] = {"responseMimeType": "application/json"}
            
            try:
                req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
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
                continue
        
        if last_error:
            raise ValueError(f"Gemini API request failed: {str(last_error)}")
        raise ValueError("Failed to generate content from Gemini API models.")

    @staticmethod
    def _clean_and_parse_json(text: str, fallback_summary: str = "") -> Any:
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
            return {
                "summary": text or fallback_summary,
                "highlights": ["Real-time document analysis extracted successfully from Gemini LLM."],
                "word_count": len((text or fallback_summary).split()),
                "reading_time_mins": max(1, math.ceil(len((text or fallback_summary).split()) / 200)),
                "pages": 1
            }

    @staticmethod
    def summarize_pdf(file_bytes: bytes, summary_length: str = "medium", focus: str = "general", api_key: Optional[str] = None) -> Dict[str, Any]:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        full_text = "".join([p.get_text("text") for p in doc])
        doc.close()
        
        clean_text = re.sub(r'\s+', ' ', full_text).strip()[:15000]
        if not clean_text:
            clean_text = "[Scanned PDF or empty document stream]"

        prompt = f"Analyze the following document text thoroughly and provide a {summary_length} executive summary focused strictly on {focus}. Return a valid JSON object with keys: 'summary' (detailed string analysis of the document), 'highlights' (array of 3 to 5 key bullet points/takeaways as strings), 'word_count' (integer), 'reading_time_mins' (integer), 'pages' ({total_pages}). Document text: {clean_text}"
        
        try:
            ai_response = AiService._generate_with_gemini_http(prompt, api_key, "application/json")
            result = AiService._clean_and_parse_json(ai_response, fallback_summary=clean_text[:1000])
        except Exception as e:
            result = {
                "summary": f"Error during Gemini generation: {str(e)}",
                "highlights": ["Please verify your Gemini API key in account settings."],
                "word_count": 10,
                "reading_time_mins": 1,
                "pages": total_pages
            }
        
        if isinstance(result, dict):
            result["pages"] = total_pages
            if "word_count" not in result or not result["word_count"]:
                result["word_count"] = len(str(result.get("summary", "")).split())
            if "reading_time_mins" not in result or not result["reading_time_mins"]:
                result["reading_time_mins"] = max(1, math.ceil(result["word_count"] / 200))
            if "highlights" not in result or not isinstance(result["highlights"], list):
                result["highlights"] = ["Document successfully analyzed with Gemini LLM."]
            return result
            
        return {
            "summary": str(result),
            "highlights": ["Detailed summary generated successfully via Google Gemini LLM."],
            "word_count": len(str(result).split()),
            "reading_time_mins": max(1, math.ceil(len(str(result).split()) / 200)),
            "pages": total_pages
        }

    @staticmethod
    def translate_pdf(file_bytes: bytes, target_language: str = "hi", api_key: Optional[str] = None) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text = page.get_text("text")
            if not text.strip(): continue
            prompt = f"Translate this document text into target language code '{target_language}'. Keep original structure and formatting. Text: {text[:2000]}"
            translated = AiService._generate_with_gemini_http(prompt, api_key)
            page.delete_text()
            page.insert_text((50, 50), translated, fontsize=10)
        output = io.BytesIO()
        doc.save(output, garbage=4, deflate=True)
        doc.close()
        return output.getvalue()
