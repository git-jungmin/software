from modules.user.model import User
from db import db
import bcrypt

def create_user(username, password):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(username=username, password=hashed)
    db.session.add(user)
    db.session.commit()

def find_user_by_username(username):
    return User.query.filter_by(username=username).first()