from flask import Blueprint, render_template, request, session, redirect, flash
from app.models.user import User
from app.services.users_service import get_user_by_id
from app.utils import require_auth

bp = Blueprint('user', __name__)

@bp.route("/account", methods=["GET"])
@require_auth
def account():
    user_id: id = session["user_id"]
    user: User = get_user_by_id(user_id)
    return render_template("account.html", user=user)
