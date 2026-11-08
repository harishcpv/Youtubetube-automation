"""
Autonomous Hindi Media Pipeline - Cross-Platform Utilities & Safe I/O
Ensures Unicode / Devanagari / Emoji stability on Windows cmd, PowerShell, and Streamlit.
"""

import sys

def configure_utf8_streams():
    """Forces stdout and stderr to handle UTF-8 and safely replace unencodable characters."""
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    try:
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Call immediately upon import
configure_utf8_streams()

def safe_print(*args, **kwargs):
    """
    Universal print wrapper that prevents 'charmap' / cp1252 UnicodeEncodeError
    when printing emojis (🚀, 🎬, 🎙️) or Devanagari characters on Windows.
    """
    try:
        print(*args, **kwargs)
    except (UnicodeEncodeError, UnicodeError):
        encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
        clean_args = []
        for a in args:
            if isinstance(a, str):
                try:
                    clean_args.append(a.encode(encoding, errors="replace").decode(encoding))
                except Exception:
                    clean_args.append(a.encode("ascii", errors="replace").decode("ascii"))
            else:
                clean_args.append(a)
        try:
            print(*clean_args, **kwargs)
        except Exception:
            # Utmost fallback: pure ASCII
            ascii_args = [str(a).encode("ascii", errors="replace").decode("ascii") for a in args]
            print(*ascii_args, **kwargs)
