// ゲームの状態管理
const gameState = {
    currentScreen: 'title',
    currentWord: '',
    description: '',
    usedWords: [],
    playerTurn: 1
};

// DOM要素の取得
const screens = {
    title: document.getElementById('title-screen'),
    imageInput: document.getElementById('image-input-screen'),
    camera: document.getElementById('camera-screen'),
    inputTarget: document.getElementById('input_target-screen'),
    inputWord: document.getElementById('input_word-screen'),
    wait: document.getElementById('wait-screen'),
    readTarget: document.getElementById('read_target-screen'),
    result: document.getElementById('result-screen')
};

const buttons = {
    start: document.getElementById('start-button'),
    toCamera: document.getElementById('to-camera-screen'),
    resetImages: document.getElementById('reset-images'),
    submitTarget: document.getElementById('to_input_word-screen'),
    submitWord: document.getElementById('to_wait-screen'),
    ready: document.getElementById('to_read_target-screen'),
    next: document.getElementById('to_result-screen'),
    nextQuestion: document.getElementById('to_init')
};

const inputs = {
    target: document.getElementById('input_target-screen').querySelector('#input-word'),
    word: document.getElementById('input_word-screen').querySelector('#input-word'),
    answer: document.getElementById('read_target-screen').querySelector('#input-word')
};

const displayElements = {
    currentWord: document.getElementById('input_word-screen').querySelector('#current-word'),
    wordImage: document.getElementById('word-image')
};

wordtest = "none";

// DOM要素の存在確認
function checkElements() {
    const missingElements = [];
    Object.entries(screens).forEach(([name, element]) => {
        if (!element) missingElements.push(name);
    });
    Object.entries(buttons).forEach(([name, element]) => {
        if (!element) missingElements.push(`button:${name}`);
    });
    if (missingElements.length > 0) {
        console.error('Missing elements:', missingElements);
        return false;
    }
    return true;
}

// 画面遷移関数
function showScreen(screenName) {
    console.log(`Showing screen: ${screenName}`);
    Object.values(screens).forEach(screen => {
        if (screen) screen.style.display = 'none';
    });
    if (screens[screenName]) {
        screens[screenName].style.display = 'block';
        gameState.currentScreen = screenName;
    } else {
        console.error(`Screen not found: ${screenName}`);
    }
}

// 初期化処理
function initializeGame() {
    console.log('Game initialized');
    if (!checkElements()) {
        alert('ゲームの初期化に失敗しました。コンソールを確認してください');
        return;
    }
    
    // 初期表示設定
    Object.values(screens).forEach(screen => {
        if (screen) screen.style.display = 'none';
    });
    
    showScreen('title');
    
    // ゲーム開始処理
    buttons.start.addEventListener('click', () => {
        gameState.currentWord = 'computer';
        gameState.usedWords = [gameState.currentWord];
        showScreen('imageInput');
        setupImageUpload();
    });
}

// お題入力処理
buttons.submitTarget.addEventListener('click', () => {
    const targetWord = inputs.target.value.trim();
    if (targetWord === '') return;
    
    // しりとりのルールチェック
    const lastChar = gameState.currentWord.slice(-1);
    const firstChar = targetWord.charAt(0);
    
    if (lastChar !== firstChar) {
        alert(`「${lastChar}」から始まる単語を入力してください`);
        return;
    }
    
    if (gameState.usedWords.includes(targetWord)) {
        alert('その単語は既に使われています');
        return;
    }
    
    gameState.currentWord = targetWord;
    gameState.usedWords.push(targetWord);
    showScreen('inputWord');
});


/*function getImage(description){
    $.ajax({
        url: "./getImage.py",
        type: "post",
        data: {description: description},
        success: function(data){
            console.log(data);
            wordtest = data;
            // 例: 画像を表示する処理や次の画面に遷移
            // displayImage(data); または showScreen('nextScreen');
        },
        error: function(data){
            console.log("failed");
            alert('画像の取得に失敗しました');
            showScreen('previousScreen');
        }
    });
}*/


