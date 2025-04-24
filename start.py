from flask import Flask, render_template
from flask_cors import CORS

app = Flask(__name__)
# 必要なら全ルートで CORS を許可
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

# 既存の /generate-image もそのまま
