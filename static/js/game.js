// グローバル変数
let objects = [];
let mouthCircle = null; // 口の中心を表す円オブジェクト
let mouthPosition = { x: 0, y: 0, size: 20 }; // 口の中心座標と大きさ
let score = 0; // スコア
let prevMouthSize = 0; // 前フレームの口の開き具合
const MOUTH_CLOSE_THRESHOLD = 15; // 口を閉じたと判定する閾値
let isMouthOpened = false; // 口が開いているかどうか
let mouthStateChanged = false; // 口の状態が変わったかどうか

// 口の中心座標を更新する関数（script.jsから呼び出される）
function updateMouthPosition(x, y, size) {
    // 前回の口のサイズを保存
    prevMouthSize = mouthPosition.size;
    
    // 新しい座標とサイズを設定
    mouthPosition.x = x;
    mouthPosition.y = y;
    mouthPosition.size = size || 20; // サイズが指定されなければデフォルト値を使用
    
    // 口の開閉状態を判定
    const wasOpened = isMouthOpened; // 前回の状態を記憶
    
    // 前回よりも大きくなったら「開いた」と判定
    if (mouthPosition.size > prevMouthSize + 5) {
        isMouthOpened = true;
        console.log('口が開きました - サイズ:', mouthPosition.size);
    }
    // 開いた状態から一定以下に小さくなったら「閉じた」と判定
    else if (isMouthOpened && mouthPosition.size < MOUTH_CLOSE_THRESHOLD) {
        isMouthOpened = false;
        mouthStateChanged = true; // 口の状態が開から閉に変わった
        console.log('口が閉じました - サイズ:', mouthPosition.size);
    }

    // 口の円オブジェクトが存在しなければ作成
    if (!mouthCircle) {
        mouthCircle = new MouthCircle(x, y, size);
        objects.push(mouthCircle);
    }
    
    // 口の状態に応じて色を変更
    if (mouthCircle) {
        if (isMouthOpened) {
            mouthCircle.color = 'rgba(255, 150, 0, 0.5)'; // 開いているとき：オレンジ色
            mouthCircle.borderColor = 'orange';
        } else {
            mouthCircle.color = 'rgba(0, 255, 0, 0.5)'; // 閉じているとき：緑色
            mouthCircle.borderColor = 'green';
        }
    }
    
    // 口の状態が閉から開、または開から閉に変わったときにデバッグ情報を表示
    if (wasOpened !== isMouthOpened) {
        document.getElementById('status').innerHTML = isMouthOpened ?
            "口が開きました - キャッチの準備OK" : "口が閉じました";
    }
}

// ターゲットを作成する関数
function createTarget(width, height, imagePath) {
    const newTarget = new Target(0, 0, width, height, imagePath);
    objects.push(newTarget);
    return newTarget;
}

// 毎フレーム呼ばれる
function draw(context){
    if (!context) return;

    // 前のフレームをクリア（オプション：script.jsですでに描画している場合は不要）
    // context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // すべてのオブジェクトを更新
    objects.forEach(function(object){
        object.update(); //オブジェクトのupdateメソッドを呼び出す
    });

    // すべてのオブジェクトを描画
    objects.forEach(function(object){
        object.draw(context);
    }); //オブジェクトのdrawメソッドを呼び出す

    // スコア表示
    if (context) {
        context.fillStyle = '#FFFF00';
        context.font = '20px Arial';
        context.fillText(`スコア: ${score}`, 10, 70);
    }
}

const loadImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = event => reject(event);
    image.src = src;
});

class GameObject{
    constructor(x, y, width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    draw(){
        //this.x, this.y, this.width, this.heightを使って描画する
    }

    update(){
        //this.x, this.y, this.width, this.heightを使って更新する
    }
}

class MouthCircle extends GameObject {
    constructor(x, y, size) {
        super(x, y, size * 2, size * 2); // 直径をwidth, heightとして使用
        this.radius = size;
        this.color = 'rgba(0, 255, 0, 0.5)'; // 半透明の緑色
        this.borderColor = 'green';
        this.borderWidth = 2;
    }

