from flask import Blueprint, request, jsonify
import jwt
from config import Config
from modules.user.model import User

user_bp = Blueprint("user", __name__)

@user_bp.route("/me", methods=["GET"])
def me():
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    token = auth.split(" ")[1]

    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(payload["id"])
        if user:
            return jsonify({"user": {"id": user.id, "username": user.username}})
        else:
            return jsonify({"error": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401