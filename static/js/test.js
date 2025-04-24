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

        const data = await response.json();
        if (data.image) {
            const imageUrl = `data:image/png;base64,${data.image}`;
            displayElements.wordImage.src = imageUrl;
            displayElements.wordImage.style.display = 'block';
        } else {
            throw new Error('画像データが含まれていません');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('画像生成中にエラーが発生しました: ' + error.message);
        displayElements.wordImage.style.display = 'none';
    }
}
