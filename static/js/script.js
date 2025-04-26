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
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
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
                heading.textContent = 'カメラ画像';
            }
            
            // 定期的にフレームを描画
            setInterval(drawVideoFrame, 100);
            
            // 5秒後に次の画面へ自動遷移（オプション）
           /* setTimeout(() => {
                showScreen('inputWord');
                stopCamera();
            }, 5000);*/
        };
        
    } catch (error) {
        console.error('カメラの起動に失敗しました:', error);
        alert('カメラの起動に失敗しました: ' + error.message);
        showScreen('inputWord');
    }
}

// ビデオフレームをCanvasに描画
function drawVideoFrame() {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && canvasContext) {
        canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
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