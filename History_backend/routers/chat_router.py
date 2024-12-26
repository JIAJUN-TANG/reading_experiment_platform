from fastapi import APIRouter
from openai import OpenAI
from schemas import ChatRequest

chat_router = APIRouter()

@chat_router.post("/Chat/")
async def chat_endpoint(request: ChatRequest):
    client = OpenAI(api_key="sk-e3128b85d8e642199f51c4980cd6c855", base_url="https://api.deepseek.com")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "system", "content": "你是一个历史学家，你负责回答用户的问题，并且给出详细的解释和分析。"},
                  {"role": "assistant", "content": request.assistant_message},
                  {"role": "user", "content": request.user_message}],
        stream=False,
        temperature=0.6
    )
    return response.choices[0].message.content