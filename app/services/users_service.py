from app.models import User
from app.extensions import bcrypt, db


def get_user_by_id(user_id: int) -> object:
    """Retrieve a user by ID"""
    user: User | None = User.query.get(user_id)
    return user.serialize()


def update_user_progress(user_id: int, story_node_id: int) -> object:
    """Update the progression of a user in a story"""
    pass


def create_user(username: str, password: str) -> object:
    """Creates a new user"""
    password_hash = bcrypt.generate_password_hash(password)
    user: User = User(username=username, password=password_hash)
    db.session.add(user)
    db.session.commit()


def delete_user(user_id: int) -> object:
    """Delete a user by ID"""
    User.query.filter(User.id == user_id).delete()


def user_auth(username: str, password: str) -> int | None:
    """Check if the user exists"""
    user: User = (User.query
        .filter(User.username == username)
        .one_or_none())
    if user is not None and bcrypt.check_password_hash(user.password, password):
        return user.id
    
def username_taken(username: str) -> bool:
    """Check if the username is already taken or not"""
    count: int = User.query.filter(User.username == username).count()
    return count != 0
