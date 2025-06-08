# app/modules/auth/router.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from modules.user.crud import create_user, find_user_by_username
from modules.auth.crud import verify_password
from config import Config
import jwt

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
@cross_origin(origins="http://127.0.0.1:5500", supports_credentials=True)
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if find_user_by_username(username):
        return jsonify({"error": "User already exists"}), 409

    create_user(username, password)
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
@cross_origin(origins="http://127.0.0.1:5500", supports_credentials=True)
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = find_user_by_username(username)

    if user and verify_password(password, user.password):
        payload = {"id": user.id, "username": user.username}
        token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")
        return jsonify({"token": token})

    return jsonify({"error": "Invalid credentials"}), 401