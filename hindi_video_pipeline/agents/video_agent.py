"""
Video Assembly & Dual-Format Render Agent
Assembles visual clips with dynamic Ken Burns motion, mixes synchronized audio,
and renders both Long-Form (16:9) and Short-Form (9:16) videos with burned-in Devanagari subtitles.
"""

import os
import subprocess
from typing import List, Dict, Any
from ..config import VIDEO_PROFILES

class VideoEditorAgent:
    """
    Expert Agent that handles:
    1. Scene motion clip synthesis (Ken Burns pan & zoom matching audio durations).
    2. Video clip sequence concatenation.
    3. Dual-Format rendering:
       - Long-Form 16:9 (1920x1080) for YouTube main channel.
       - Short-Form 9:16 (1080x1920) for YouTube Shorts & Reels.
    4. Hardware-accelerated / robust FFmpeg subtitle burn-in with Devanagari typography.
    """

    def __init__(self, output_dir: str = "outputs", fps: int = 30):
        self.output_dir = output_dir
        self.fps = fps
        self.clips_dir = os.path.join(output_dir, "clips")
        os.makedirs(self.clips_dir, exist_ok=True)

    def assemble_scene_clips(self, scenes: List[Dict[str, Any]]) -> List[str]:
        """
        Converts each scene's static image into a dynamic video clip with
        cinematic Ken Burns camera motion matching the exact narration duration.
        """
        clip_paths = []
        print(f"\n[VideoAgent] 🎬 Synthesizing {len(scenes)} cinematic Ken Burns scene clips...")

        for scene in scenes:
            scene_id = scene["scene_id"]
            img_path = scene.get("image_path")
            duration = scene.get("duration", 5.0)
            motion = scene.get("camera_motion", "zoom_in")

            clip_filename = f"clip_{scene_id:03d}.mp4"
            clip_path = os.path.join(self.clips_dir, clip_filename)

            self._render_ken_burns_clip(
                image_path=img_path,
                output_clip_path=clip_path,
                duration=duration,
                motion_type=motion
            )
            clip_paths.append(clip_path)

        return clip_paths

    def _render_ken_burns_clip(
        self,
        image_path: str,
        output_clip_path: str,
        duration: float,
        motion_type: str = "zoom_in"
    ) -> None:
        """
        Applies smooth zoom and pan over the image for the specified duration.
        Generates standard 1920x1080 30fps H.264 clip.
        """
        total_frames = int(round(duration * self.fps))
        norm_img_path = os.path.abspath(image_path).replace("\\", "/")

        # Ken Burns zoom expressions
        if motion_type == "zoom_in":
            zoom_expr = f"min(zoom+0.0015,1.25)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif motion_type == "zoom_out":
            zoom_expr = f"if(lte(zoom,1.0),1.25,max(1.001,zoom-0.0015))"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif motion_type == "pan_right":
            zoom_expr = "1.15"
            x_expr = f"(on/{total_frames})*(iw-iw/zoom)"
            y_expr = "ih/2-(ih/zoom/2)"
        else:  # pan_left
            zoom_expr = "1.15"
            x_expr = f"(1-(on/{total_frames}))*(iw-iw/zoom)"
            y_expr = "ih/2-(ih/zoom/2)"

        filter_chain = (
            f"scale=1920:1080:force_original_aspect_ratio=increase,"
            f"crop=1920:1080,"
            f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}':"
            f"d={total_frames}:s=1920x1080:fps={self.fps},"
            f"format=yuv420p"
        )

        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", norm_img_path,
            "-vf", filter_chain,
            "-t", f"{duration:.3f}",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            output_clip_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def concatenate_clips(self, clip_paths: List[str]) -> str:
        """Concatenates all individual scene video clips into a single video track."""
        concat_list = os.path.join(self.clips_dir, "video_concat_list.txt")
        raw_master_path = os.path.join(self.clips_dir, "raw_master_visuals.mp4")

        with open(concat_list, "w", encoding="utf-8") as f:
            for p in clip_paths:
                norm_p = os.path.abspath(p).replace("\\", "/")
                f.write(f"file '{norm_p}'\n")

        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list,
            "-c", "copy",
            raw_master_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return raw_master_path

    def render_longform_16x9(
        self,
        raw_video_path: str,
        audio_path: str,
        srt_path: str,
        output_filename: str = "youtube_longform_16x9.mp4"
    ) -> str:
        """
        Renders the final Long-Form (16:9) video with audio mixing and burned-in subtitles.
        Optimized for YouTube main channel (1920x1080).
        """
        final_output = os.path.join(self.output_dir, output_filename)
        print(f"\n[VideoAgent] 📺 Rendering Long-Form Video (16:9 - 1920x1080)...")

        profile = VIDEO_PROFILES["longform"]
        escaped_srt = os.path.abspath(srt_path).replace("\\", "/").replace(":", "\\:")
        sub_filter = f"subtitles='{escaped_srt}':force_style='{profile['sub_style']}'"

        cmd = [
            "ffmpeg", "-y",
            "-i", raw_video_path,
            "-i", audio_path,
            "-vf", sub_filter,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-b:v", profile["video_bitrate"],
            "-c:a", "aac",
            "-b:a", profile["audio_bitrate"],
            "-shortest",
            "-pix_fmt", "yuv420p",
            final_output
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[VideoAgent] ✅ Long-Form Video rendered: {final_output}")
        return final_output

    def render_shorts_9x16(
        self,
        raw_video_path: str,
        audio_path: str,
        srt_path: str,
        output_filename: str = "youtube_shorts_9x16.mp4"
    ) -> str:
        """
        Renders the final Short-Form (9:16) vertical video optimized for
        YouTube Shorts and Instagram Reels (1080x1920).
        Automatically reframes the 16:9 footage with smart center crop & dynamic vertical subtitles.
        """
        final_output = os.path.join(self.output_dir, output_filename)
        print(f"\n[VideoAgent] 📱 Rendering Short-Form Video (9:16 - 1080x1920)...")

        profile = VIDEO_PROFILES["shorts"]
        escaped_srt = os.path.abspath(srt_path).replace("\\", "/").replace(":", "\\:")

        # Vertical reframing: scale to cover 1080x1920 and center crop, then burn vertical subtitles
        vf_chain = (
            f"scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920:(iw-1080)/2:(ih-1920)/2,"
            f"subtitles='{escaped_srt}':force_style='{profile['sub_style']}'"
        )

        cmd = [
            "ffmpeg", "-y",
            "-i", raw_video_path,
            "-i", audio_path,
            "-vf", vf_chain,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "19",
            "-b:v", profile["video_bitrate"],
            "-c:a", "aac",
            "-b:a", profile["audio_bitrate"],
            "-shortest",
            "-pix_fmt", "yuv420p",
            final_output
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[VideoAgent] ✅ Short-Form Video rendered: {final_output}")
        return final_output
