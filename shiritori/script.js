document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-button');
    const titleScreen = document.getElementById('title-screen');
    const gameScreen = document.getElementById('game-screen');
    const currentWordElement = document.getElementById('current-word');
    const inputWord = document.getElementById('input-word');
    const submitButton = document.getElementById('submit-button');
    const resultElement = document.getElementById('result');
    const wordHistory = document.getElementById('word-history');
    const timerElement = document.getElementById('timer');
    const correctAnswerElement = document.getElementById('correct-answer');
    const answerWordElement = document.getElementById('answer-word');

    let currentWord = 'しりとり';
    let timer;
    let timeLeft = 10;
    let usedWords = [currentWord];
    let gameActive = false;

    // ゲーム開始処理
    startButton.addEventListener('click', function() {
        titleScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        currentWordElement.textContent = `最初の単語: ${currentWord}`;
        gameActive = true;
        startTimer();
    });

    // タイマー開始
    function startTimer() {
        clearInterval(timer);
        timeLeft = 10;
        timerElement.textContent = timeLeft;
        
        timer = setInterval(function() {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                checkAnswer(false);
            }
        }, 1000);
    }

    // 回答送信処理
    submitButton.addEventListener('click', function() {
        if (!gameActive) return;
        
        const userAnswer = inputWord.value.trim();
        if (userAnswer === '') return;
        
        checkAnswer(true);
    });

    // エンターキーでも回答可能
    inputWord.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && gameActive) {
            const userAnswer = inputWord.value.trim();
            if (userAnswer === '') return;
            
            checkAnswer(true);
        }
    });

    // 正誤判定
    function checkAnswer(isUserInput) {
        const userAnswer = isUserInput ? inputWord.value.trim() : '';
        let isValid = false;
        let correctNextWord = '';
        
        if (isUserInput) {
            // しりとりのルールチェック
            const lastChar = currentWord.slice(-1);
            const firstChar = userAnswer.charAt(0);
            
            // 「ん」で終わる単語はNG
            if (userAnswer.slice(-1) === 'ん') {
                resultElement.textContent = '×';
                resultElement.className = 'incorrect';
                correctNextWord = getRandomWord(lastChar);
            }
            // 最初の文字が前の単語の最後の文字と一致するか
            else if (lastChar === firstChar) {
                // 既に使った単語かチェック
                if (!usedWords.includes(userAnswer)) {
                    isValid = true;
                    usedWords.push(userAnswer);
                    currentWord = userAnswer;
                    currentWordElement.textContent = `次の単語: ${currentWord}`;
                    resultElement.textContent = '〇';
                    resultElement.className = 'correct';
                } else {
                    resultElement.textContent = '×';
                    resultElement.className = 'incorrect';
                    correctNextWord = getRandomWord(lastChar);
                }
            } else {
                resultElement.textContent = '×';
                resultElement.className = 'incorrect';
                correctNextWord = getRandomWord(lastChar);
            }
        } else {
            // 時間切れの場合
            resultElement.textContent = '×';
            resultElement.className = 'incorrect';
            correctNextWord = getRandomWord(currentWord.slice(-1));
        }
        
        // 履歴に追加
        addToHistory(userAnswer, isValid);
        
        // 不正解の場合は正解を表示
        if (!isValid) {
            answerWordElement.textContent = correctNextWord;
            correctAnswerElement.style.display = 'block';
            usedWords.push(correctNextWord);
            currentWord = correctNextWord;
        } else {
            correctAnswerElement.style.display = 'none';
        }
        
        // 入力欄をクリア
        inputWord.value = '';
        
        // タイマーをリセット
        startTimer();
    }

    // 履歴に追加
    function addToHistory(word, isValid) {
        const li = document.createElement('li');
        li.textContent = word;
        li.className = isValid ? 'correct' : 'incorrect';
        wordHistory.appendChild(li);
        wordHistory.scrollTop = wordHistory.scrollHeight;
    }

    // ランダムな単語を取得（簡易実装）
    function getRandomWord(startChar) {
        const words = {
            'り': ['りんご', 'りす', 'りゅう'],
            'ご': ['ごま', 'ごりら', 'ごはん'],
            'ま': ['まぐろ', 'まくら', 'まんが'],
            'ら': ['らくだ', 'らっぱ', 'らーめん'],
            'ん': ['ん？終わりです！'],
            // 他の文字に対応する単語を追加
        };
        
        const availableWords = words[startChar] || ['しりとり']; // デフォルト
        return availableWords[Math.floor(Math.random() * availableWords.length)];
    }
});