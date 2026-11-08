"""
Autonomous Hindi Media Pipeline - Global Configuration & Presets
"""

import os
from dataclasses import dataclass, field
from typing import Dict, Any

# Supported Visual Styles
STYLE_PRESETS: Dict[str, Dict[str, str]] = {
    "mythological-art": {
        "name": "Indian Mythological Epic 3D",
        "prompt_suffix": (
            "Indian mythological 3D digital concept art, divine atmosphere, "
            "ancient Vedic aesthetics, ethereal golden aura, glowing lighting, "
            "sacred Indian architecture, hyper-detailed, octane render 8k, cinematic composition"
        ),
        "negative_prompt": (
            "blurry, deformed, low quality, distorted facial features, disfigured hands, "
            "western modern clothing, sunglasses, cars, electronics, watermark, signature, text"
        ),
    },
    "panchatantra-3d": {
        "name": "Panchatantra Vibrant 3D Storybook",
        "prompt_suffix": (
            "Pixar-style Panchatantra 3D fable animation, rich Indian jungle flora, "
            "expressive character emotion, vibrant warm color palette, soft golden hour sunlight, "
            "detailed textures, storybook illustration masterpiece, Unreal Engine 5 render"
        ),
        "negative_prompt": (
            "scary, horror, dark, gritty, photorealistic human, grotesque, low resolution, "
            "blurry, deformed limbs, watermark, caption, borders"
        ),
    },
    "indian-miniature": {
        "name": "Classical Rajasthani / Mughal Miniature Art",
        "prompt_suffix": (
            "Classical Indian miniature painting, intricate gold leaf ornamentation, "
            "traditional Rajasthani folk heritage, handcrafted gouache textures, "
            "ornate architectural arches, museum quality, cultural masterpiece"
        ),
        "negative_prompt": (
            "3D CGI, modern, neon, digital gloss, blurry, bad anatomy, modern clothes, watermark"
        ),
    },
}

# Supported Voice Presets
VOICE_PRESETS: Dict[str, Dict[str, str]] = {
    "male": {
        "id": "hi-IN-MadhurNeural",
        "gender": "Male",
        "description": "Deep, authoritative, resonant Indian male voice ideal for epic mythology and moral fables.",
        "pitch": "+0Hz",
        "rate": "-3%",
    },
    "female": {
        "id": "hi-IN-SwaraNeural",
        "gender": "Female",
        "description": "Warm, melodic, expressive Indian female voice ideal for storybook narration and folklore.",
        "pitch": "+1Hz",
        "rate": "-2%",
    },
}

# Video Resolution Profiles
VIDEO_PROFILES = {
    "longform": {
        "name": "YouTube Long-Form (16:9)",
        "width": 1920,
        "height": 1080,
        "aspect_ratio": "16:9",
        "fps": 30,
        "video_bitrate": "4500k",
        "audio_bitrate": "192k",
        "sub_font_size": 22,
        "sub_margin_v": 45,
        "sub_style": (
            "FontName=Nirmala UI,FontSize=22,PrimaryColour=&H00FFFFFF,"
            "OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=3,"
            "Outline=2.5,Shadow=1,Alignment=2,MarginV=45"
        ),
    },
    "shorts": {
        "name": "YouTube Shorts / Reels (9:16)",
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
        "fps": 30,
        "video_bitrate": "4500k",
        "audio_bitrate": "192k",
        "sub_font_size": 28,
        "sub_margin_v": 130,  # Placed above the Shorts UI buttons
        "sub_style": (
            "FontName=Nirmala UI,FontSize=28,PrimaryColour=&H0000FFFF,"  # Vibrant yellow text for high retention
            "OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=3,"
            "Outline=3.0,Shadow=1.5,Alignment=2,MarginV=130"
        ),
    },
}

@dataclass
class PipelineConfig:
    """Master configuration dataclass for the media pipeline."""
    story_type: str = "panchatantra"  # 'panchatantra' or 'mythology'
    style_key: str = "panchatantra-3d"
    voice_key: str = "male"
    tts_engine: str = "edge"  # 'edge' or 'kokoro'
    whisper_model: str = "base"  # 'tiny', 'base', 'small'
    output_dir: str = "outputs"
    fps: int = 30
    ken_burns_zoom_speed: float = 0.0015
    bgm_volume_db: float = -20.0  # ducked BGM volume
    seed: int = 42891
    max_scene_seconds: int = 15
    min_scene_seconds: int = 4
