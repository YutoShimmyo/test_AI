import os

def find_matching_pngs(keywords, folder_path):
    # フォルダ内のファイル一覧を取得
    files_in_folder = os.listdir(folder_path)
    
    # pngファイルだけ抽出
    png_files = [f for f in files_in_folder if f.endswith('.png')]
    
    # マッチするファイルを探す
    matched_files = []
    for keyword in keywords:
        filename = f"{keyword}.png"
        if filename in png_files:
            matched_files.append(os.path.join(folder_path, filename))
    
    return matched_files

# # 使用例
# keywords = ["pig", "wheat"]
# folder_path = r"C:\gittopython\test_AI\datasets"
# result = find_matching_pngs(keywords, folder_path)

# print(result)  # マッチしたファイルのフルパスをリストで表示
