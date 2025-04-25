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
    inputTarget: document.getElementById('input_target-screen'),
    inputWord: document.getElementById('input_word-screen'),
    wait: document.getElementById('wait-screen'),
    readTarget: document.getElementById('read_target-screen'),
    result: document.getElementById('result-screen')
};

const buttons = {
    start: document.getElementById('start-button'),
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
        gameState.currentWord = 'しりとり';
        gameState.usedWords = [gameState.currentWord];
        showScreen('inputWord');
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


function getImage(description){
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
}


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
    gene("車")
    //wordtest = getImage("aaa");
    //generateImage(description);
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
    showScreen('inputTarget');
});

// DOMの読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', initializeGame);