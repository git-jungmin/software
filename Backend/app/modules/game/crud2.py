# modules/game/crud.py

from modules.game.model import GameResult
from db import db

def update_game_result(user_id: int, players: int, win: bool) -> float:
    result = GameResult.query.filter_by(user_id=user_id).first()

    if not result:
        result = GameResult(user_id=user_id, total_games=0, wins=0)  # ✅ 명시적 초기화
        db.session.add(result)

    if result.total_games is None:
        result.total_games = 0
    if result.wins is None:
        result.wins = 0

    if players >= 2:
        result.total_games += 1
        if win:
            result.wins += 1

    db.session.commit()

    if result.total_games == 0:
        return 0.0
    return round(result.wins / result.total_games, 2)