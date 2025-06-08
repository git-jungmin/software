# modules/game/model.py

from db import db

class GameResult(db.Model):
    __tablename__ = "game_result"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    total_games = db.Column(db.Integer, default=0)
    wins = db.Column(db.Integer, default=0)

    user = db.relationship("User", back_populates="game_results")