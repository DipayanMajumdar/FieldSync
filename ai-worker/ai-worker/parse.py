CONSTRUCTION_MAP = {
    "person": ("Site Worker", "HSE / Labor Verification"),
    "truck": ("Material Hauler", "Heavy Logistics"),
    "car": ("Inspection Vehicle", "Logistics"),
    "fire hydrant": ("Emergency Safety Point", "HSE Asset"),
    "backpack": ("Field Diagnostic Toolbag", "Equipment"),
    "bottle": ("Hydration Resource", "HSE Welfare")
}

def parse_yolo_results(results):
    detected = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            name = r.names[cls_id]
            conf = round(float(box.conf[0]) * 100, 1)

            mapped_term, discipline = CONSTRUCTION_MAP.get(name, (name.title(), "General Worksite"))
            detected.append({
                "raw_label": name,
                "label": mapped_term,
                "category": discipline,
                "confidence": conf
            })
    return detected

def parse_whisper_transcript(text):
    clean = text.strip()
    return clean if clean else "No clear speech detected."