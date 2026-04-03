from telethon.sync import TelegramClient
import sys

api_id = 39315132
api_hash = '2c27daddebf6ad26c8640e6d3f8a8d27'

client = TelegramClient('session_name', api_id, api_hash)

async def main():
    print("Получаем сообщения из Избранного (Saved Messages)...")
    messages = await client.get_messages('me', limit=1000)
    ai_msgs = []
    
    for msg in messages:
        if msg.text:
            text_lower = msg.text.lower()
            if 'ии' in text_lower or ' ai' in text_lower or 'нейросеть' in text_lower or 'llm' in text_lower:
                ai_msgs.append(msg.text)
                
    with open('/Users/klai/AI/TeleFeed/extractor/ai_articles.md', 'w', encoding='utf-8') as f:
        f.write("# Статьи про ИИ из Избранного\n\n")
        for m in reversed(ai_msgs):
            f.write(m + "\n\n---\n\n")
            
    print(f"Готово! Извлечено сообщений/статей: {len(ai_msgs)}")

with client:
    client.loop.run_until_complete(main())
