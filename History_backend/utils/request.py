import requests

def send_request(headers, payload, service):
    if service == "ChatGPT":
        url = "https://api.chatanywhere.org/v1/chat/completions"
    elif service == "Doubao":
        url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=500
            )
        return response
    except requests.exceptions.RequestException as e:
        return None