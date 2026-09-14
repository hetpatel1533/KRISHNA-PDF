from enum import Enum
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field, field_validator


class CompressionPreset(str, Enum):
    EXTREME = "extreme"
    RECOMMENDED = "recommended"
    LOW = "low"


class AnnotationType(str, Enum):
    TEXT = "text"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"
    HIGHLIGHT = "highlight"
    FREEHAND = "freehand"


class SplitRangeRequest(BaseModel):
    ranges: str = Field(..., description="Comma-separated page ranges (e.g., '1-3, 5, 7-9'). 1-indexed.")
    split_into_individual: bool = Field(default=False, description="If True, extracts each specified page into its own separate PDF file.")

    @field_validator("ranges")
    @classmethod
    def validate_ranges(cls, v: str) -> str:
        clean_v = v.replace(" ", "")
        if not clean_v:
            raise ValueError("Page range string cannot be empty.")
        allowed_chars = set("0123456789,-")
        if not set(clean_v).issubset(allowed_chars):
            raise ValueError("Page range contains invalid characters.")
        return clean_v


class CompressionSettings(BaseModel):
    preset: CompressionPreset = Field(default=CompressionPreset.RECOMMENDED)
    image_quality: int = Field(default=70, ge=1, le=100)
    dpi: int = Field(default=150, ge=50, le=600)
    remove_metadata: bool = Field(default=True)


class AnnotationOverlay(BaseModel):
    id: str
    type: AnnotationType
    page: int = Field(..., ge=0)
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    color: str = Field(default="#000000")
    fill_color: Optional[str] = None
    thickness: float = Field(default=2.0, ge=0.5, le=20.0)
    text: Optional[str] = None
    font_size: Optional[float] = Field(default=12.0, ge=6.0, le=72.0)
    points: Optional[List[Tuple[float, float]]] = None
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)


class TextEditItem(BaseModel):
    page_index: int
    bbox: List[float]
    old_text: str
    new_text: str
    font_size: Optional[float] = 12.0


class SignatureCoordinatePayload(BaseModel):
    page: int = Field(..., ge=0)
    x: float
    y: float
    width: float = Field(..., ge=10.0)
    height: float = Field(..., ge=10.0)
    signature_image: str
