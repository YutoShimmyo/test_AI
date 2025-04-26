# shimmyo.py の必要なインポートを追加・確認
import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
import io
from PIL import Image
import json
import re
import traceback
# ★ os.path をインポート
import os.path

app = Flask(__name__)


# --- Gemini APIの設定 ---
try:
    # 環境変数からAPIキーを読み込む
    gemini_api_key = os.environ.get("GOOGLE_API_KEY")
    if not gemini_api_key:
        raise ValueError("環境変数 'GOOGLE_API_KEY' が設定されていません。")
    genai.configure(api_key=gemini_api_key)

    # 使用するGeminiモデルを選択 (マルチモーダル対応モデル)
    # 例: 'gemini-1.5-flash', 'gemini-pro-vision'
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Gemini APIクライアントを初期化しました。")

except Exception as e:
    print(f"Gemini API の設定または初期化に失敗しました: {e}")
    model = None # エラーが発生したらモデルをNoneにする

DATASETS_FOLDER = "datasets"
DEFAULT_IMAGE_PATH = os.path.join(DATASETS_FOLDER, "unknown.png").replace("\\", "/") # デフォルト画像パス (存在確認もすると尚良い)

@app.route('/')
def index():
    """画像アップロードページを表示"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    """画像を受け取り、分析して「命」に対応する画像パスリストを返す"""
    if 'file' not in request.files:
        return jsonify({"error": "ファイルがありません"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "ファイルが選択されていません"}), 400

    if file and model:
        try:
            img_bytes = file.read()
            img = Image.open(io.BytesIO(img_bytes))
            prompt = """
            この画像に写っている料理や食品に使われている主要な原材料（動物や植物の名前）を特定し、
            英語の小文字でリスト形式でJSON配列として出力してください。
            例: ["wheat", "beef", "tomato", "lettuce", "cow"]
            他の説明や前置きは不要です。JSON配列のみを出力してください。
            もし特定が難しい場合は、["unknown_life"] と出力してください。
            """
            print("--- Sending request to Gemini API ---")
            response = model.generate_content([prompt, img], stream=False)

            if not response.parts:
                 print("--- Gemini API Response Blocked ---")
                 print(response.prompt_feedback)
                 if response.candidates and response.candidates[0].finish_reason != 'SAFETY':
                      pass
                 return jsonify({"error": "不適切なコンテンツの可能性があるため、応答がブロックされました。"}), 400

            response_text = response.text
            print(f"--- Gemini API Raw Response Text:\n{response_text}\n---")

            life_list = []
            # --- Geminiからの応答をパースして「命」リストを抽出 ---
            # (省略... 現在のコードのまま)
            try:
                cleaned_response = re.sub(r'^```json\s*|\s*```$', '', response_text.strip())
                parsed_data = json.loads(cleaned_response)
                if isinstance(parsed_data, list):
                    life_list = [item.lower() for item in parsed_data if isinstance(item, str) and item.islower() and item.isalpha()]
                else:
                    print("Warning: Gemini response was valid JSON but not a list.")
            except json.JSONDecodeError:
                print("Warning: Failed to parse Gemini response as JSON. Trying regex extraction.")
                match = re.search(r'\[\s*([\'"]?\w+[\'"]?\s*,\s*)*[\'"]?\w+[\'"]?\s*\]', cleaned_response)
                if match:
                    try:
                        potential_list = eval(match.group(0))
                        if isinstance(potential_list, list):
                             life_list = [item.lower() for item in potential_list if isinstance(item, str) and item.isalpha()]
                    except Exception as eval_err:
                         print(f"Error evaluating extracted list: {eval_err}")
                if not life_list:
                     print("Warning: Could not extract list using regex.")
                     life_list = ["unknown_life"]
            if not life_list:
                 life_list = ["unknown_life"]
            # --- パース処理ここまで ---

            print(f"--- Detected Lives: {life_list} ---")

            # --- ★ 「命」リストから画像パスリストを作成 ★ ---
            image_path_list = []
            for life in life_list:
                # datasetsフォルダ内の画像パスを組み立てる (例: datasets/cow.png)
                potential_path = os.path.join(DATASETS_FOLDER, f"{life}.png")
                # Windowsパスの '\' を '/' に置換（Webパスのため）
                potential_path = potential_path.replace("\\", "/")

                # (推奨) 実際にファイルが存在するか確認
                # os.path.exists は shimmyo.py から見たパスでチェックします
                if os.path.exists(potential_path):
                    image_path_list.append(potential_path)
                    print(f"Found image for '{life}': {potential_path}")
                else:
                    # 存在しない場合はデフォルト画像パスを追加
                    image_path_list.append(DEFAULT_IMAGE_PATH)
                    print(f"Image for '{life}' not found at '{potential_path}', using default.")

            # 重複を除去したい場合は Set を使う (任意)
            # image_path_list = sorted(list(set(image_path_list)))

            print(f"--- Returning Image Paths: {image_path_list} ---")

            # ★ JSONのキーを "image_paths" にして画像パスのリストを返す
            return jsonify({"image_paths": image_path_list})

        except Exception as e:
            print(f"Error processing image with Gemini: {e}")
            traceback.print_exc()
            return jsonify({"error": f"画像の処理中にエラーが発生しました: {e}"}), 500
    elif not model:
         return jsonify({"error": "Gemini APIクライアントが初期化されていません"}), 500
    else:
        return jsonify({"error": "不明なエラー"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)