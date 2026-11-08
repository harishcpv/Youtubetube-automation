#!/usr/bin/env python3
"""
Autonomous Media Pipeline: End-to-End Multi-Agent Hindi Video Automation System
Converts raw Hindi mythological / Panchatantra scripts into finished,
publication-ready YouTube Long-Form (16:9) and Shorts (9:16) videos with zero manual intervention.

Usage:
    python pipeline.py --script sample_panchatantra.txt --story-type panchatantra --voice male
    python pipeline.py --script sample_mythology.txt --story-type mythology --voice female --style mythological-art
    python pipeline.py --demo
"""

import os
import sys
import argparse
import subprocess
import time
from datetime import datetime

# Add local package root to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from hindi_video_pipeline.config import (
    PipelineConfig,
    STYLE_PRESETS,
    VOICE_PRESETS,
    VIDEO_PROFILES
)
from hindi_video_pipeline.utils import configure_utf8_streams, safe_print
configure_utf8_streams()
from hindi_video_pipeline.orchestrator import AutonomousPipelineOrchestrator

def check_system_dependencies():
    """Validates that necessary runtime binaries (FFmpeg) are accessible."""
    try:
        res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        if res.returncode != 0:
            safe_print("[ERROR] FFmpeg is installed but returned an error.")
            sys.exit(1)
    except FileNotFoundError:
        safe_print("[FATAL ERROR] FFmpeg binary was not found in PATH.")
        safe_print("Please install FFmpeg and ensure 'ffmpeg' and 'ffprobe' are available.")
        sys.exit(1)

def parse_args():
    parser = argparse.ArgumentParser(
        description="Autonomous Multi-Agent Pipeline for Native Hindi Mythological & Panchatantra YouTube Videos.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    parser.add_argument(
        "--script", "-s",
        type=str,
        default=None,
        help="Path to the text file containing the raw Hindi script, or a raw Hindi string."
    )
    parser.add_argument(
        "--story-type", "-t",
        choices=["panchatantra", "mythology"],
        default="panchatantra",
        help="Narrative archetype genre (affects visual stylization and character extraction)."
    )
    parser.add_argument(
        "--style",
        choices=list(STYLE_PRESETS.keys()),
        default="panchatantra-3d",
        help="Visual concept art style preset."
    )
    parser.add_argument(
        "--voice",
        choices=list(VOICE_PRESETS.keys()),
        default="male",
        help="Neural Hindi narration voice preset (male: MadhurNeural, female: SwaraNeural)."
    )
    parser.add_argument(
        "--whisper-model",
        choices=["tiny", "base", "small", "medium"],
        default="base",
        help="OpenAI Whisper model size for Hindi subtitle alignment."
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default=None,
        help="Directory to store intermediate assets and rendered videos."
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Locked visual seed for character consistency across scenes."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run an automated demonstration with built-in Panchatantra story."
    )

    return parser.parse_args()

def main():
    check_system_dependencies()
    args = parse_args()

    # Determine Script Source
    script_content = ""
    if args.demo:
        demo_path = os.path.join(CURRENT_DIR, "sample_panchatantra.txt")
        if os.path.exists(demo_path):
            with open(demo_path, "r", encoding="utf-8") as f:
                script_content = f.read()
            safe_print(f"[*] Running in --demo mode using: {demo_path}")
        else:
            script_content = (
                "एक वन में भासुरक नाम का एक घमंडी शेर रहता था। वह प्रतिदिन कई पशुओं को मार डालता था। "
                "पशुओं ने निर्णय लिया कि प्रतिदिन एक पशु स्वयं शेर के पास जाएगा। "
                "एक दिन एक चतुर खरगोश की बारी आई। उसने अपनी बुद्धि से शेर को एक कुएं के पास ले जाकर उसकी छाया दिखाई। "
                "शेर ने कुएं में छलांग लगा दी और मारा गया। इस प्रकार बुद्धि बल से श्रेष्ठ सिद्ध हुई।"
            )
    elif args.script:
        if os.path.exists(args.script):
            with open(args.script, "r", encoding="utf-8") as f:
                script_content = f.read()
        else:
            # Interpret argument as direct inline Hindi script
            script_content = args.script
    else:
        # Check for default sample file
        default_sample = os.path.join(CURRENT_DIR, "sample_panchatantra.txt")
        if os.path.exists(default_sample):
            with open(default_sample, "r", encoding="utf-8") as f:
                script_content = f.read()
            safe_print(f"[*] No script specified; defaulting to sample: {default_sample}")
        else:
            safe_print("[ERROR] Please provide a story script via --script <path> or run with --demo.")
            sys.exit(1)

    if not script_content.strip():
        safe_print("[ERROR] Script content is empty.")
        sys.exit(1)

    # Establish Timestamped Output Directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = args.output_dir or os.path.join(CURRENT_DIR, "outputs", f"run_{timestamp}")

    # Build Configuration
    config = PipelineConfig(
        story_type=args.story_type,
        style_key=args.style,
        voice_key=args.voice,
        whisper_model=args.whisper_model,
        output_dir=output_dir,
        seed=args.seed or 42891
    )

    # Launch Orchestration
    orchestrator = AutonomousPipelineOrchestrator(config)
    result = orchestrator.run(script_content)

    safe_print("\n✅ Autonomous Execution Summary:")
    safe_print(f"  - Output Directory:    {os.path.abspath(output_dir)}")
    safe_print(f"  - Long-Form Render:    {os.path.abspath(result['outputs']['longform_16x9'])}")
    safe_print(f"  - Short-Form Render:   {os.path.abspath(result['outputs']['shorts_9x16'])}")
    safe_print(f"  - Master Reference:    {os.path.abspath(result['outputs']['master_reference_image'])}")
    safe_print(f"  - Subtitle Track:      {os.path.abspath(result['outputs']['subtitles_srt'])}")
    safe_print(f"  - Master Audio Track:  {os.path.abspath(result['outputs']['master_audio'])}")
    safe_print(f"  - Total Execution Time: {result['elapsed_seconds']}s")

if __name__ == "__main__":
    main()
