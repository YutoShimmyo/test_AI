objects = [];
//ゲームオブジェクトの配列を作成する

//毎フレーム呼ばれる
function draw(){

    objects.forEach(function(object){
        object.update(); //オブジェクトのupdateメソッドを呼び出す  
    });

    objects.forEach(function(object){
        object.draw();
    }); //オブジェクトのdrawメソッドを呼び出す
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

class Tartget extends GameObject{
    constructor(x, y, width, height, imagePath){
        super(x, y, width, height);
        this.image = loadImage(imagePath);
    }
    draw(){
        //this.x, this.y, this.width, this.heightを使って描画する
    }

    update(){
        //this.x, this.y, this.width, this.heightを使って更新する
    }
}
    }
    draw(){
        //this.x, this.y, this.width, this.heightを使って描画する
    }

    update(){
        //this.x, this.y, this.width, this.heightを使って更新する
    }
}