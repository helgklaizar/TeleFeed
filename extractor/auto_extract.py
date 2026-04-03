import sys
import asyncio
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

api_id = 39315132
api_hash = '2c27daddebf6ad26c8640e6d3f8a8d27'
client = TelegramClient('session_name_auto', api_id, api_hash)

async def request_code(phone):
    await client.connect()
    if not await client.is_user_authorized():
        await client.send_code_request(phone)
        print("CODE_SENT")
    else:
        print("ALREADY_AUTHORIZED")

async def submit_code(phone, code, pwd=None):
    await client.connect()
    if not await client.is_user_authorized():
        try:
            if pwd:
                await client.sign_in(password=pwd)
            else:
                await client.sign_in(phone=phone, code=code)
            print("AUTHORIZED")
        except SessionPasswordNeededError:
            print("PASSWORD_NEEDED")
            return
        except Exception as e:
            print(f"ERROR: {e}")
            return
            
    if await client.is_user_authorized():
        print("Идет выгрузка статей...")
        messages = await client.get_messages('me', limit=2000)
        ai_msgs = []
        for msg in messages:
            if msg.text:
                text_lower = msg.text.lower()
                if 'ии' in text_lower or ' ai ' in text_lower or 'ai,' in text_lower or 'нейросеть' in text_lower or 'llm' in text_lower or 'агент' in text_lower:
                    ai_msgs.append(msg.text)
        with open('/Users/klai/AI/TeleFeed/extractor/ai_articles.md', 'w', encoding='utf-8') as f:
            f.write("# Статьи про ИИ из Избранного\n\n")
            for m in reversed(ai_msgs):
                f.write(m + "\n\n---\n\n")
        print(f"Готово! Сохранено статей: {len(ai_msgs)}")

if __name__ == "__main__":
    if sys.argv[1] == 'request':
        client.loop.run_until_complete(request_code(sys.argv[2]))
    elif sys.argv[1] == 'submit':
        pwd = sys.argv[4] if len(sys.argv) > 4 else None
        client.loop.run_until_complete(submit_code(sys.argv[2], sys.argv[3], pwd))