    draw(context) {
        if (!context) return;

        // 口の位置に円を描画
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.strokeStyle = this.borderColor;
        context.lineWidth = this.borderWidth;
        context.stroke();
    }

    update() {
        // 口の位置に追従
        this.x = mouthPosition.x;
        this.y = mouthPosition.y;
        this.radius = mouthPosition.size;
        this.width = this.radius * 2;
        this.height = this.radius * 2;
    }
}

class Target extends GameObject {
    constructor(x, y, width, height, imagePath) {
        super(x, y, width, height);
        this.imagePath = imagePath;
        this.loaded = false;
        this.image = null;

        // 画像の読み込み
        if (imagePath) {
            loadImage(imagePath).then(img => {
                this.image = img;
                this.loaded = true;
            }).catch(err => {
                console.error('画像の読み込みに失敗:', err);
            });
        }

        // 初期位置の設定
        this.y = -10;
        this.x = Math.floor(Math.random() * (canvasElement.width - this.width));
        this.speed = Math.floor(Math.random() * 5) + 1; // 1から5のランダムな速度
    }

    draw(context) {
        if (!context) return;

        // 画像が読み込まれていれば描画
        if (this.loaded && this.image) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 画像がなければ代わりに矩形を描画
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update() {
        // 下に移動
        this.y += this.speed;

        // 画面外に出たら上に戻す
        if (this.y > canvasElement.height) {
            this.y = -this.height;
            this.x = Math.floor(Math.random() * (canvasElement.width - this.width));
        }

        // 口との当たり判定（口の円と重なっているか）
        if (mouthCircle) {
            const dx = (this.x + this.width/2) - mouthCircle.x;
            const dy = (this.y + this.height/2) - mouthCircle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 当たり判定（簡易版：中心点の距離がターゲットの半径と口の半径の和より小さければ衝突）
            const isColliding = distance < (Math.min(this.width, this.height) / 2 + mouthCircle.radius);
            
            // 衝突チェック - 2つの条件のいずれかで捕獲可能
            // 1. 口が開いた状態から閉じた瞬間に衝突
            // 2. マウスモード時にクリックして口が最大に開いたとき
            const mouthJustClosed = !isMouthOpened && mouthStateChanged && prevMouthSize > MOUTH_CLOSE_THRESHOLD;
            const mouthWideOpen = isMouthOpened && mouthPosition.size > 25; // 口が大きく開いている
            
            if (isColliding && (mouthJustClosed || mouthWideOpen)) {
                console.log('ターゲットを捕獲！口のサイズ:', mouthPosition.size);
                mouthStateChanged = false; // フラグをリセット
                
                // 衝突時の処理
                score++; // スコアを増加
                
                // スコア表示を更新（存在する場合）
                const scoreDisplay = document.getElementById('score-display');
                if (scoreDisplay) {
                    scoreDisplay.textContent = score;
                }
                
                // 効果音を鳴らす（オプション）
                /*
                const audio = new Audio('sound/catch.mp3');
                audio.play().catch(e => console.log('効果音の再生に失敗:', e));
                */
                
                // ターゲットをリセット
                this.y = -this.height;
                this.x = Math.floor(Math.random() * (canvasElement.width - this.width));
                
                // 速度を少し上げる（難易度増加）
                this.speed = Math.min(this.speed + 0.2, 10); // 最大速度は10に制限
                
                // 視覚的なフィードバック
                if (canvasElement && canvasElement.style) {
                    canvasElement.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
                    setTimeout(() => {
                        canvasElement.style.backgroundColor = 'transparent';
                    }, 100);
                    
                    // 状態表示の更新
                    const statusElement = document.getElementById('status');
                    if (statusElement) {
                        statusElement.innerHTML = `キャッチ成功！スコア: ${score}`;
                        statusElement.style.color = '#FFFF00';
                        setTimeout(() => {
                            statusElement.style.color = '#FFFFFF';
                        }, 500);
                    }
                }
            }
        }
    }
}