# src/services/AIAssistant.py
from gigachat import GigaChat
import logging
import json
from typing import List, Dict, Optional
from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError

class AIService:
    def __init__(self, credentials: str):
        self.credentials = credentials

    async def _get_bot_config(self, session) -> Dict:
        try:
            from src.models.bot_config import BotConfig
            
            result = await session.execute(select(BotConfig).where(BotConfig.id == 1))
            config = result.scalar_one_or_none()
            
            if config and config.blocks:
                blocks = json.loads(config.blocks)
                return {"blocks": blocks}
            return {"blocks": []}
            
        except ProgrammingError as e:
            logging.warning(f"Bot config table not found: {e}")
            return {"blocks": []}
        except Exception as e:
            logging.error(f"Error loading bot config: {e}")
            return {"blocks": []}

    def _build_system_instruction(self, config_blocks: List[Dict]) -> str:
        instruction = """Ты — официальный ИИ-помощник рекламной компании CraftSigns.

## ОБЛАСТЬ КОМПЕТЕНЦИИ:
- Ты специализируешься ТОЛЬКО на рекламном производстве: вывески, световые короба, объёмные буквы, баннеры, таблички, монтаж и демонтаж рекламных конструкций.
- Приветствия и вежливые реплики ("привет", "здравствуйте", "добрый день", "спасибо", "пока" и т.д.) — отвечай дружелюбно и кратко, затем предложи помощь по услугам CraftSigns.
- На вопросы НЕ по теме (еда, погода, политика, другие товары и услуги, общие советы и т.д.) ВСЕГДА отвечай ТОЛЬКО так: "Я специализируюсь только на рекламных конструкциях и вывесках CraftSigns. Чем могу помочь по нашим услугам?" — и не отвечай по существу вопроса не по теме.

## ГЕОГРАФИЯ РАБОТЫ:
- Мы работаем ТОЛЬКО в Москве и Московской области.
- Заказы из других регионов не принимаем и не осуществляем доставку за пределы Московского региона.
- Если клиент из другого города/региона — вежливо сообщи об ограничении.

## ПРАВИЛА ОТВЕТОВ:
1. Отвечай ТОЛЬКО на вопросы, связанные с услугами CraftSigns и рекламным производством.
2. Если в разделе ПРАЙС-ЛИСТЫ И УСЛУГИ есть конкретные цены — называй их точно. ЗАПРЕЩЕНО говорить "цена варьируется" или "рассчитывается индивидуально", если конкретная цена указана в прайс-листе.
3. Будь вежливым и профессиональным.
4. Если клиент спрашивает цену, которой нет в прайс-листах, скажи что менеджер уточнит детали.
5. Отвечай на русском языке, чётко и по делу.

## КОНТАКТЫ:
- Находимся: г. Москва, ул. Остаповский пр-д, д. 13
- Работаем только в Москве и Московской области
- Для точного расчёта свяжитесь с менеджером через форму на сайте
"""

        if not config_blocks:
            return instruction

        custom_sections = []
        for block in config_blocks:
            block_type = block.get("type", "").lower()
            content = block.get("content", "")

            if content.strip():
                custom_sections.append(f"\n### {block_type.upper()}:\n{content}")

        if custom_sections:
            instruction += (
                "\n## ПРАЙС-ЛИСТЫ И УСЛУГИ"
                " (ПРИОРИТЕТНЫЙ ИСТОЧНИК — ВСЕГДА ОПИРАЙСЯ ИМЕННО НА ЭТИ ДАННЫЕ):\n"
                + "\n".join(custom_sections)
            )

        return instruction

    async def get_answer(self, user_text: str, session, history: list = None) -> str:
        
        try:
            config_blocks = []
            try:
                config_data = await self._get_bot_config(session)
                config_blocks = config_data.get("blocks", [])
            except Exception as e:
                logging.warning(f"Could not load bot config, using defaults: {e}")
            
            system_instruction = self._build_system_instruction(config_blocks)
            
            async with GigaChat(
                credentials=self.credentials, 
                scope="GIGACHAT_API_PERS", 
                verify_ssl_certs=False, 
                timeout=30
            ) as giga:
                messages = [{"role": "system", "content": system_instruction}]
                
                if history:
                    messages.extend(history[-10:])
                
                messages.append({"role": "user", "content": user_text})
                
                payload = {
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
                
                response = await giga.achat(payload)
                return response.choices[0].message.content
                
        except Exception as e:
            logging.error(f"GigaChat Error: {e}")
            return "Извините, сейчас возникла техническая проблема. Пожалуйста, свяжитесь с нашим менеджером по телефону или оставьте заявку на сайте, и мы обязательно вам поможем!"