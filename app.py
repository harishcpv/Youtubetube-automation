"""
Autonomous Hindi Media Studio - Web Dashboard
Interactive Streamlit UI for the 100% Free Multi-Agent Video Pipeline.
"""

import os
import sys
import json
import time
from datetime import datetime
import streamlit as st

# Configure Page
st.set_page_config(
    page_title="Autonomous Hindi Media Studio",
    page_icon="🕉️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Add local path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from hindi_video_pipeline.utils import configure_utf8_streams, safe_print
configure_utf8_streams()

from hindi_video_pipeline.config import (
    PipelineConfig,
    STYLE_PRESETS,
    VOICE_PRESETS,
    VIDEO_PROFILES
)
from hindi_video_pipeline.orchestrator import AutonomousPipelineOrchestrator

# Custom CSS for Indian Mythological Aesthetic
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Yatra+One&display=swap');
    
    .main-title {
        font-family: 'Cinzel', serif;
        font-size: 2.4rem;
        font-weight: 800;
        background: linear-gradient(135deg, #FF9933, #FFD700, #FF3300);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #d1d5db;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: rgba(30, 20, 15, 0.7);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
    }
    .agent-pill {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 2px;
        background: rgba(255, 153, 51, 0.15);
        border: 1px solid #FF9933;
        color: #FFB366;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<h1 class="main-title">🕉️ Autonomous Hindi Media Studio</h1>', unsafe_allow_html=True)
st.markdown(
    '<p class="sub-title">100% Free Autonomous Multi-Agent Pipeline for Mythological & Panchatantra YouTube Video Creation</p>',
    unsafe_allow_html=True
)

# Sidebar Configuration
st.sidebar.header("⚙️ Pipeline Configuration")

story_type = st.sidebar.selectbox(
    "Story Archetype",
    options=["panchatantra", "mythology"],
    format_func=lambda x: "📖 Panchatantra Moral Fable" if x == "panchatantra" else "🏹 Indian Mythological Epic"
)

style_key = st.sidebar.selectbox(
    "Visual Concept Style",
    options=list(STYLE_PRESETS.keys()),
    index=0,
    format_func=lambda k: f"{STYLE_PRESETS[k]['name']}"
)

voice_key = st.sidebar.selectbox(
    "Narration Voice",
    options=list(VOICE_PRESETS.keys()),
    index=0,
    format_func=lambda k: f"🎙️ {VOICE_PRESETS[k]['id']} ({VOICE_PRESETS[k]['gender']})"
)

whisper_model = st.sidebar.selectbox(
    "Whisper Alignment Model",
    options=["tiny", "base", "small"],
    index=1,
    help="Size of OpenAI Whisper model used for Devanagari speech-to-text"
)

seed_input = st.sidebar.number_input(
    "Locked Master Visual Seed",
    min_value=1000,
    max_value=999999,
    value=42891,
    help="Locked seed ensures identical character faces and costume across all scenes"
)

bgm_ducking = st.sidebar.slider(
    "Tanpura Drone Ducking (dB)",
    min_value=-35.0,
    max_value=-10.0,
    value=-20.0,
    step=1.0,
    help="Background music attenuation under voiceover"
)

st.sidebar.markdown("---")
st.sidebar.markdown("""
**Active Agents:**
- 🔍 `ScriptAnalystAgent`
- 🔒 `VisualAssetAgent`
- 🎙️ `VoiceAudioAgent`
- 📝 `SubtitleAgent`
- 🎬 `VideoEditorAgent`
""")

# Sample Scripts
SAMPLE_PANCHATANTRA = """एक घने और विशाल जंगल में एक शक्तिशाली सिंह रहता था। उसका नाम भासुरक था। 
वह जंगल का राजा था और अपनी शक्ति के मद में प्रतिदिन अनेक निर्दोष पशुओं का अकारण वध कर देता था। 
जंगल के सभी पशु भयभीत होकर एक दिन सिंह के पास पहुंचे। उन्होंने हाथ जोड़कर प्रार्थना की, 'हे वनराज! आप प्रतिदिन व्यर्थ में अनेक जीवों को न मारें। हम स्वयं प्रतिदिन आपके भोजन के लिए एक पशु भेजेंगे।' 
सिंह ने यह प्रस्ताव स्वीकार कर लिया। कुछ दिनों बाद एक चतुर खरगोश की बारी आई। 
खरगोश ने अपनी बुद्धि का प्रयोग किया और वह बहुत देर से सिंह के पास पहुंचा। 
भूख से व्याकुल सिंह ने क्रोधित होकर पूछा, 'तू इतनी देर से क्यों आया?' 
खरगोश ने विनम्रता से कहा, 'महाराज! मार्ग में मुझे एक दूसरा बलशाली सिंह मिल गया था। उसने कहा कि वह इस जंगल का असली राजा है।' 
क्रोधित भासुरक ने कहा, 'मुझे अभी उस धूर्त के पास ले चल!' 
चतुर खरगोश सिंह को एक गहरे कुएं के पास ले गया। खरगोश ने कहा, 'महाराज! वह इसी दुर्ग में छिपा बैठा है।' 
सिंह ने कुएं के शांत जल में झांका। उसे अपनी ही छाया दिखाई दी। उसने उसे अपना शत्रु समझा और जोर से दहाड़ा। 
कुएं से प्रतिध्वनि गूंजी। सिंह ने बिना सोचे-समझे कुएं में छलांग लगा दी और जल में डूबकर मर गया। 
इस प्रकार चतुर खरगोश ने अपनी बुद्धि के बल से पूरे जंगल को क्रूर सिंह के भय से मुक्त करा दिया।"""

SAMPLE_MYTHOLOGY = """महाभारत काल की एक अत्यंत प्रेरक कथा है। 
गुरु द्रोणाचार्य ने अपने सभी शिष्यों—कौरवों और पांडवों की धनुर्विद्या की परीक्षा लेने का निश्चय किया। 
उन्होंने एक विशाल वृक्ष की ऊंची शाखा पर लकड़ी की एक कृत्रिम चिड़िया रख दी और सभी राजकुमारों को धनुष-बाण लेकर एकत्रित किया। 
गुरु द्रोण ने सर्वप्रथम ज्येष्ठ पांडव युधिष्ठिर को बुलाया और पूछा, 'वत्स युधिष्ठिर! तुम्हें सामने क्या दिखाई दे रहा है?' 
युधिष्ठिर ने उत्तर दिया, 'गुरुदेव! मुझे वृक्ष, पत्ते, आकाश, और चिड़िया सब दिखाई दे रहे हैं।' द्रोणाचार्य ने उन्हें बाण चलाने से रोक दिया। 
इसके बाद दुर्योधन और अन्य राजकुमारों से भी वही प्रश्न पूछा गया। सभी ने वृक्ष और वातावरण का वर्णन किया। 
अंत में गुरु द्रोणाचार्य ने अपने प्रिय शिष्य धनुर्धर अर्जुन को आगे बुलाया। अर्जुन ने प्रत्यंचा खींची और लक्ष्य साधा। 
द्रोणाचार्य ने पूछा, 'पार्थ! तुम्हें इस समय क्या दिखाई दे रहा है?' 
अर्जुन ने शांत और एकाग्र स्वर में कहा, 'गुरुदेव! मुझे न तो वृक्ष दिखाई दे रहा है, न ही पत्ते। मुझे केवल उस चिड़िया की पुतली यानी उसकी आंख दिखाई दे रही है।' 
गुरु द्रोणाचार्य अत्यंत प्रसन्न हुए और बोले, 'बाण चलाओ पार्थ!' 
अर्जुन ने बाण छोड़ा और वह सीधा चिड़िया की आंख को भेद गया। 
यह कथा सिखाती है कि जीवन में सफलता पाने के लिए अर्जुन जैसी एकाग्रता और अटूट लक्ष्य-साधना ही सर्वोत्तम मार्ग है।"""

# Script Input Area
col_template, col_spacer = st.columns([2, 3])
with col_template:
    sample_choice = st.selectbox(
        "Load Preset Hindi Story Script",
        ["None (Custom Script)", "Panchatantra: सिंह और चतुर खरगोश", "Mythology: अर्जुन का एकाग्र लक्ष्य"]
    )

if sample_choice == "Panchatantra: सिंह और चतुर खरगोश":
    default_text = SAMPLE_PANCHATANTRA
elif sample_choice == "Mythology: अर्जुन का एकाग्र लक्ष्य":
    default_text = SAMPLE_MYTHOLOGY
else:
    default_text = ""

script_input = st.text_area(
    "Raw Hindi Story Script (Devanagari)",
    value=default_text,
    height=220,
    placeholder="यहाँ अपनी हिंदी पौराणिक या पंचतंत्र की कहानी का आलेख दर्ज करें..."
)

# Launch Execution Button
launch_btn = st.button("🚀 Launch Autonomous Video Pipeline", type="primary", use_container_width=True)

if launch_btn:
    if not script_input.strip():
        st.error("⚠️ Please enter a Hindi story script or select a sample story above.")
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_output_dir = os.path.join(CURRENT_DIR, "outputs", f"studio_run_{timestamp}")

        config = PipelineConfig(
            story_type=story_type,
            style_key=style_key,
            voice_key=voice_key,
            whisper_model=whisper_model,
            output_dir=run_output_dir,
            seed=seed_input,
            bgm_volume_db=bgm_ducking
        )

        progress_container = st.container()
        with progress_container:
            st.markdown("### 🔄 Autonomous Pipeline in Progress...")
            prog_bar = st.progress(0.0)
            status_text = st.empty()

            try:
                status_text.info("🔍 [1/6] Analyzing Hindi Script & Locking Protagonist Profile...")
                prog_bar.progress(0.15)

                orchestrator = AutonomousPipelineOrchestrator(config)
                
                status_text.info("🔒 [2/6] Generating Master Character Reference Image...")
                prog_bar.progress(0.30)

                # Execute pipeline
                result = orchestrator.run(script_input)

                prog_bar.progress(1.0)
                status_text.success("🎉 Pipeline Completed Successfully!")
                st.session_state["latest_result"] = result
                st.session_state["latest_output_dir"] = run_output_dir
            except Exception as e:
                st.error(f"❌ Pipeline Execution Error: {e}")

# Check for existing results to display
result_to_show = st.session_state.get("latest_result")
latest_dir = st.session_state.get("latest_output_dir")

# If no active run in session, load the latest production run if available
if not result_to_show:
    default_prod_dir = os.path.join(CURRENT_DIR, "outputs", "panchatantra_production")
    state_file = os.path.join(default_prod_dir, "pipeline_state.json")
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                result_to_show = json.load(f)
                latest_dir = default_prod_dir
        except:
            pass

if result_to_show and "outputs" in result_to_show:
    st.markdown("---")
    st.markdown("## 🎬 Production Video Renders & Assets")

    outputs = result_to_show["outputs"]
    master_char = result_to_show.get("master_character", {})

    # Top metrics
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Protagonist", master_char.get("name_hi", "नायक"))
    with m2:
        st.metric("Total Scenes", result_to_show.get("scene_count", len(result_to_show.get("scenes", []))))
    with m3:
        st.metric("Video Duration", f"{result_to_show.get('total_duration', 0):.1f}s")
    with m4:
        st.metric("Locked Seed", master_char.get("locked_seed", "Locked"))

    st.markdown("<br>", unsafe_allow_html=True)

    # Master Character Spotlight Card
    st.markdown("### 🔒 Master Character Reference Sheet")
    col_img, col_desc = st.columns([1, 2])
    with col_img:
        ref_img_path = outputs.get("master_reference_image")
        if ref_img_path and os.path.exists(ref_img_path):
            st.image(ref_img_path, caption=f"Locked Character Reference: {master_char.get('name_en')}", use_container_width=True)
    with col_desc:
        st.markdown(f"**Archetype:** {master_char.get('archetype', 'N/A')}")
        st.markdown(f"**Facial Features:** {master_char.get('facial_features', 'N/A')}")
        st.markdown(f"**Clothing & Ornaments:** {master_char.get('clothing_and_ornaments', 'N/A')}")
        st.markdown(f"**Palette:** {master_char.get('color_palette', 'N/A')}")
        st.caption(f"**Permanent Visual Prompt Anchor:** {master_char.get('visual_anchor_prompt', 'N/A')}")

    st.markdown("---")

    # Video Player Tabs
    tab_long, tab_shorts, tab_audio, tab_subs, tab_frames = st.tabs([
        "📺 YouTube Long-Form (16:9)",
        "📱 YouTube Shorts (9:16)",
        "🎵 Master Audio Mix",
        "📝 Subtitles (.SRT)",
        "🖼️ Scene Frames"
    ])

    with tab_long:
        long_path = outputs.get("longform_16x9")
        if long_path and os.path.exists(long_path):
            st.video(long_path)
            with open(long_path, "rb") as f:
                st.download_button(
                    "⬇️ Download Long-Form Video (1920x1080 MP4)",
                    data=f.read(),
                    file_name="youtube_longform_16x9.mp4",
                    mime="video/mp4",
                    use_container_width=True
                )
        else:
            st.info("Long-form video not found.")

    with tab_shorts:
        shorts_path = outputs.get("shorts_9x16")
        if shorts_path and os.path.exists(shorts_path):
            col_v_left, col_v_mid, col_v_right = st.columns([1, 2, 1])
            with col_v_mid:
                st.video(shorts_path)
                with open(shorts_path, "rb") as f:
                    st.download_button(
                        "⬇️ Download Shorts / Reels Video (1080x1920 MP4)",
                        data=f.read(),
                        file_name="youtube_shorts_9x16.mp4",
                        mime="video/mp4",
                        use_container_width=True
                    )
        else:
            st.info("Shorts video not found.")

    with tab_audio:
        audio_path = outputs.get("master_audio")
        if audio_path and os.path.exists(audio_path):
            st.markdown("#### Master Mixed Narration (Neural Hindi + Ducked Indian Tanpura Drone)")
            st.audio(audio_path)
            with open(audio_path, "rb") as f:
                st.download_button(
                    "⬇️ Download Master Audio (MP3)",
                    data=f.read(),
                    file_name="master_audio_mix.mp3",
                    mime="audio/mpeg"
                )

    with tab_subs:
        srt_path = outputs.get("subtitles_srt")
        if srt_path and os.path.exists(srt_path):
            with open(srt_path, "r", encoding="utf-8") as f:
                srt_content = f.read()
            st.text_area("Time-Synced Devanagari Hindi Subtitles", value=srt_content, height=300)
            st.download_button(
                "⬇️ Download Subtitles (.SRT)",
                data=srt_content.encode("utf-8"),
                file_name="subtitles_master.srt",
                mime="text/plain"
            )

    with tab_frames:
        scenes = result_to_show.get("scenes", [])
        if scenes:
            cols = st.columns(min(3, len(scenes)))
            for idx, sc in enumerate(scenes):
                c = cols[idx % len(cols)]
                with c:
                    img_p = sc.get("image_path")
                    if img_p and os.path.exists(img_p):
                        st.image(img_p, caption=f"Scene {sc.get('scene_id')}: {sc.get('hindi_narration')[:40]}...", use_container_width=True)
                    st.caption(f"⏱️ Duration: {sc.get('duration', 0):.1f}s | Motion: {sc.get('camera_motion')}")
