import bcrypt

def verify_password(plain_pw, hashed_pw):
    return bcrypt.checkpw(plain_pw.encode(), hashed_pw.encode())