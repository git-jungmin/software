from flask import Flask
from flask_cors import CORS
from config import Config
from db import db
from modules.auth.router import auth_bp
from modules.user.router import user_bp
from modules.game.router import game_bp

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

# ✅ CORS 허용 범위 명시적으로 설정 (개발용: 전체 허용)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://127.0.0.1:5500"}})

# Blueprint 등록
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(user_bp, url_prefix="/user")
app.register_blueprint(game_bp, url_prefix="/game")

# 앱 실행
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)