// 説明文字入力処理
buttons.submitWord.addEventListener('click', () => {
    const description = inputs.word.value.trim();
    if (description === '') return;
    
    // 漢字のみチェック
    /*const kanjiRegex = /^[\u4E00-\u9FFF]+$/;
    if (!kanjiRegex.test(description)) {
        alert('漢字のみで入力してください');
        return;
    }*/
    
    gameState.description = description;
    showScreen('wait');
    buttons.ready.disabled = true;
    buttons.ready.style.backgroundColor = '#ccc';
    buttons.ready.style.cursor = 'not-allowed';
    //gene("車")
    //wordtest = getImage("aaa");
    generateImage(description);
});

async function generateImage(description) {
    try {
        if (!apiConfig.imageGeneratorUrl) {
            throw new Error('画像生成APIのURLが設定されていません');
        }

        const response = await fetch(apiConfig.imageGeneratorUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word: description })
        });

        if (!response.ok) throw new Error('画像生成に失敗しました');

        const result = await response.json();
        if (result.image) {
            displayElements.wordImage.src = `data:image/png;base64,${result.image}`;
            displayElements.wordImage.style.display = 'block';
            buttons.ready.disabled = false; // 画像生成成功後にボタンを有効化
            buttons.ready.style.backgroundColor = '#007bff';
            buttons.ready.style.cursor = 'pointer';
        } else {
            throw new Error('画像データが返されませんでした');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('画像生成中にエラーが発生しました: ' + error.message);
        displayElements.wordImage.style.display = 'none';
    }
}

// 待機画面から回答画面へ
buttons.ready.addEventListener('click', () => {
    showScreen('readTarget');
});


// 画像生成処理
// 画像生成APIの設定
const apiConfig = {
    imageGeneratorUrl: 'http://localhost:5000/get_image'
};

async function gene(prompt){
    if (!prompt) {
        alert('プロンプトを入力してください。');
        promptInput.focus();
        return;
      }
      try {
        const response = await fetch('/get_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ word: prompt })
        });
        const result = await response.json();
        if (response.ok && result.image) {
          const img = document.getElementById('word-image');
          img.src = 'data:image/png;base64,' + result.image;
          img.style.display = 'block';
        } else {
          alert('エラーが発生しました: ' + (result.error || response.statusText));
        }
      } catch (err) {
        console.error(err);
        alert('通信エラーが発生しました。コンソールを確認してください。');
      }

}





// 回答処理
buttons.next.addEventListener('click', () => {
    console.log('Answer button clicked');
    const answer = inputs.answer.value.trim();
    console.log('Answer:', answer);
    console.log('Current word:', wordtest);
    if (answer === '') return;
    
    // 正解判定（簡易実装）
    const isCorrect = answer === gameState.description;
    
    // 結果画面表示
    document.getElementById('result-screen').querySelector('h1').textContent = 
        isCorrect ? '正解です！' : '残念、不正解です';
    document.getElementById('result-screen').querySelector('h2:nth-of-type(1)').textContent = 
        `お題: ${gameState.currentWord}`;
    document.getElementById('result-screen').querySelector('h2:nth-of-type(2)').textContent = 
        `正解: ${gameState.description}`;
    
    showScreen('result');
});

// 次の問題へ
buttons.nextQuestion.addEventListener('click', () => {
    gameState.playerTurn = gameState.playerTurn === 1 ? 2 : 1;
    inputs.target.value = '';
    inputs.word.value = '';
    inputs.answer.value = '';
    displayElements.wordImage.style.display = 'none';
    gameState.usedWords.push("computer");
    showScreen('inputWord');
});

// 画像アップロード関連の変数
const uploadedImages = [];
const maxImages = 6; // 最大アップロード可能枚数

