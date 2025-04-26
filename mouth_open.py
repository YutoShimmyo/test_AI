import cv2
import dlib
import numpy as np

# dlibの顔検出器とランドマーク予測器をロード
try:
    detector = dlib.get_frontal_face_detector()
    # ダウンロードしたモデルファイルのパスを指定してください
    predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
except RuntimeError as e:
    print("エラー: 学習済みモデルファイル 'shape_predictor_68_face_landmarks.dat' が見つからないか、ロードできませんでした。")
    print(f"詳細: {e}")
    exit()

# 口のランドマークのインデックス (dlib 68点モデル)
# 口の外側の輪郭: 48-59
# 口の内側の輪郭: 60-67
MOUTH_OUTER_POINTS = list(range(48, 60))
MOUTH_INNER_POINTS = list(range(60, 68))

# 口の開閉判定の閾値 (この値は環境によって調整が必要な場合があります)
MOUTH_OPEN_THRESHOLD_RATIO = 0.4 # 顔の高さに対する口の高さの比率

def get_mouth_aspect_ratio(landmarks):
    """口のアスペクト比（開閉度合い）を計算する"""
    # 口の垂直距離 (内側の上下唇の中央付近)
    mouth_top_inner = np.mean([landmarks.part(61).y, landmarks.part(62).y, landmarks.part(63).y])
    mouth_bottom_inner = np.mean([landmarks.part(67).y, landmarks.part(66).y, landmarks.part(65).y])
    vertical_dist = abs(mouth_bottom_inner - mouth_top_inner)

    # 口の水平距離 (口角)
    horizontal_dist = abs(landmarks.part(60).x - landmarks.part(64).x)

    if horizontal_dist == 0:
        return 0
    # アスペクト比を返す (水平距離に対する垂直距離の比でも良い)
    return vertical_dist / horizontal_dist

def get_face_height(landmarks):
    """顔の高さを計算する (眉の上から顎まで)"""
    eyebrow_top = min(landmarks.part(19).y, landmarks.part(24).y) # 眉の中央上部あたり
    jaw_bottom = landmarks.part(8).y # 顎の先端
    return abs(jaw_bottom - eyebrow_top)

def get_mouth_height(landmarks):
     """口の高さを計算する（内側の上下唇）"""
     mouth_top_inner = np.mean([landmarks.part(61).y, landmarks.part(62).y, landmarks.part(63).y])
     mouth_bottom_inner = np.mean([landmarks.part(67).y, landmarks.part(66).y, landmarks.part(65).y])
     return abs(mouth_bottom_inner - mouth_top_inner)

# カメラデバイスを開く (通常は0)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("エラー: カメラを開けません。")
    exit()

print("カメラ起動中... 'q'キーで終了します。")

while True:
    # フレームを読み込む
    ret, frame = cap.read()
    if not ret:
        print("エラー: フレームを読み込めません。")
        break

    # フレームをグレースケールに変換
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # 顔を検出
    faces = detector(gray)

    for face in faces:
        # 顔のランドマークを検出
        landmarks = predictor(gray, face)

        # --- 口の座標計算 (バウンディングボックス) ---
        mouth_points = []
        # 口の外側の輪郭点を取得
        for i in MOUTH_OUTER_POINTS:
            x = landmarks.part(i).x
            y = landmarks.part(i).y
            mouth_points.append((x, y))
            # ランドマーク点を描画 (デバッグ用)
            # cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

        # NumPy配列に変換してバウンディングボックスを計算
        mouth_points_np = np.array(mouth_points)
        (mouth_x, mouth_y, mouth_w, mouth_h) = cv2.boundingRect(mouth_points_np)

        # 口のバウンディングボックスを描画
        cv2.rectangle(frame, (mouth_x, mouth_y), (mouth_x + mouth_w, mouth_y + mouth_h), (0, 255, 0), 1)
        # 口の中心座標を表示
        mouth_center_x = mouth_x + mouth_w // 2
        mouth_center_y = mouth_y + mouth_h // 2
        cv2.putText(frame, f"Mouth:({mouth_center_x},{mouth_center_y})", (mouth_x, mouth_y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

        # --- 口の開閉判定 ---
        face_h = get_face_height(landmarks)
        mouth_h_abs = get_mouth_height(landmarks)

        is_mouth_open = False
        if face_h > 0: # 顔の高さが取得できている場合
            mouth_ratio = mouth_h_abs / face_h
            if mouth_ratio > MOUTH_OPEN_THRESHOLD_RATIO:
                is_mouth_open = True

        # 口の開閉状態を表示
        status_text = "Mouth Open" if is_mouth_open else "Mouth Closed"
        status_color = (0, 0, 255) if is_mouth_open else (255, 0, 0)
        cv2.putText(frame, status_text, (face.left(), face.top() - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

        # (オプション)顔の矩形を描画
        # cv2.rectangle(frame, (face.left(), face.top()), (face.right(), face.bottom()), (255, 0, 0), 2)

    # 結果を表示
    cv2.imshow('Mouth Detector - Press q to quit', frame)

    # 'q'キーが押されたらループを抜ける
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# リソースを解放
cap.release()
cv2.destroyAllWindows()
print("プログラムを終了しました。")