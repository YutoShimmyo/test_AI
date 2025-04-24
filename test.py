import requests

response = requests.post(
    f"https://api.stability.ai/v2beta/stable-image/generate/ultra",
    headers={
        "authorization": f"Bearer sk-yQ3k3LvX193SwaWw4kQvvVwHPnxfJcbpxzj1NWxReDDSdy9B",
        "accept": "image/*"
    },
    files={"none": ''},
    data={
        "prompt": "a pig with wings and a top hat flying over a happy futuristic scifi city with lots of greenery",
        "output_format": "png",
    },
)

if response.status_code == 200:
    with open("./pig.png", 'wb') as f:
        f.write(response.content)
else:
    raise Exception(f"Error: {response.status_code}, {response.text}") 
