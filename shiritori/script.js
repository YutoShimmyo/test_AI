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

    let currentWord = 'エーアイトシリトリ';
    let timer;
    let timeLeft = 60;
    let usedWords = [currentWord];
    let gameActive = false;
    const wordImage = document.getElementById('word-image');

    // 単語から絵を取得して表示
    async function fetchWordImage(word) {
        try {
            const response = await fetch('http://localhost:5000/get_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word: word })
            });
            
            if (!response.ok) throw new Error('絵の取得に失敗しました');
            
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            wordImage.src = imageUrl;
            wordImage.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            wordImage.style.display = 'none';
        }
    }

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
            // カタカナチェック
            const katakanaRegex = /^[\u30A0-\u30FF]+$/;
            if (!katakanaRegex.test(userAnswer)) {
                resultElement.textContent = 'カタカナで入力してください';
                resultElement.className = 'incorrect';
                inputWord.value = '';
                return;
            }

            // しりとりのルールチェック
            const lastChar = currentWord.slice(-1);
            const firstChar = userAnswer.charAt(0);
            
            // 「ん」で終わる単語はNG
            if (userAnswer.slice(-1) === 'ン') {
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