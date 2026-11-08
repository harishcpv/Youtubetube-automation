"""
Visual Asset & Character Consistency Agent
Generates and locks the Master Character Reference Image on Scene 1,
and produces character-consistent visuals across all story scenes.
"""

import os
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from ..utils import safe_print

class VisualAssetAgent:
    """
    Expert Agent that handles:
    1. Locking Master Character Reference Image in Scene 1.
    2. Consistent visual generation across all scenes using seed locking and anchor prompt injection.
    3. Resilient multi-tier generation (Pollinations AI free Flux/SDXL -> Procedural Indian Canvas).
    """

    def __init__(self, output_dir: str = "outputs", default_seed: int = 42891):
        self.output_dir = output_dir
        self.default_seed = default_seed
        self.frames_dir = os.path.join(output_dir, "frames")
        os.makedirs(self.frames_dir, exist_ok=True)
        self.master_ref_path: Optional[str] = None

    def generate_master_reference_image(self, master_char: Dict[str, Any], style_suffix: str) -> str:
        """
        Generates and locks the 'Master Character Reference Image' on the first scene.
        Returns local path to the saved master reference image.
        """
        ref_filename = "master_character_reference.png"
        ref_path = os.path.join(self.output_dir, ref_filename)

        prompt = (
            f"Master Character Reference Sheet, full body turn-around portrait of {master_char['name_en']}. "
            f"{master_char['visual_anchor_prompt']}, neutral studio lighting, intricate details, "
            f"character concept design sheet, {style_suffix}"
        )
        seed = master_char.get("locked_seed", self.default_seed)

        safe_print(f"\n[VisualAgent] 🔒 Generating & Locking Master Character Reference...")
        safe_print(f"             Character: {master_char['name_hi']} ({master_char['name_en']})")
        safe_print(f"             Visual Seed: {seed}")

        success = self._download_ai_image(
            prompt=prompt,
            seed=seed,
            width=1280,
            height=720,
            save_path=ref_path
        )

        if not success:
            safe_print("[VisualAgent] ⚠️ Network generation failed; rendering procedural Master Character Reference...")
            self._generate_procedural_fallback(
                save_path=ref_path,
                title=f"MASTER REFERENCE: {master_char['name_hi']}",
                subtitle=master_char['name_en'],
                description=master_char['facial_features']
            )

        self.master_ref_path = ref_path
        safe_print(f"[VisualAgent] ✅ Master Character Reference locked at: {ref_path}")
        return ref_path

    def generate_all_scenes(
        self,
        scenes: List[Dict[str, Any]],
        master_char: Dict[str, Any],
        style_suffix: str
    ) -> List[str]:
        """
        Generates images for all scenes, ensuring identical character identity and style
        by binding to the master reference seed and visual descriptors.
        """
        scene_image_paths = []
        seed = master_char.get("locked_seed", self.default_seed)

        for scene in scenes:
            scene_id = scene["scene_id"]
            img_filename = f"scene_{scene_id:03d}.png"
            img_path = os.path.join(self.frames_dir, img_filename)

            safe_print(f"[VisualAgent] 🎨 Generating Scene {scene_id}/{len(scenes)} with locked seed {seed}...")

            # Strict prompt injection referencing Master Character
            prompt = scene["visual_prompt"]
            success = self._download_ai_image(
                prompt=prompt,
                seed=seed,  # Consistent seed locked to Master Character
                width=1280,
                height=720,
                save_path=img_path
            )

            if not success:
                safe_print(f"[VisualAgent] ⚠️ Rendering fallback artistic scene {scene_id}...")
                self._generate_procedural_fallback(
                    save_path=img_path,
                    title=f"दृश्य {scene_id}: {master_char['name_hi']}",
                    subtitle=scene.get("visual_action", "कथा दृश्य"),
                    description=scene.get("hindi_narration", "")[:60] + "..."
                )

            scene_image_paths.append(img_path)
            # Brief pause to respect free rate-limits
            time.sleep(1.0)

        return scene_image_paths

    def _download_ai_image(
        self,
        prompt: str,
        seed: int,
        width: int,
        height: int,
        save_path: str
    ) -> bool:
        """
        Fetches an AI-generated image using the free Pollinations.ai API
        with seed locking, model selection, and error handling.
        """
        encoded_prompt = urllib.parse.quote(prompt[:380])
        # Pollinations free tier is unlimited and 100% free with default model / turbo
        url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?seed={seed}&width={width}&height={height}&nologo=true"
        )

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        req = urllib.request.Request(url, headers=headers)
        for attempt in range(1, 4):
            try:
                with urllib.request.urlopen(req, timeout=35) as resp, open(save_path, "wb") as f:
                    f.write(resp.read())
                # Verify image can be parsed by PIL
                with Image.open(save_path) as img:
                    img.verify()
                return True
            except Exception as e:
                safe_print(f"[VisualAgent] Attempt {attempt} failed: {e}")
                time.sleep(2.5)
        return False

    def _generate_procedural_fallback(
        self,
        save_path: str,
        title: str,
        subtitle: str,
        description: str
    ) -> None:
        """
        Generates an Indian mythological aesthetic canvas with sacred color gradients,
        decorative borders, and typography so the pipeline functions even offline.
        """
        w, h = 1920, 1080
        canvas = Image.new("RGB", (w, h), color=(25, 15, 10))
        draw = ImageDraw.Draw(canvas)

        # Draw sacred saffron-gold gradient
        for y in range(h):
            ratio = y / h
            r = int(45 + ratio * (180 - 45))
            g = int(20 + ratio * (70 - 20))
            b = int(10 + ratio * (25 - 10))
            draw.line([(0, y), (w, y)], fill=(r, g, b))

        # Add decorative ornate border
        border_inset = 40
        draw.rectangle(
            [border_inset, border_inset, w - border_inset, h - border_inset],
            outline=(212, 175, 55),  # Gold color
            width=5
        )
        draw.rectangle(
            [border_inset + 15, border_inset + 15, w - border_inset - 15, h - border_inset - 15],
            outline=(255, 215, 0),
            width=2
        )

        # Center card
        card_w, card_h = 1200, 500
        cx, cy = w // 2, h // 2
        card_box = [cx - card_w // 2, cy - card_h // 2, cx + card_w // 2, cy + card_h // 2]
        draw.rectangle(card_box, fill=(15, 10, 8, 220), outline=(218, 165, 32), width=3)

        # Add text
        try:
            # Try to load Windows Nirmala UI font for clean Devanagari
            font_title = ImageFont.truetype("Nirmala.ttf", 52)
            font_sub = ImageFont.truetype("Nirmala.ttf", 32)
            font_body = ImageFont.truetype("Nirmala.ttf", 24)
        except:
            font_title = ImageFont.load_default()
            font_sub = font_title
            font_body = font_title

        draw.text((cx, cy - 120), title, fill=(255, 215, 0), font=font_title, anchor="mm")
        draw.text((cx, cy - 30), subtitle, fill=(240, 230, 210), font=font_sub, anchor="mm")
        draw.text((cx, cy + 80), description, fill=(200, 190, 170), font=font_body, anchor="mm")

        # Sacred Om / Sun emblem watermark in corner
        draw.ellipse([w - 180, 70, w - 80, 170], outline=(255, 215, 0), width=3)
        draw.text((w - 130, 120), "ॐ", fill=(255, 215, 0), font=font_title, anchor="mm")

        canvas.save(save_path, "PNG")
