/*window.addEventListener('DOMContentLoaded', async () => {
    await setup();
  });*/
document.getElementById('to-camera-screen').addEventListener('click', async () => {
    await setup();
});
  
async function setup() {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

    // モデル読み込み
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const context = canvas.getContext('2d');

    // カメラ起動
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => { video.srcObject = stream; })
        .catch(err => console.error('カメラにアクセスできません:', err));

    video.addEventListener('play', () => {
        const detect = async () => {
            const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
            });
            
            const detection = await faceapi
            .detectSingleFace(video, options)
            .withFaceLandmarks();
            
            console.log('Detection result:', detection);
            
            if (detection) {
            const resizedDetection = faceapi.resizeResults(detection, {
                width: video.width,
                height: video.height
            });
        
            // ★ ここで mouth のポイントだけ抜き出す
            const allLandmarks = resizedDetection.landmarks.positions; // ←ここ重要！
            const mouth = allLandmarks.slice(48, 68); // ←口は48～67番！
        
            console.log('Mouth landmarks:', mouth);
            context.clearRect(0, 0, canvas.width, canvas.height);
            if (mouth && mouth.length > 0) {
                const xs = mouth.map(p => p.x);
                const ys = mouth.map(p => p.y);
                const minX = Math.min(...xs);
                const minY = Math.min(...ys);
                const maxX = Math.max(...xs);
                const maxY = Math.max(...ys);
            
                const width = maxX - minX;
                const height = maxY - minY;
            
                context.beginPath();
                context.lineWidth = 3;
                context.strokeStyle = 'red';
                context.rect(minX, minY, width, height);
                context.stroke();
            }
            
            }
            
            requestAnimationFrame(detect);
                
        };
        detect();
        //context.fillStyle = 'red';
        //context.fillRect(5, 10, 200, 300);
    });
}