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

DATASETS_FOLDER = "static/datasets"
DEFAULT_IMAGE_PATH = os.path.join(DATASETS_FOLDER, "unknown.png").replace("\\", "/") # デフォルト画像パス (存在確認もすると尚良い)

@app.route('/')
def index():
    """画像アップロードページを表示"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
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
            英語の小文字でリスト形式でJSON配列として出力してください。卵とかは駄目で、卵であれば、chickenにしてほしい。全部動物or植物の名前にして。
            例: ["wheat", "beef", "tomato", "lettuce", "cow"]
            他の説明や前置きは不要です。JSON配列のみを出力してください。
            もし特定が難しい場合は、["unknown_life"] と出力してください。
            加えて、画像に写っている主要な物体や料理名を英語で3つまでリストアップし、
            それもJSONの 'detected_labels' キーの値として配列で含めてください。
            例: {"lives": ["wheat", "beef"], "detected_labels": ["hamburger", "fast food", "meal"]}
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

            life_list = ["unknown_life"] # デフォルト値
            detected_labels = ["unknown food"] # デフォルト値

            # --- Geminiからの応答をパース ---
            try:
                cleaned_response = re.sub(r'^```json\s*|\s*```$', '', response_text.strip())
                parsed_data = json.loads(cleaned_response)

                # "lives" リストの抽出と検証
                if isinstance(parsed_data.get("lives"), list):
                    potential_lives = parsed_data["lives"]
                    validated_lives = [item.lower() for item in potential_lives if isinstance(item, str) and item.islower() and item.isalpha()]
                    if validated_lives: # 有効なものが一つでもあれば採用
                        life_list = validated_lives

                # "detected_labels" リストの抽出と検証
                if isinstance(parsed_data.get("detected_labels"), list):
                     potential_labels = parsed_data["detected_labels"]
                     # こちらはアルファベット以外も含む可能性があるので isalpha() は使わない
                     validated_labels = [item.lower() for item in potential_labels if isinstance(item, str)]
                     if validated_labels:
                          detected_labels = validated_labels

            except json.JSONDecodeError:
                print("Warning: Failed to parse Gemini response as JSON.")
                # JSONパース失敗時のフォールバックは省略（必要なら追加）

            print(f"--- Detected Lives: {life_list} ---")
            print(f"--- Detected Labels: {detected_labels} ---")

            # --- 「命」リストから画像パスリストを作成 ---
            image_path_list = []
            for life in life_list:
                potential_path = os.path.join(DATASETS_FOLDER, f"{life}.png").replace("\\", "/")
                if os.path.exists(potential_path):
                    image_path_list.append(potential_path)
                else:
                    image_path_list.append(DEFAULT_IMAGE_PATH)

            print(f"--- Returning Image Paths: {image_path_list} ---")

            # ★ JSONに image_paths, lives, detected_labels を含めて返す
            return jsonify({
                "image_paths": image_path_list,
                "lives": life_list,
                "detected_labels": detected_labels
            })

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