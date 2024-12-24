from openai import OpenAI

def send_request(headers, payload):
    try:
        client = OpenAI(
            api_key=headers.get("Authorization").replace("Bearer ", ""),
            base_url="https://api.chatanywhere.org/v1"
        )
        
        response = client.chat.completions.create(
            model=payload["model"],
            messages=payload["messages"],
            top_p=payload.get("top_p", 1),
            temperature=payload.get("temperature", 0),
            frequency_penalty=payload.get("frequency_penalty", 0),
            presence_penalty=payload.get("presence_penalty", 0)
        )
        return response
    except Exception as e:
        print(f"Error occurred: {e}")
        return None