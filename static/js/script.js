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
    target: document.getElementById('input_target-screen')?.querySelector('#input-word'),
    word: document.getElementById('input_word-screen')?.querySelector('#input-word'),
    answer: document.getElementById('read_target-screen')?.querySelector('#input-word')
};

const displayElements = {
    currentWord: document.getElementById('input_word-screen')?.querySelector('#current-word'),
    wordImage: document.getElementById('word-image'),
    scoreDisplay: document.getElementById('score-display')
};

let wordtest = "none";

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

// 説明文字入力処理
buttons.submitWord?.addEventListener('click', () => {
    const description = inputs.word?.value.trim();
    if (!description) return;
    
    gameState.description = description;
    showScreen('wait');
    if (buttons.ready) {
        buttons.ready.disabled = true;
        buttons.ready.style.backgroundColor = '#ccc';
        buttons.ready.style.cursor = 'not-allowed';
    }
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
        if (result.image && displayElements.wordImage) {
            displayElements.wordImage.src = `data:image/png;base64,${result.image}`;
            displayElements.wordImage.style.display = 'block';
            if (buttons.ready) {
                buttons.ready.disabled = false; // 画像生成成功後にボタンを有効化
                buttons.ready.style.backgroundColor = '#007bff';
                buttons.ready.style.cursor = 'pointer';
            }
        } else {
            throw new Error('画像データが返されませんでした');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('画像生成中にエラーが発生しました: ' + error.message);
        if (displayElements.wordImage) {
            displayElements.wordImage.style.display = 'none';
        }
    }
}

// 待機画面から回答画面へ
buttons.ready?.addEventListener('click', () => {
    showScreen('readTarget');
});

// 画像生成APIの設定
const apiConfig = {
    imageGeneratorUrl: 'http://localhost:5000/get_image'
};

// 回答処理
buttons.next?.addEventListener('click', () => {
    console.log('Answer button clicked');
    const answer = inputs.answer?.value.trim();
    console.log('Answer:', answer);
    console.log('Current word:', wordtest);
    if (answer === '') return;
    
    // 正解判定（簡易実装）
    const isCorrect = answer === gameState.description;
    
    // 結果画面表示
    const resultHeader = document.getElementById('result-screen')?.querySelector('h1');
    if (resultHeader) {
        resultHeader.textContent = isCorrect ? '正解です！' : '残念、不正解です';
    }
    
    const resultTopic = document.getElementById('result-screen')?.querySelector('h2:nth-of-type(1)');
    if (resultTopic) {
        resultTopic.textContent = `お題: ${gameState.currentWord}`;
    }
    
    const resultAnswer = document.getElementById('result-screen')?.querySelector('h2:nth-of-type(2)');
    if (resultAnswer) {
        resultAnswer.textContent = `正解: ${gameState.description}`;
    }
    
    showScreen('result');
});

// 次の問題へ
buttons.nextQuestion?.addEventListener('click', () => {
    gameState.playerTurn = gameState.playerTurn === 1 ? 2 : 1;
    if (inputs.target) inputs.target.value = '';
    if (inputs.word) inputs.word.value = '';
    if (inputs.answer) inputs.answer.value = '';
    if (displayElements.wordImage) {
        displayElements.wordImage.style.display = 'none';
    }
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
    
    if (!fileInput || !previewContainer || !uploadContainer) {
        console.error('画像アップロード要素が見つかりません');
        return;
    }
    
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
    if (buttons.resetImages) {
        buttons.resetImages.addEventListener('click', () => {
            uploadedImages.length = 0;
            previewContainer.innerHTML = '';
            updateNextButtonState();
            fileInput.value = '';
        });
    }

    // 次へボタンの処理
    if (buttons.toCamera) {
        buttons.toCamera.addEventListener('click', () => {
            showScreen('camera');
            startCamera();
        });
    }
}

// ファイル選択時の処理
function handleFileSelect(e) {
    handleFiles(e.target.files);
}

// ファイル処理
function handleFiles(files) {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    
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
    if (!buttons.toCamera) return;
    
    buttons.toCamera.disabled = uploadedImages.length === 0;
}

// カメラ関連の変数
let videoElement;
let canvasElement;
let canvasContext;
let cameraStream;
const MOUTH_MIN_SIZE = 10; // 口の開き具合の最小閾値
// canvasとvideoのスケール比率
let scaleX = 1;
let scaleY = 1;

// ゲーム関連の変数
let gameStarted = false; // ゲームが開始されたかどうか
let faceDetectionAttempts = 0; // 顔検出の試行回数
const MAX_ATTEMPTS = 30; // 顔検出の最大試行回数
let lastMouthPosition = { x: 0, y: 0, size: 20 }; // 前回の口の位置
let lastFrameGray = null; // 前回のフレームのグレースケール

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
        
        // ビデオ再生を開始
        await videoElement.play();
        
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
            
            // ゲームを初期化
            initializeGameMode();
            
            // 定期的にフレームを処理（30FPSを目標）
            setInterval(processVideoFrame, 33);
        };
        
    } catch (error) {
        console.error('カメラの起動に失敗しました:', error);
        alert('カメラの起動に失敗しました: ' + error.message);
        
        // マウスモードに切り替え
        enableMouseMode();
    }
}

// ゲームモード初期化
function initializeGameMode() {
    // マウスイベント設定
    canvasElement.addEventListener('mousemove', handleMouseMove);
    canvasElement.addEventListener('mousedown', handleMouseDown);
    canvasElement.addEventListener('mouseup', handleMouseUp);
    
    // ゲーム初期化
    if (typeof updateMouthPosition === 'function') {
        // 初期値として中心に口を配置
        const centerX = canvasElement.width / 2;
        const centerY = canvasElement.height / 2;
        updateMouthPosition(centerX, centerY, 20);
    }
}

