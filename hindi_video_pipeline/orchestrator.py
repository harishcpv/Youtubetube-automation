"""
Autonomous Hindi Media Pipeline Orchestrator
Coordinates multi-agent execution, state tracking, and publication rendering.
"""

import os
import json
import time
from typing import Dict, Any, Optional
from .config import PipelineConfig, STYLE_PRESETS, VOICE_PRESETS
from .utils import safe_print
from .agents.script_agent import ScriptAnalystAgent
from .agents.visual_agent import VisualAssetAgent
from .agents.audio_agent import VoiceAudioAgent
from .agents.subtitle_agent import SubtitleAgent
from .agents.video_agent import VideoEditorAgent

class AutonomousPipelineOrchestrator:
    """
    Master Autonomous Agent Orchestrator managing:
    - Multi-agent communication and data contracts
    - JSON state checkpointing and recovery
    - End-to-end zero-intervention video generation
    """

    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        os.makedirs(self.config.output_dir, exist_ok=True)
        self.state_file = os.path.join(self.config.output_dir, "pipeline_state.json")
        self.state: Dict[str, Any] = {
            "status": "initialized",
            "start_time": time.time(),
            "config": self.config.__dict__,
            "scenes": [],
            "outputs": {}
        }

    def run(self, raw_script: str) -> Dict[str, Any]:
        """
        Executes the full autonomous pipeline on the raw Hindi story script.
        Returns paths and metrics for both rendered video formats.
        """
        safe_print("=" * 80)
        safe_print("  🚀 AUTONOMOUS HINDI MEDIA PIPELINE (100% Free Multi-Agent Engine)")
        safe_print("=" * 80)
        safe_print(f"[*] Story Type:    {self.config.story_type.upper()}")
        safe_print(f"[*] Visual Style:  {self.config.style_key}")
        safe_print(f"[*] Voice Preset:  {self.config.voice_key}")
        safe_print(f"[*] Whisper Model: {self.config.whisper_model}")
        safe_print(f"[*] Output Dir:    {os.path.abspath(self.config.output_dir)}")
        safe_print("=" * 80)

        style_cfg = STYLE_PRESETS.get(self.config.style_key, STYLE_PRESETS["panchatantra-3d"])
        voice_cfg = VOICE_PRESETS.get(self.config.voice_key, VOICE_PRESETS["male"])

        # ---------------------------------------------------------------------
        # 1. Script Analysis & Master Character Definition
        # ---------------------------------------------------------------------
        safe_print("\n>>> [STAGE 1/6] Script Analysis & Scene Chunking...")
        script_agent = ScriptAnalystAgent(
            story_type=self.config.story_type,
            default_seed=self.config.seed
        )
        analysis = script_agent.analyze_script(raw_script, style_suffix=style_cfg["prompt_suffix"])
        master_char = analysis["master_character"]
        raw_scenes = analysis["scenes"]

        self.state["master_character"] = master_char
        self.state["scene_count"] = len(raw_scenes)
        self._save_state("script_analyzed")

        # ---------------------------------------------------------------------
        # 2. Master Character Reference Image Locking
        # ---------------------------------------------------------------------
        safe_print("\n>>> [STAGE 2/6] Master Character Reference Generation & Locking...")
        visual_agent = VisualAssetAgent(
            output_dir=self.config.output_dir,
            default_seed=master_char["locked_seed"]
        )
        master_ref_img = visual_agent.generate_master_reference_image(
            master_char=master_char,
            style_suffix=style_cfg["prompt_suffix"]
        )
        self.state["master_reference_image"] = master_ref_img

        # ---------------------------------------------------------------------
        # 3. Audio Narration & Ambient Soundscape Engineering
        # ---------------------------------------------------------------------
        safe_print("\n>>> [STAGE 3/6] Expressive Hindi Speech & Ambient Drone Audio...")
        audio_agent = VoiceAudioAgent(
            voice_id=voice_cfg["id"],
            output_dir=self.config.output_dir,
            ducking_db=self.config.bgm_volume_db
        )
        # Synthesize audio for each individual scene and measure exact durations
        scenes_with_audio = audio_agent.synthesize_scenes_audio(raw_scenes)

        # Concatenate into master voice track
        audio_paths = [s["audio_path"] for s in scenes_with_audio]
        master_voice = audio_agent.concatenate_narration_tracks(audio_paths)
        total_audio_duration = audio_agent.get_media_duration(master_voice)

        # Generate ancient Indian Tanpura drone matching duration
        tanpura_drone = audio_agent.generate_ambient_tanpura_drone(total_audio_duration)

        # Mix voice + auto-ducked Tanpura drone
        final_mixed_audio = os.path.join(audio_agent.audio_dir, "master_audio_mix.mp3")
        final_mixed_audio = audio_agent.mix_narration_with_bgm(
            narration_path=master_voice,
            bgm_path=tanpura_drone,
            output_mix_path=final_mixed_audio
        )
        self.state["master_audio"] = final_mixed_audio
        self.state["total_duration"] = total_audio_duration
        self._save_state("audio_synthesized")

        # ---------------------------------------------------------------------
        # 4. Whisper Speech-to-Text & Subtitle Synchronization
        # ---------------------------------------------------------------------
        safe_print("\n>>> [STAGE 4/6] Whisper Subtitle Generation & Temporal Alignment...")
        subtitle_agent = SubtitleAgent(
            whisper_model=self.config.whisper_model,
            output_dir=self.config.output_dir
        )
        srt_path = subtitle_agent.generate_subtitles(
            audio_path=master_voice,
            scenes=scenes_with_audio,
            output_srt_filename="subtitles_master.srt"
        )
        self.state["subtitles_srt"] = srt_path
        self._save_state("subtitles_generated")

        # ---------------------------------------------------------------------
        # 5. Character-Consistent Scene Visual Asset Generation
        # ---------------------------------------------------------------------
        safe_print("\n>>> [STAGE 5/6] Generating Character-Consistent Scene Frames...")
        scene_img_paths = visual_agent.generate_all_scenes(
            scenes=scenes_with_audio,
            master_char=master_char,
            style_suffix=style_cfg["prompt_suffix"]
        )

        # Attach image paths to scene records
        for sc, img in zip(scenes_with_audio, scene_img_paths):
            sc["image_path"] = img

        self.state["scenes"] = scenes_with_audio
        self._save_state("visuals_generated")

        # ---------------------------------------------------------------------
        # 6. Video Assembly & Dual-Format Rendering Engine
        # ---------------------------------------------------------------------
        safe_print("\n>>> [STAGE 6/6] Video Assembly & Dual-Format Video Rendering...")
        video_agent = VideoEditorAgent(
            output_dir=self.config.output_dir,
            fps=self.config.fps
        )

        # 6a. Render Ken Burns motion clips
        clip_paths = video_agent.assemble_scene_clips(scenes_with_audio)

        # 6b. Concatenate video clips
        raw_master_video = video_agent.concatenate_clips(clip_paths)

        # 6c. Render Long-Form 16:9
        longform_output = video_agent.render_longform_16x9(
            raw_video_path=raw_master_video,
            audio_path=final_mixed_audio,
            srt_path=srt_path,
            output_filename="youtube_longform_16x9.mp4"
        )

        # 6d. Render Short-Form 9:16
        shorts_output = video_agent.render_shorts_9x16(
            raw_video_path=raw_master_video,
            audio_path=final_mixed_audio,
            srt_path=srt_path,
            output_filename="youtube_shorts_9x16.mp4"
        )

        self.state["outputs"] = {
            "longform_16x9": longform_output,
            "shorts_9x16": shorts_output,
            "master_reference_image": master_ref_img,
            "master_audio": final_mixed_audio,
            "subtitles_srt": srt_path,
        }
        self.state["end_time"] = time.time()
        self.state["elapsed_seconds"] = round(self.state["end_time"] - self.state["start_time"], 2)
        self.state["status"] = "completed"
        self._save_state("completed")

        safe_print("\n" + "=" * 80)
        safe_print("  🎉 PUBLICATION-READY VIDEO RENDERS COMPLETED SUCCESSFULLY!")
        safe_print("=" * 80)
        safe_print(f"📺 Long-Form (16:9): {os.path.abspath(longform_output)}")
        safe_print(f"📱 Short-Form (9:16): {os.path.abspath(shorts_output)}")
        safe_print(f"🔒 Master Character: {os.path.abspath(master_ref_img)}")
        safe_print(f"⏱️ Total Video Time: {total_audio_duration:.2f}s | Pipeline Runtime: {self.state['elapsed_seconds']}s")
        safe_print("=" * 80 + "\n")

        return self.state

    def _save_state(self, stage: str) -> None:
        """Persists intermediate pipeline state for inspection and checkpointing."""
        self.state["current_stage"] = stage
        try:
            with open(self.state_file, "w", encoding="utf-8") as f:
                json.dump(self.state, f, indent=2, ensure_ascii=False)
        except Exception as e:
            safe_print(f"[Orchestrator] Warning: state save failed: {e}")
