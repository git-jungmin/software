from dataclasses import dataclass

@dataclass
class UserCreate:
    username: str
    password: str

@dataclass
class UserOut:
    id: int
    username: str