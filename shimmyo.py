import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
import io
from PIL import Image
import json # GeminiからのJSON応答をパースするため
import re # 応答形式が不安定な場合に備え、リストを抽出するため

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

@app.route('/')
def index():
    """画像アップロードページを表示"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    """画像を受け取り、Gemini APIで分析して「命」リストを返す"""
    if 'file' not in request.files:
        return jsonify({"error": "ファイルがありません"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "ファイルが選択されていません"}), 400

    if file and model:
        try:
            # 画像データを読み込み、PIL Imageオブジェクトに変換
            img_bytes = file.read()
            img = Image.open(io.BytesIO(img_bytes))

            # --- Gemini APIへのプロンプト ---
            # ここで指示内容を調整して、期待する出力を得られるようにします
            # JSON形式での出力を依頼すると、パースしやすくなります
            prompt = """
            この画像に写っている料理や食品に使われている主要な原材料（動物や植物の名前）を特定し、
            英語の小文字でリスト形式でJSON配列として出力してください。
            例: ["wheat", "beef", "tomato", "lettuce", "cow"]
            他の説明や前置きは不要です。JSON配列のみを出力してください。
            もし特定が難しい場合は、["unknown_life"] と出力してください。
            """

            # Gemini APIに画像とプロンプトを送信
            print("--- Sending request to Gemini API ---") # デバッグ用
            response = model.generate_content([prompt, img], stream=False)
            # 安全性設定でブロックされた場合の応答を確認
            if not response.parts:
                 print("--- Gemini API Response Blocked ---")
                 print(response.prompt_feedback)
                 # 必要に応じて、候補が利用可能か確認
                 if response.candidates and response.candidates[0].finish_reason != 'SAFETY':
                      # 別の候補がある場合の処理（ここではエラーとして扱う）
                      pass
                 return jsonify({"error": "不適切なコンテンツの可能性があるため、応答がブロックされました。"}), 400


            response_text = response.text
            print(f"--- Gemini API Raw Response Text:\n{response_text}\n---") # デバッグ用

            # --- Geminiからの応答をパースしてリストを抽出 ---
            life_list = []
            try:
                # まずJSONとしてパースを試みる
                # Geminiが ```json ... ``` のようにマークダウンで囲む場合があるので除去
                cleaned_response = re.sub(r'^```json\s*|\s*```$', '', response_text.strip())
                parsed_data = json.loads(cleaned_response)
                if isinstance(parsed_data, list):
                    # 全て小文字の英字か確認・フィルタリング (より安全に)
                    life_list = [item.lower() for item in parsed_data if isinstance(item, str) and item.islower() and item.isalpha()]
                else:
                    print("Warning: Gemini response was valid JSON but not a list.")
                    # JSONだがリストでない場合の代替処理（必要なら）

            except json.JSONDecodeError:
                # JSONパースに失敗した場合、テキストからリスト形式の部分を正規表現で抽出する試み
                print("Warning: Failed to parse Gemini response as JSON. Trying regex extraction.")
                # 例: ['apple', 'banana'] のような形式を抽出
                match = re.search(r'\[\s*([\'"]?\w+[\'"]?\s*,\s*)*[\'"]?\w+[\'"]?\s*\]', cleaned_response)
                if match:
                    try:
                        # evalはセキュリティリスクがあるので注意が必要だが、ここでは限定的に使用
                        # 文字列リテラルのみを許可するようにするなどの対策が望ましい
                        potential_list = eval(match.group(0))
                        if isinstance(potential_list, list):
                             life_list = [item.lower() for item in potential_list if isinstance(item, str) and item.isalpha()]
                    except Exception as eval_err:
                         print(f"Error evaluating extracted list: {eval_err}")
                if not life_list: # 正規表現でも抽出できなかった場合
                     print("Warning: Could not extract list using regex.")
                     # 最終手段として、単語に分割するなど（精度は低い）
                     # words = re.findall(r'\b[a-z]+\b', cleaned_response.lower())
                     # life_list = list(set(words)) # 重複除去
                     life_list = ["unknown_life"] # またはデフォルト値

            # 抽出されたリストが空ならデフォルト値を入れる
            if not life_list:
                 life_list = ["unknown_life"]

            print(f"--- Returning Lives: {life_list} ---") # デバッグ用
            return jsonify({"lives": life_list})

        except Exception as e:
            print(f"Error processing image with Gemini: {e}")
            # エラーの詳細をログに出力 (デバッグ用)
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"画像の処理中にエラーが発生しました: {e}"}), 500
    elif not model:
         return jsonify({"error": "Gemini APIクライアントが初期化されていません"}), 500
    else:
        return jsonify({"error": "不明なエラー"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) # デバッグモード、外部アクセス許可