// 画像アップロード機能のセットアップ
function setupImageUpload() {
    const fileInput = document.getElementById('image-upload');
    const previewContainer = document.getElementById('preview-container');
    const uploadContainer = document.querySelector('.image-upload-container');
    const nextButton = buttons.toCamera;

    // ファイル選択時の処理
    fileInput.addEventListener('change', handleFileSelect);

    // ドラッグ＆ドロップの処理
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.classList.add('dragover');
    });

    uploadContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.classList.remove('dragover');
    });

    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // リセットボタンの処理
    buttons.resetImages.addEventListener('click', () => {
        uploadedImages.length = 0;
        previewContainer.innerHTML = '';
        updateNextButtonState();
        fileInput.value = '';
    });

    // 次へボタンの処理
    buttons.toCamera.addEventListener('click', () => {
        showScreen('camera');
        startCamera();
    });
}

// ファイル選択時の処理
function handleFileSelect(e) {
    handleFiles(e.target.files);
}

// ファイル処理
function handleFiles(files) {
    const previewContainer = document.getElementById('preview-container');
    
    // ファイルごとに処理
    for (let i = 0; i < files.length; i++) {
        // 最大枚数チェック
        if (uploadedImages.length >= maxImages) {
            alert(`最大${maxImages}枚までアップロードできます`);
            break;
        }

        const file = files[i];
        
        // 画像ファイルかどうかチェック
        if (!file.type.match('image.*')) {
            alert('画像ファイルを選択してください');
            continue;
        }

        // アップロード済み画像に追加
        uploadedImages.push(file);
        
        // サムネイル作成
        const thumbnail = document.createElement('div');
        thumbnail.className = 'image-thumbnail';
        
        const img = document.createElement('img');
        const reader = new FileReader();
        
        reader.onload = (function(aImg) {
            return function(e) {
                aImg.src = e.target.result;
            };
        })(img);
        
        reader.readAsDataURL(file);
        thumbnail.appendChild(img);
        
        // 削除ボタン作成
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-button';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', function() {
            const index = uploadedImages.indexOf(file);
            if (index > -1) {
                uploadedImages.splice(index, 1);
            }
            thumbnail.remove();
            updateNextButtonState();
        });
        
        thumbnail.appendChild(deleteBtn);
        previewContainer.appendChild(thumbnail);
    }
    
    updateNextButtonState();
}

// 次へボタンの有効/無効を更新
function updateNextButtonState() {
    const nextButton = buttons.toCamera;
    if (uploadedImages.length > 0) {
        nextButton.disabled = false;
    } else {
        nextButton.disabled = true;
    }
}

// カメラ関連の変数
let videoElement;
let canvasElement;
let canvasContext;
let cameraStream;
let faceDetector; // 顔検出器
let isDetectorReady = false; // 検出器の準備状態
const MOUTH_MIN_SIZE = 10; // 口の開き具合の最小閾値（必要に応じて調整）
// canvasとvideoのスケール比率
let scaleX = 1;
let scaleY = 1;

// 顔検出器の読み込み
async function loadFaceDetector() {
    try {
        console.log('Loading face-landmarks-detection model...');
        
        // TensorFlow.jsのバージョンとステータスを確認
        if (typeof tf !== 'undefined') {
            console.log('TensorFlow.js version:', tf.version);
            console.log('TensorFlow.js backend:', tf.getBackend());
        } else {
            console.error('TensorFlow.js is not loaded properly');
            alert('TensorFlow.jsが正しく読み込まれていません。ページを更新してください。');
            return;
        }
        
        // face-landmarks-detectionが読み込まれているか確認
        if (typeof faceLandmarksDetection === 'undefined') {
            console.error('face-landmarks-detection is not loaded properly');
            alert('face-landmarks-detectionが正しく読み込まれていません。ページを更新してください。');
            return;
        }
        
        console.log('Initializing MediaPipe FaceMesh model...');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1
        };
        
        // モデルの読み込み
        console.log('Creating detector with config:', detectorConfig);
        faceDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        isDetectorReady = true;
        console.log('Face detector loaded successfully');
    } catch (error) {
        console.error('Failed to load face detector:', error);
        alert('顔検出器の読み込みに失敗しました: ' + error.message);
    }
}

