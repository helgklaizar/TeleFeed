import sys
import asyncio
from datetime import datetime, timezone
import os
import traceback
import json
import subprocess
from telethon import TelegramClient

api_id = 39315132
api_hash = '2c27daddebf6ad26c8640e6d3f8a8d27'
client = TelegramClient('session_name_final', api_id, api_hash)

async def main():
    try:
        await client.connect()
        if not await client.is_user_authorized():
            print("Сессия не авторизована.")
            return

        cutoff = datetime(2026, 3, 1, tzinfo=timezone.utc)
        found_posts = []

        print("Получаю список всех диалогов...")
        dialogs = await client.get_dialogs(limit=400)
        
        ai_groups = []
        for d in dialogs:
            if d.is_group:
                title = d.title.lower() if d.title else ""
                if 'ии' in title or 'ai' in title or 'нейро' in title or 'gpt' in title or 'llm' in title or 'chat' in title or 'агент' in title:
                    ai_groups.append(d.entity)
        
        print(f"Найдено {len(ai_groups)} подходящих чатов/групп для проверки.")

        for entity in ai_groups:
            try:
                title = getattr(entity, 'title', str(getattr(entity, 'id', 'Unknown')))
                print(f"-> Сканирую группу: {title}...")
                
                count = 0
                async for msg in client.iter_messages(entity, limit=2000):
                    if msg.date < cutoff:
                        break
                    
                    if getattr(msg, 'action', None):
                        continue # Пропускаем системные сообщения (вступил в чат и тд)
                        
                    if msg.text:
                        tl = msg.text.lower()
                        # Ищем советы, ссылки или упоминания гитхаба/mcp/агентов
                        if ('http' in tl or 'github.com' in tl or 'совет' in tl or 'попробуй' in tl or 'рекомендую' in tl or 'mcp' in tl or 'фреймворк' in tl or 'framework' in tl):
                            if len(msg.text) > 40: # Исключаем очень короткие ответы "попробуй это"
                                found_posts.append({
                                    "title": title,
                                    "url": f"https://t.me/c/{getattr(entity, 'id', 0)}/{msg.id}",
                                    "date": msg.date.strftime('%Y-%m-%d'),
                                    "text": msg.text.replace("\n\n", "\n")
                                })
                                count += 1
                print(f"   Извлечено {count} полезных сообщений.")
            except Exception as e:
                print(f"Ошибка чтения группы {getattr(entity, 'title', 'Unknown')}: {e}")
                continue
                
        print(f"\nСохраняю {len(found_posts)} сообщений в Markdown...")
        with open('group_articles.md', 'w', encoding='utf-8') as f:
            f.write("# Полезное из ИИ Групп (Март 2026)\n\n")
            for p in found_posts:
                f.write(f"### Чат: {p['title']} [{p['date']}]\nURL: {p['url']}\n{p['text']}\n\n---\n\n")
                
        print(f"Пишу в AI Radar БД...")
        radar_script = os.path.expanduser("~/.gemini/tools/ai-radar/radar.py")
        
        inserted = 0
        for p in found_posts:
            json_str = json.dumps({
                'url': p['url'], 
                'title': f"Совет из: {p['title']} ({p['date']})", 
                'tags': 'AI Chat Insight', 
                'category': 'Concept', 
                'usefulness': 8, 
                'our_use_case': 'Expert tip from TG Community'
            })
            res = subprocess.run(['python', radar_script, 'add', json_str], capture_output=True, text=True)
            if "Successfully" in res.stdout:
                inserted += 1
                
        print(f"Готово! Извлечено {len(found_posts)} полезных инсайтов, {inserted} добавлено в БД AI Radar.")

    except Exception as e:
        print("КРИТИЧЕСКАЯ ОШИБКА:")
        traceback.print_exc()

with client:
    client.loop.run_until_complete(main())
