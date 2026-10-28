import json
import os
import sys

try:
    from faster_whisper import WhisperModel
except Exception as exc:
    print(json.dumps({"error": f"faster-whisper unavailable: {exc}"}, ensure_ascii=False))
    sys.exit(2)

if len(sys.argv) < 2:
    print(json.dumps({"error": "audio path is required"}, ensure_ascii=False))
    sys.exit(3)

audio_path = sys.argv[1]
language = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
model_name = os.environ.get("SAYFIELD_WHISPER_MODEL", "small")
cache_dir = os.environ.get(
    "SAYFIELD_WHISPER_CACHE",
    os.path.join(os.path.expanduser("~"), ".cache", "sayfield-whisper"),
)

try:
    model = WhisperModel(model_name, device="cpu", compute_type="int8", download_root=cache_dir)
    segments, info = model.transcribe(
        audio_path,
        language=language,
        beam_size=5,
        vad_filter=True,
        condition_on_previous_text=False,
        temperature=0,
    )
    text = "".join(segment.text for segment in segments).strip()
    print(json.dumps({
        "text": text,
        "language": info.language,
        "duration": info.duration,
    }, ensure_ascii=False))
except Exception as exc:
    print(json.dumps({"error": str(exc)}, ensure_ascii=False))
    sys.exit(4)
