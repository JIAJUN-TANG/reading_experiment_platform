from openai import OpenAI

def send_request(payload, service):
    try:
        if service == "ChatGPT":
            client = OpenAI(
                api_key="sk-SkV6Leve2mXaej9lNP6VMuhugmbC2B6J6x8ASVQutg50hQt1",
                base_url="https://api.chatanywhere.org/v1"
            )
        # elif service == "Doubao":
        #     client = OpenAI(
        #         api_key="af32cad5-249b-4518-b5f8-46103b2c82c3",
        #         base_url="https://ark.cn-beijing.volces.com/api/v3"
        #     )
        
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