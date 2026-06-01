import sys
from datetime import datetime, timezone
import os
import traceback
import json
import subprocess  # nosec B404
from typing import List, Dict, Any
from telethon import TelegramClient
from telethon.tl.functions.messages import GetDialogFiltersRequest

api_id = 39315132
api_hash = '2c27daddebf6ad26c8640e6d3f8a8d27'
client = TelegramClient('session_name_final', api_id, api_hash)

async def get_folder_peers(folder_query: str = 'AI') -> list:
    """Ищет папку с подходящим именем и возвращает ее пиры, либо последние 15 диалогов."""
    filters = await client(GetDialogFiltersRequest())
    ai_folder = None
    for f in filters.filters:
        if hasattr(f, 'title'):
            title_str = getattr(f.title, 'text', str(f.title))
            if 'ИИ' in title_str or 'AI' in title_str or 'Ai' in title_str:
                ai_folder = f
                break

    if not ai_folder:
        print("Не нашел папку 'ИИ' или 'AI'. Беру последние 15 каналов.")
        dialogs = await client.get_dialogs(limit=15)
        return [d.entity for d in dialogs if d.is_channel][:15]

    print(f"Сканирую папку: {getattr(ai_folder.title, 'text', str(ai_folder.title))}")
    return list(ai_folder.include_peers)

async def scan_channels(peers_to_check: list, cutoff: datetime) -> List[Dict[str, Any]]:
    """Сканирует каналы на наличие полезных постов."""
    found_posts: List[Dict[str, Any]] = []

    for peer in peers_to_check:
        try:
            entity = await client.get_entity(peer)
            title = getattr(entity, 'title', str(getattr(entity, 'id', 'Unknown')))
            print(f"-> Канал: {title}...")
            
            count = 0
            async for msg in client.iter_messages(entity, limit=500):
                if msg.date < cutoff:
                    break
                if msg.text:
                    tl = msg.text.lower()
                    if ('github.com' in tl or 'mcp' in tl or 'агент' in tl or 'фреймворк' in tl or 'framework' in tl):
                        found_posts.append({
                            "title": title,
                            "url": f"https://t.me/c/{getattr(entity, 'id', 0)}/{msg.id}",
                            "date": msg.date.strftime('%Y-%m-%d'),
                            "text": msg.text.replace("\n\n", "\n")
                        })
                        count += 1
            print(f"   Найдено {count} полезных постов.")
        except Exception as e:
            print(f"Ошибка канала: {e}")
            continue

    return found_posts

def save_markdown(found_posts: List[Dict[str, Any]], filename: str = 'folder_articles.md') -> None:
    """Сохраняет найденные посты в Markdown файл."""
    print(f"Сохраняем {len(found_posts)} постов в файл...")
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("# Посты из папки ИИ (Фев-Март 2026)\n\n")
        f.write(f"Найдено: {len(found_posts)} интересных ссылок.\n\n---\n")
        for p in found_posts:
            f.write(f"### {p['title']} [{p['date']}]\nURL: {p['url']}\n{p['text']}\n\n---\n\n")
    print("Готово! Markdown сохранен.")

def add_to_radar(found_posts: List[Dict[str, Any]]) -> None:
    """Отправляет посты в базу данных AI Radar."""
    script_path = os.path.expanduser("~/.gemini/tools/ai-radar/radar.py")
    if not os.path.exists(script_path):
        print(f"Radar script not found at {script_path}. Skipping DB insertion.")
        return

    for p in found_posts:
        payload = json.dumps({
            'url': p['url'],
            'title': p['title'] + ' // ' + p['date'],
            'tags': 'AI Channel Output',
            'category': 'Article',
            'usefulness': 8,
            'our_use_case': 'Batch extracted'
        })
        subprocess.run([sys.executable, script_path, "add", payload], check=False)  # nosec B603

async def main() -> None:
    try:
        if not await client.is_user_authorized():
            print("Сессия не авторизована.")
            return

        peers_to_check = await get_folder_peers()
        print(f"Всего каналов для проверки: {len(peers_to_check)}")

        cutoff = datetime(2026, 2, 1, tzinfo=timezone.utc)
        found_posts = await scan_channels(peers_to_check, cutoff)

        if not found_posts:
            print("Не найдено новых полезных постов.")
            return

        save_markdown(found_posts)
        add_to_radar(found_posts)

    except Exception:
        print("КРИТИЧЕСКАЯ ОШИБКА:")
        traceback.print_exc()

with client:
    client.loop.run_until_complete(main())