// カメラ起動関数
async function startCamera() {
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('canvas');
    
    if (!videoElement || !canvasElement) {
        console.error('Video or canvas element not found');
        alert('カメラの初期化に失敗しました');
        showScreen('title');
        return;
    }
    
    canvasContext = canvasElement.getContext('2d');
    
    try {
        // 顔検出器を読み込む
        await loadFaceDetector();
        
        // カメラストリームの取得
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user', // フロントカメラを使用
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false // 音声は使用しない
        });
        
        // ビデオ要素にストリームを設定
        videoElement.srcObject = cameraStream;
        
        // ビデオ再生準備完了時の処理
        videoElement.onloadedmetadata = () => {
            // Canvasサイズをビデオサイズに合わせる
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            
            // Canvasを表示
            canvasElement.style.display = 'block';
            
            // 見出しテキストを変更
            const heading = document.querySelector('#camera-screen h1');
            if (heading) {
                heading.textContent = '口の中心検出';
            }
            
            // videoとcanvasの画像サイズに差異があるため記憶する
            scaleX = canvasElement.width / videoElement.videoWidth;
            scaleY = canvasElement.height / videoElement.videoHeight;
            
            // 定期的にフレームを描画
            setInterval(processVideoFrame, 100);
        };
        
    } catch (error) {
        console.error('カメラの起動に失敗しました:', error);
        alert('カメラの起動に失敗しました: ' + error.message);
        showScreen('inputWord');
    }
}

// 顔のランドマークから口の中心座標と開き具合を検出する関数
function detectMouthCenter(landmarks) {
    try {
        // 口の内側の上唇と下唇のポイントを取得（MediaPipe Facemeshのランドマークインデックス）
        // 内側下唇の真ん中（索引 78 = MediaPipeの口内側下唇の中央部）
        const innerLowerLip = landmarks[78];
        // 内側上唇の真ん中（索引 13 = MediaPipeの口内側上唇の中央部）
        const innerUpperLip = landmarks[13];
        
        // 口の開き具合：内側上唇と内側下唇のY座標の差分
        const openMouthSize = innerLowerLip[1] - innerUpperLip[1];
        // 口の中心位置のY座標
        const y = innerLowerLip[1] - openMouthSize / 2;
        
        // 口の中心のX座標、Y座標、開き具合を返す
        // 開き具合が閾値より小さい場合は閾値を返す
        return [
            innerLowerLip[0], // X座標
            y, // Y座標
            openMouthSize < MOUTH_MIN_SIZE ? MOUTH_MIN_SIZE : openMouthSize // 開き具合
        ];
    } catch (error) {
        console.error('口の中心検出に失敗:', error);
        return null;
    }
}

// ゲーム関連の変数
let gameStarted = false; // ゲームが開始されたかどうか
let faceDetectionAttempts = 0; // 顔検出の試行回数
const MAX_ATTEMPTS = 30; // 顔検出の最大試行回数

