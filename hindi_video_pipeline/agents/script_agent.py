"""
Script Analyst & Scene Chunker Agent
Parses raw Hindi mythological and Panchatantra story scripts into structured,
time-paced scenes with Master Character Profiles and prosody markup.
"""

import re
import json
import random
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

@dataclass
class MasterCharacterProfile:
    name_hi: str
    name_en: str
    archetype: str
    facial_features: str
    clothing_and_ornaments: str
    color_palette: str
    visual_anchor_prompt: str
    locked_seed: int

@dataclass
class SceneChunk:
    scene_id: int
    hindi_narration: str
    prosody_ssml: str
    visual_action: str
    visual_prompt: str
    characters: List[str]
    camera_motion: str  # 'zoom_in', 'zoom_out', 'pan_left', 'pan_right'
    mood: str

class ScriptAnalystAgent:
    """
    Expert Agent that decomposes raw Hindi scripts into synchronized audiovisual scenes,
    extracts Master Character Anchors for visual consistency, and formats speech prosody.
    """

    def __init__(self, story_type: str = "panchatantra", default_seed: int = 42891):
        self.story_type = story_type
        self.default_seed = default_seed

    def analyze_script(self, raw_script: str, style_suffix: str) -> Dict[str, Any]:
        """
        Main pipeline entry point for script analysis.
        Returns master character profile and chunked scenes list.
        """
        # Clean and normalize raw Hindi text
        cleaned_text = self._clean_hindi_text(raw_script)

        # Extract Master Character Profile from the opening premise
        master_character = self._extract_master_character(cleaned_text)

        # Chunk narrative into paced scenes
        scene_texts = self._chunk_into_scenes(cleaned_text)

        # Build detailed scene objects with visual prompts & prosody
        scenes: List[SceneChunk] = []
        camera_motions = ["zoom_in", "zoom_out", "pan_left", "pan_right"]

        for idx, text in enumerate(scene_texts, start=1):
            motion = camera_motions[(idx - 1) % len(camera_motions)]
            mood = self._detect_mood(text)
            ssml = self._format_prosody_ssml(text, mood)
            visual_action = self._derive_visual_action(text, idx, len(scene_texts))
            
            # Construct scene visual prompt maintaining Character Consistency
            visual_prompt = self._build_consistent_scene_prompt(
                scene_num=idx,
                action=visual_action,
                master_char=master_character,
                style_suffix=style_suffix
            )

            scenes.append(SceneChunk(
                scene_id=idx,
                hindi_narration=text,
                prosody_ssml=ssml,
                visual_action=visual_action,
                visual_prompt=visual_prompt,
                characters=[master_character.name_hi],
                camera_motion=motion,
                mood=mood
            ))

        return {
            "master_character": asdict(master_character),
            "scenes": [asdict(s) for s in scenes],
            "total_scenes": len(scenes)
        }

    def _clean_hindi_text(self, text: str) -> str:
        """Normalizes Unicode Devanagari characters, spaces, and punctuation."""
        # Replace multiple spaces/newlines
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{2,}', '\n', text)
        return text.strip()

    def _extract_master_character(self, text: str) -> MasterCharacterProfile:
        """
        Identifies the primary protagonist from the Hindi story and constructs
        a locked Master Character Reference specification.
        """
        seed = self.default_seed or random.randint(10000, 99999)

        # Common Mythological and Panchatantra protagonist detection
        if any(w in text for w in ["शेर", "सिंह", "वनराज"]):
            return MasterCharacterProfile(
                name_hi="सिंह (शेर)",
                name_en="The King Lion",
                archetype="Majestic Forest Monarch",
                facial_features="Glorious thick golden mane, sharp amber eyes, regal scarred brow, noble expression",
                clothing_and_ornaments="Ancient Indian royal garland of wild forest flowers, subtle gold forehead tilak",
                color_palette="Warm gold, deep ochre, emerald jungle green",
                visual_anchor_prompt=(
                    "Master character reference sheet of a majestic Indian lion king, thick golden mane, "
                    "piercing amber eyes, regal posture, traditional Indian royal flower garland around neck, "
                    "sacred red sandalwood tilak on forehead, consistent facial structure, golden ochre fur"
                ),
                locked_seed=seed
            )
        elif any(w in text for w in ["लोमड़ी", "शृगाल", "सियार"]):
            return MasterCharacterProfile(
                name_hi="चालाक लोमड़ी",
                name_en="Clever Fox",
                archetype="Cunning Forest Sage",
                facial_features="Sleek reddish-orange fur, bright intelligent green eyes, sharp snout, bushy white-tipped tail",
                clothing_and_ornaments="Small ornate rudraksha bead necklace around neck, traditional Indian forest cloth sash",
                color_palette="Fiery orange, soft cream, sage green",
                visual_anchor_prompt=(
                    "Master character reference sheet of an anthropomorphic clever Indian fox, vibrant reddish-orange fur, "
                    "intelligent expressive green eyes, small rudraksha bead necklace, intricate cream markings on chest, "
                    "consistent facial structure, sharp witty smile"
                ),
                locked_seed=seed
            )
        elif any(w in text for w in ["कछुआ", "कच्छप"]):
            return MasterCharacterProfile(
                name_hi="कछुआ",
                name_en="The Wise Tortoise",
                archetype="Panchatantra Ancient Tortoise",
                facial_features="Ancient patterned moss-green shell with Vedic geometric engravings, wise wrinkled eyes",
                clothing_and_ornaments="Small yellow silk border sash draped around shell",
                color_palette="Jade green, terracotta, warm sandstone",
                visual_anchor_prompt=(
                    "Master character reference sheet of an expressive Panchatantra tortoise, intricate ancient moss-green shell, "
                    "wise expressive eyes, ornate Vedic patterns on shell, consistent reptile facial features"
                ),
                locked_seed=seed
            )
        elif any(w in text for w in ["अर्जुन", "पार्थ", "धनुर्धर"]):
            return MasterCharacterProfile(
                name_hi="धनुर्धर अर्जुन",
                name_en="Arjuna The Divine Archer",
                archetype="Legendary Vedic Warrior Prince",
                facial_features="Youthful handsome Aryan prince, focused resolute eyes, sharp jawline, high cheekbones",
                clothing_and_ornaments=(
                    "Gleaming golden mukut crown with peacock feather, radiant golden kavach armor, "
                    "pure white silk angavastram with zari border, celestial Gandiva divine bow slung on shoulder"
                ),
                color_palette="Radiant gold, royal blue, pure ivory silk",
                visual_anchor_prompt=(
                    "Master character reference sheet of Mahabharata warrior prince Arjuna, handsome youthful Indian prince, "
                    "intricate golden mukut crown with peacock feather, golden chest armor, white and gold silk dhoti, "
                    "carrying celestial Gandiva bow with glowing runes, divine aura, consistent face and hair"
                ),
                locked_seed=seed
            )
        elif any(w in text for w in ["कृष्ण", "कान्हा", "वासुदेव"]):
            return MasterCharacterProfile(
                name_hi="भगवान श्रीकृष्ण",
                name_en="Lord Krishna",
                archetype="Divine Supreme Avatar",
                facial_features="Mesmerizing dark blue complexion (Megha-shyam), serene compassionate lotus eyes, divine smile",
                clothing_and_ornaments=(
                    "Pitambara glowing saffron-yellow silk dhoti, golden mukut with vibrant peacock feather, "
                    "Kaustubha divine gem on chest, sacred forest flower Vaijayanti garland, celestial bansuri flute"
                ),
                color_palette="Divine cloud blue, glowing saffron gold, peacock emerald",
                visual_anchor_prompt=(
                    "Master character reference sheet of Lord Krishna, radiant blue-skinned divine youth, "
                    "peaceful compassionate lotus eyes, golden crown with peacock feather, glowing yellow pitambara silk, "
                    "holding ornate bansuri flute, golden necklace, divine transcendent aura, consistent face"
                ),
                locked_seed=seed
            )
        elif any(w in text for w in ["ब्राह्मण", "पंडित", "साधु"]):
            return MasterCharacterProfile(
                name_hi="विद्वान ब्राह्मण",
                name_en="The Learned Brahmin",
                archetype="Traditional Indian Scholar",
                facial_features="Peaceful serene face, grey sacred beard, bright spiritual gaze, tripundra vibhuti on forehead",
                clothing_and_ornaments="Saffron cotton angavastram, sacred yajnopavita thread across chest, wooden khadau sandals",
                color_palette="Saffron, sandalwood yellow, warm earthen brown",
                visual_anchor_prompt=(
                    "Master character reference sheet of an ancient Indian scholar Brahmin, white/grey beard, "
                    "sacred sandal paste tilak on forehead, orange saffron cotton robes, sacred thread, calm wise expression"
                ),
                locked_seed=seed
            )
        else:
            # Universal Protagonist Fallback
            return MasterCharacterProfile(
                name_hi="कथा नायक",
                name_en="Panchatantra Storyteller Protagonist",
                archetype="Classic Folkloric Hero",
                facial_features="Expressive Indian features, lively eyes, warm storytelling demeanor",
                clothing_and_ornaments="Traditional Indian embellished silk dhoti and ceremonial shawl with embroidery",
                color_palette="Warm ochre, royal crimson, temple gold",
                visual_anchor_prompt=(
                    "Master character reference sheet of traditional Indian story protagonist, expressive face, "
                    "traditional Indian garments with gold embroidery, rich cultural ornamentation, consistent features"
                ),
                locked_seed=seed
            )

    def _chunk_into_scenes(self, text: str) -> List[str]:
        """
        Splits narrative into 4-8 engaging scene blocks based on sentences and paragraphs.
        Maintains complete sentences and natural storytelling rhythm.
        """
        # Split by Hindi danda '।', double danda '॥', full stop, or newlines
        raw_sentences = re.split(r'[।॥\.\n]+', text)
        sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 10]

        if not sentences:
            return [text.strip()]

        # Target between 4 to 8 scenes depending on length
        total_sents = len(sentences)
        if total_sents <= 4:
            return [f"{s}।" for s in sentences]

        chunk_size = max(1, round(total_sents / 5))
        scenes = []
        for i in range(0, total_sents, chunk_size):
            group = sentences[i:i + chunk_size]
            scene_text = " ".join(group) + "।"
            scenes.append(scene_text)

        # Cap scenes to 7 max for balanced video pacing
        if len(scenes) > 7:
            merged_last = " ".join(scenes[6:])
            scenes = scenes[:6] + [merged_last]

        return scenes

    def _detect_mood(self, text: str) -> str:
        """Infers scene emotion for acoustic prosody and visual tone."""
        if any(w in text for w in ["क्रोध", "चीखा", "युद्ध", "हमला", "डर", "भय", "संकट"]):
            return "dramatic"
        elif any(w in text for w in ["आनंद", "हंसा", "प्रसन्न", "खुश", "सफल", "उत्सव"]):
            return "joyful"
        elif any(w in text for w in ["सोचा", "विचार", "उपाय", "योजना", "चतुर", "बुद्धि"]):
            return "thoughtful"
        elif any(w in text for w in ["दुखी", "विलाप", "रोने", "पछतावा"]):
            return "sorrowful"
        return "epic_narrative"

    def _format_prosody_ssml(self, text: str, mood: str) -> str:
        """
        Injects expressive prosody tags (SSML) with natural Hindi pauses and pitch inflection.
        Hindi dandas '।' get a 500ms acoustic pause, commas get 250ms, and dialogue gets stress.
        """
        rate = "-2%"
        pitch = "+0Hz"

        if mood == "dramatic":
            rate = "+3%"
            pitch = "+2Hz"
        elif mood == "thoughtful":
            rate = "-6%"
            pitch = "-1Hz"
        elif mood == "sorrowful":
            rate = "-8%"
            pitch = "-2Hz"

        # Transform Hindi punctuation into SSML pauses
        formatted = text.replace("।", " <break time='500ms'/> ")
        formatted = formatted.replace("॥", " <break time='800ms'/> ")
        formatted = formatted.replace(",", " <break time='250ms'/> ")
        formatted = formatted.replace("—", " <break time='350ms'/> ")

        ssml = (
            f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='hi-IN'>\n"
            f"  <prosody rate='{rate}' pitch='{pitch}'>\n"
            f"    {formatted}\n"
            f"  </prosody>\n"
            f"</speak>"
        )
        return ssml

    def _derive_visual_action(self, text: str, scene_idx: int, total_scenes: int) -> str:
        """Extracts dynamic visual action for image generation based on scene text."""
        if scene_idx == 1:
            return "Introduction of the master protagonist in their magnificent traditional Indian environment"
        elif scene_idx == total_scenes:
            return "Final resolution, triumphant moral revelation with uplifting cinematic light"
        else:
            if "सोचा" in text or "विचार" in text:
                return "The protagonist deeply contemplating an ingenious plan in the forest"
            elif "सामने" in text or "मिला" in text or "कहा" in text:
                return "Intense dialogue encounter between the characters in a scenic Indian setting"
            elif "भागा" in text or "दौड़" in text or "छलांग" in text:
                return "High action, rapid movement and dramatic tension unfolding"
            return "Dramatic key storytelling moment with expressive character interaction"

    def _build_consistent_scene_prompt(
        self,
        scene_num: int,
        action: str,
        master_char: MasterCharacterProfile,
        style_suffix: str
    ) -> str:
        """
        Constructs the image generation prompt with strict Character Consistency bindings:
        locks facial features, clothing, and palette across all scenes.
        """
        prompt = (
            f"Scene {scene_num}: {action}. "
            f"Featuring {master_char.name_en}, strictly identical to master reference: "
            f"{master_char.visual_anchor_prompt}, maintaining exact {master_char.color_palette} color harmony. "
            f"Art Style: {style_suffix}"
        )
        return prompt
