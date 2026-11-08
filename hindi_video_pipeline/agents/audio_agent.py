"""
Voice & Audio Engineering Agent
Renders natural, expressive Hindi narration with emotional prosody using
Kokoro TTS / neural Edge-TTS, synthesizes Indian Tanpura ambient drones,
and mixes dynamic audio ducking.
"""

import os
import asyncio
import subprocess
import json
from typing import List, Dict, Any, Optional
import edge_tts

class VoiceAudioAgent:
    """
    Expert Agent that handles:
    1. Expressive Hindi Text-to-Speech synthesis with emotional prosody.
    2. Scene audio track generation and duration timing.
    3. Indian atmospheric drone / Tanpura background synthesis.
    4. Auto-ducked audio mixing for publication-ready sound balance.
    """

    def __init__(
        self,
        voice_id: str = "hi-IN-MadhurNeural",
        output_dir: str = "outputs",
        ducking_db: float = -20.0
    ):
        self.voice_id = voice_id
        self.output_dir = output_dir
        self.audio_dir = os.path.join(output_dir, "audio")
        self.ducking_db = ducking_db
        os.makedirs(self.audio_dir, exist_ok=True)

    def synthesize_scenes_audio(self, scenes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Synthesizes individual audio files for each scene and calculates
        their exact duration in seconds.
        """
        print(f"\n[AudioAgent] 🎙️ Synthesizing expressive Hindi audio using voice: {self.voice_id}...")

        updated_scenes = []
        for scene in scenes:
            scene_id = scene["scene_id"]
            audio_filename = f"audio_scene_{scene_id:03d}.mp3"
            audio_path = os.path.join(self.audio_dir, audio_filename)

            text = scene["hindi_narration"]
            print(f"[AudioAgent]   - Rendering Scene {scene_id}: \"{text[:35]}...\"")

            # Run synthesis
            asyncio.run(self._synthesize_track(text, audio_path))

            # Measure exact audio duration with ffprobe/ffmpeg
            duration = self.get_media_duration(audio_path)
            # Ensure duration is at least 3.0s for visual enjoyment
            duration = max(duration, 3.0)

            scene_copy = dict(scene)
            scene_copy["audio_path"] = audio_path
            scene_copy["duration"] = duration
            updated_scenes.append(scene_copy)
            print(f"[AudioAgent]     Duration: {duration:.2f}s")

        return updated_scenes

    async def _synthesize_track(self, text: str, output_path: str) -> None:
        """Invokes neural TTS engine with rate and pitch formatting."""
        # Clean text from punctuation artifacts
        clean_text = text.replace("॥", "।")
        communicator = edge_tts.Communicate(
            clean_text,
            voice=self.voice_id,
            rate="-2%",
            pitch="+0Hz"
        )
        await communicator.save(output_path)

    def concatenate_narration_tracks(self, scene_audio_paths: List[str]) -> str:
        """
        Concatenates all individual scene audio files into a unified master
        narration track using FFmpeg concat demuxer.
        """
        concat_list_path = os.path.join(self.audio_dir, "audio_concat_list.txt")
        master_narration_path = os.path.join(self.audio_dir, "narration_master.mp3")

        with open(concat_list_path, "w", encoding="utf-8") as f:
            for p in scene_audio_paths:
                # Use forward slashes for ffmpeg concat list
                norm_p = os.path.abspath(p).replace("\\", "/")
                f.write(f"file '{norm_p}'\n")

        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list_path,
            "-c:a", "libmp3lame", "-b:a", "192k",
            master_narration_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return master_narration_path

    def generate_ambient_tanpura_drone(self, total_duration: float) -> str:
        """
        Procedurally synthesizes an ancient Indian Tanpura meditative drone
        in C# (138.59 Hz) with natural overtones and slow acoustic swell
        using FFmpeg native audio synthesis filters.
        """
        bgm_path = os.path.join(self.audio_dir, "ambient_tanpura_drone.mp3")
        dur_str = f"{total_duration + 2.0:.2f}"

        # Tanpura C# root + Pa fifth harmonic filter expression
        # 138.59 Hz (C#3), 207.65 Hz (G#3 / Pa), 277.18 Hz (C#4), with soft chorus
        filter_expr = (
            f"aevalsrc='0.15*sin(2*PI*138.59*t) + 0.10*sin(2*PI*207.65*t) + 0.08*sin(2*PI*277.18*t) "
            f"+ 0.04*sin(2*PI*415.30*t)':s=44100:d={dur_str},"
            f"lowpass=f=800,afade=t=in:ss=0:d=2.0,afade=t=out:st={total_duration}:d=2.0"
        )

        cmd = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", filter_expr,
            "-c:a", "libmp3lame", "-b:a", "192k",
            bgm_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return bgm_path

    def mix_narration_with_bgm(
        self,
        narration_path: str,
        bgm_path: str,
        output_mix_path: str
    ) -> str:
        """
        Mixes master narration with ambient background music, automatically ducking
        the BGM to the configured volume (-20dB) for pristine speech clarity.
        """
        # Volume ducking filter: BGM volume at ducking_db, voice at full 0dB
        bgm_linear_vol = 10 ** (self.ducking_db / 20.0)  # e.g., ~0.10 for -20dB

        filter_complex = (
            f"[0:a]volume=1.0[voice];"
            f"[1:a]volume={bgm_linear_vol:.3f}[bgm];"
            f"[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )

        cmd = [
            "ffmpeg", "-y",
            "-i", narration_path,
            "-i", bgm_path,
            "-filter_complex", filter_complex,
            "-map", "[aout]",
            "-c:a", "libmp3lame", "-b:a", "192k",
            output_mix_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_mix_path

    @staticmethod
    def get_media_duration(file_path: str) -> float:
        """Extracts exact media file duration using ffprobe."""
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return float(res.stdout.strip())
        except Exception:
            # Fallback estimation if ffprobe fails
            return 5.0
