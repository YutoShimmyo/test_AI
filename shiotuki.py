def generate_image_prompt(input_text: str) -> str:
    if all('ぁ' <= ch <= 'ん' for ch in input_text):
        script_type = "ひらがな"
    elif all('ァ' <= ch <= 'ン' for ch in input_text):
        script_type = "カタカナ"
    elif all('\u4e00' <= ch <= '\u9fff' for ch in input_text):
        script_type = "漢字"
    elif all(ch.isascii() and ch.isalpha() for ch in input_text):
        script_type = "英語"
    else:
        script_type = "文字"

    return f"{script_type}で「{input_text}」と入力されました。その「{input_text}」を描いた画像を生成してください。"

