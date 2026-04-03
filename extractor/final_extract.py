import sys
from telethon.sync import TelegramClient
from telethon.errors import SessionPasswordNeededError

api_id = 39315132
api_hash = '2c27daddebf6ad26c8640e6d3f8a8d27'
phone_number = '+972544861227'

client = TelegramClient('session_name_final', api_id, api_hash)
client.start(phone=phone_number)

print("Авторизация прошла! Идет выгрузка статей...")
messages = client.get_messages('me', limit=2000)
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
        
print(f"Готово! Извлечено статей: {len(ai_msgs)}")
