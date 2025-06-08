# modules/game/router.py

from flask import Blueprint, request, jsonify
from modules.user.model import User
from modules.game import crud
from db import db
import jwt
from config import Config

game_bp = Blueprint("game", __name__)

@game_bp.route("/result", methods=["POST"])
def submit_game_result():
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(payload["id"])
        if not user:
            return jsonify({"error": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    players = data.get("players")
    win = data.get("win")

    if players is None or win is None:
        return jsonify({"error": "Missing players or win field"}), 400

    win_rate = crud.update_game_result(user.id, players, win)

    return jsonify({"win_rate": win_rate})