// ビデオフレームを処理し、顔検出と口の中心座標の描画を行う
async function processVideoFrame() {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && canvasContext) {
        try {
            // canvasにビデオフレームを描画
            canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            
            // ステータス表示用のデータを追加
            canvasContext.fillStyle = '#FFFFFF';
            canvasContext.font = '14px Arial';
            canvasContext.fillText(`顔検出ステータス: ${isDetectorReady ? '準備完了' : '準備中'}`, 10, 20);
            canvasContext.fillText(`検出試行回数: ${faceDetectionAttempts}`, 10, 40);
            
            // 顔検出器が準備できていない場合
            if (!isDetectorReady) {
                canvasContext.fillStyle = '#FF0000';
                canvasContext.font = '16px Arial';
                canvasContext.fillText('顔検出器を読み込み中...', 10, 60);
                return;
            }
            
            // 顔のランドマークを検出
            console.log('Detecting faces...');
            const faces = await faceDetector.estimateFaces(videoElement, { flipHorizontal: false });
            console.log('Faces detected:', faces ? faces.length : 0);
            faceDetectionAttempts++;
            
            // 顔が検出された場合
            if (faces && faces.length > 0) {
                console.log('Face detected successfully!');
                // 最初の顔を処理
                const face = faces[0];
                
                // キーポイントはカメラ画像のものであるためvideoとcanvasのスケール差を合わせる
                const keypoints = face.keypoints.map(keypoint => [keypoint.x * scaleX, keypoint.y * scaleY]);
                
                // 口の中心座標と開き具合を検出
                const mouthInfo = detectMouthCenter(keypoints);
                console.log('Mouth info:', mouthInfo);
                
                if (mouthInfo) {
                    const [mouthCenterX, mouthCenterY, mouthOpenSize] = mouthInfo;
                    
                    // game.jsに口の中心座標を渡す
                    if (typeof updateMouthPosition === 'function') {
                        updateMouthPosition(mouthCenterX, mouthCenterY, mouthOpenSize);
                        
                        // ゲームが開始されていなければ開始
                        if (!gameStarted) {
                            gameStarted = true;
                            console.log('Game started!');
                            // ゲーム開始時の処理
                            // ターゲットの作成（datasets内の画像を利用）
                            if (typeof createTarget === 'function') {
                                createTarget(40, 40, 'datasets/cow.png');
                                createTarget(40, 40, 'datasets/milk.png');
                                createTarget(40, 40, 'datasets/pig.png');
                            }
                        }
                    }
                    
                    // ゲーム描画を行う
                    if (typeof draw === 'function') {
                        draw(canvasContext);
                    }
                    
                    // 口の中心座標をテキスト表示
                    canvasContext.fillStyle = '#00FF00';
                    canvasContext.font = '12px Arial';
                    canvasContext.fillText(`口の中心: (${Math.round(mouthCenterX)}, ${Math.round(mouthCenterY)})`, 10, 80);
                    canvasContext.fillText(`開き具合: ${Math.round(mouthOpenSize)}`, 10, 100);
                }
            } else {
                // 顔が検出されない場合
                if (faceDetectionAttempts % 10 === 0) { // 10回ごとにログ出力
                    console.log(`顔が検出されていません (${faceDetectionAttempts}回目)`);
                }
                
                canvasContext.fillStyle = '#FF6600';
                canvasContext.font = '16px Arial';
                canvasContext.fillText('顔が検出されていません', 10, 60);
                
                // 一定回数試行しても検出されない場合、代替モードに切り替え
                if (faceDetectionAttempts > MAX_ATTEMPTS) {
                    // ダミーの口の位置でゲームを続ける
                    const centerX = canvasElement.width / 2;
                    const centerY = canvasElement.height / 2;
                    
                    canvasContext.fillStyle = '#FFFF00';
                    canvasContext.font = '16px Arial';
                    canvasContext.fillText('代替モード：マウスで操作できます', 10, 120);
                    
                    // マウス位置取得のイベントリスナーを一度だけ追加
                    if (!gameStarted) {
                        canvasElement.addEventListener('mousemove', function(e) {
                            const rect = canvasElement.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const mouseY = e.clientY - rect.top;
                            if (typeof updateMouthPosition === 'function') {
                                updateMouthPosition(mouseX, mouseY, 20);
                            }
                        });
                        
                        // ゲーム開始
                        if (typeof updateMouthPosition === 'function') {
                            updateMouthPosition(centerX, centerY, 20);
                            gameStarted = true;
                            
                            // ターゲットの作成
                            if (typeof createTarget === 'function') {
                                createTarget(40, 40, 'datasets/cow.png');
                                createTarget(40, 40, 'datasets/milk.png');
                                createTarget(40, 40, 'datasets/pig.png');
                            }
                        }
                    }
                    
                    // ゲーム描画
                    if (typeof draw === 'function') {
                        draw(canvasContext);
                    }
                }
            }
        } catch (error) {
            console.error('フレーム処理中のエラー:', error);
            // エラーメッセージを画面に表示
            if (canvasContext) {
                canvasContext.fillStyle = '#FF0000';
                canvasContext.font = '16px Arial';
                canvasContext.fillText(`エラー: ${error.message}`, 10, 150);
            }
        }
    }
}

// カメラ停止関数
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    if (videoElement) {
        videoElement.srcObject = null;
    }
}

// DOMの読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', initializeGame);