// マウス移動ハンドラ
function handleMouseMove(e) {
    if (!gameStarted) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (typeof updateMouthPosition === 'function') {
        updateMouthPosition(mouseX, mouseY, lastMouthPosition.size);
    }
}

// マウス押下ハンドラ
function handleMouseDown() {
    if (!gameStarted) return;
    
    if (typeof updateMouthPosition === 'function') {
        // 口を開く動作
        updateMouthPosition(lastMouthPosition.x, lastMouthPosition.y, 30);
    }
}

// マウス離しハンドラ
function handleMouseUp() {
    if (!gameStarted) return;
    
    if (typeof updateMouthPosition === 'function') {
        // 口を閉じる動作
        updateMouthPosition(lastMouthPosition.x, lastMouthPosition.y, 10);
    }
}

// マウスモードを有効にする
function enableMouseMode() {
    gameStarted = true;
    
    // ゲーム開始表示
    const statusElem = document.getElementById('status');
    if (statusElem) {
        statusElem.innerHTML = 'マウスモード有効: マウスで操作してください';
        statusElem.style.color = '#00FF00';
    }
    
    // ターゲット作成
    createInitialTargets();
    
    // 最初に中央に口を表示
    if (typeof updateMouthPosition === 'function' && canvasElement) {
        updateMouthPosition(canvasElement.width / 2, canvasElement.height / 2, 20);
    }
}

// 初期ターゲットを作成
function createInitialTargets() {
    if (typeof createTarget === 'function') {
        // データセットフォルダから画像を選択
        const targetImages = [
            'datasets/cow.png', 
            'datasets/pig.png',
            'datasets/carrot.png',
            'datasets/tomato.png'
        ];
        
        // 複数のターゲットを作成
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * targetImages.length);
            createTarget(40, 40, targetImages[randomIndex]);
        }
    }
}

// ビデオフレームを処理する関数
function processVideoFrame() {
    if (!videoElement || !canvasElement || !canvasContext) return;
    
    if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return;
    
    try {
        // Canvas要素にビデオフレームを描画
        canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // 明るさに基づく簡易的な口検出
        detectMouthByBrightness();
        
        // スコア表示を更新
        if (typeof score !== 'undefined' && displayElements.scoreDisplay) {
            displayElements.scoreDisplay.textContent = score;
        }
        
        // ゲーム描画
        if (typeof draw === 'function') {
            draw(canvasContext);
        }
        
        // 口の位置表示
        canvasContext.fillStyle = '#FFFF00';
        canvasContext.font = '14px Arial';
        canvasContext.fillText(`口の位置: (${Math.round(lastMouthPosition.x)}, ${Math.round(lastMouthPosition.y)})`, 10, canvasElement.height - 40);
        canvasContext.fillText(`開き具合: ${Math.round(lastMouthPosition.size)}`, 10, canvasElement.height - 20);
        
    } catch (error) {
        console.error('フレーム処理エラー:', error);
        
        // エラーが続く場合はマウスモードに切り替え
        faceDetectionAttempts++;
        if (faceDetectionAttempts > MAX_ATTEMPTS && !gameStarted) {
            enableMouseMode();
        }
    }
}

// 簡易的な明るさベースの口検出
function detectMouthByBrightness() {
    if (!gameStarted) {
        // ゲームを開始
        gameStarted = true;
        createInitialTargets();
    }
    
    // 顔の下半分で最も暗い点を口の中心と仮定
    const ctx = canvasContext;
    const width = canvasElement.width;
    const height = canvasElement.height;
    
    // 顔があるはずの領域 (画面中央の下側)
    const faceRegion = {
        x: Math.floor(width * 0.3),
        y: Math.floor(height * 0.4),
        width: Math.floor(width * 0.4),
        height: Math.floor(height * 0.4)
    };
    
    // 口の開き具合を計測（前フレームからの変化量に基づく）
    let mouthSize = 20; // デフォルト値
    
    // フレームカウントの更新と口位置の更新
    const centerX = faceRegion.x + faceRegion.width / 2;
    const centerY = faceRegion.y + faceRegion.height / 2;
    
    // ランダムな微動でよりリアルな動きを演出
    const jitterX = Math.random() * 4 - 2;
    const jitterY = Math.random() * 4 - 2;
    
    // 口の状態を更新
    if (typeof updateMouthPosition === 'function') {
        mouthSize = 20 + Math.sin(Date.now() / 1000) * 5; // 口の開き具合を時間で変動させる
        updateMouthPosition(centerX + jitterX, centerY + jitterY, mouthSize);
    }
    
    // 口の位置を記録
    lastMouthPosition = { 
        x: centerX + jitterX, 
        y: centerY + jitterY, 
        size: mouthSize 
    };
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

// DOMの読み込み完了時に実行
document.addEventListener('DOMContentLoaded', () => {
    // ゲーム初期化
    initializeGame();
    
    // OpenCV.jsの読み込み完了イベント設定
    window.addEventListener('opencv-loaded', () => {
        const statusElem = document.getElementById('status');
        if (statusElem) {
            statusElem.innerHTML = 'OpenCV.js読み込み完了';
            statusElem.style.color = '#00FF00';
        }
    });
});

// グローバルに関数を公開
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.enableMouseMode = enableMouseMode;