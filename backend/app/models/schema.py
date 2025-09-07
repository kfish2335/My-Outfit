# app/models/schema.py
from __future__ import annotations
from typing import List, Optional, Dict, Literal, Union
from pydantic import BaseModel, Field, field_validator

# -------------------------
# Enumerations (align with TS)
# -------------------------

StyleVibe = Literal[
    "neat", "relaxed", "professional", "trendy", "old_money",
    "streetwear", "athleisure", "minimalist", "smart_casual",
    "techwear", "edgy", "grunge", "bohemian", "retro", "y2k",
    "mediterranean", "scandinavian",
]

BodyType = Literal["slim", "athletic", "regular", "broad", "plus_size"]

Season = Literal["spring", "summer", "fall", "winter", "all"]

# -------------------------
# Request models
# -------------------------

class Weather(BaseModel):
    temp: float
    rain: bool = False
    wind: Optional[bool] = None  # tolerated by backend even if frontend omits

class Style(BaseModel):
    vibe: Optional[str] = None       # keep string to accept any value from client
    fit: Optional[str] = None
    palette: Optional[str] = None

class SpecialItems(BaseModel):
    centerpiece: Optional[str] = None
    must_include: Optional[str] = None

class Constraints(BaseModel):
    avoid: Optional[List[str]] = None
    budget: Optional[float] = None

class OutputOpts(BaseModel):
    count: int = 4                 # default to 4 outfits as requested
    include_notes: bool = True

class SuggestRequest(BaseModel):
    occasion: str
    weather: Weather
    style: Style
    special_items: SpecialItems = Field(default_factory=SpecialItems)
    constraints: Constraints = Field(default_factory=Constraints)
    output: OutputOpts = Field(default_factory=OutputOpts)
    age: Optional[int] = None
    body_type: Optional[str] = None  # keep string for flexibility with client
    season: Optional[Season] = None  # new

# -------------------------
# Response models (align with frontend)
# -------------------------

class OutfitItems(BaseModel):
    top: Optional[str] = None
    bottom: Optional[str] = None
    shoes: Optional[str] = None
    outerwear: Optional[str] = None
    layer: Optional[str] = None
    accessories: List[str] = Field(default_factory=list)

class OutfitIcons(BaseModel):
    top: Optional[str] = None
    bottom: Optional[str] = None
    shoes: Optional[str] = None
    outerwear: Optional[str] = None
    layer: Optional[str] = None
    # accessories icons are a list of icon slugs (nullable items allowed)
    accessories: Optional[List[Optional[str]]] = None

class OutfitIconsImg(BaseModel):
    # base64 PNGs from DALL·E (no data URL prefix; frontend adds it)
    top: Optional[str] = None
    bottom: Optional[str] = None
    shoes: Optional[str] = None
    outerwear: Optional[str] = None
    layer: Optional[str] = None
    accessories: Optional[List[Optional[str]]] = None

class Outfit(BaseModel):
    items: OutfitItems
    # Optional visual enrichments
    icons: Optional[OutfitIcons] = None          # Iconify slugs (optional)
    icons_img: Optional[OutfitIconsImg] = None   # DALL·E base64 images (optional)
    # Optional per-item colors (hex), keys may include: top, bottom, shoes, outerwear, layer, accessories
    items_colors: Optional[Dict[str, str]] = None

    # Explanation & guidance
    why: Optional[str] = None
    notes: Optional[str] = None
    fit_notes: Optional[str] = None

    # Overall palette suggestion
    palette: Optional[List[str]] = None

    @field_validator("palette")
    @classmethod
    def coerce_palette(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        # Ensure list even if model returns a single string
        if v is None:
            return None
        return list(v)

class SuggestResponse(BaseModel):
    outfits: List[Outfit]

# -------------------------
# Feedback & refinement (if used)
# -------------------------

class FeedbackPayload(BaseModel):
    liked: Optional[List[str]] = None
    disliked: Optional[List[str]] = None
    fit_issues: Optional[List[str]] = None
    notes: Optional[str] = None

class FeedbackRequest(BaseModel):
    original_request: SuggestRequest
    previous_outfits: List[Outfit] = Field(default_factory=list)
    feedback: FeedbackPayload
    output: OutputOpts = Field(default_factory=OutputOpts)

class FeedbackResponse(BaseModel):
    outfits: List[Outfit]

# -------------------------
# Saved object shape (matches frontend)
# -------------------------

class SavedOutfit(BaseModel):
    id: str
    savedAt: int
    request: SuggestRequest
    outfit: Outfit
    feedback: Optional[FeedbackPayload] = None