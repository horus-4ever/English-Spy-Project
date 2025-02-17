from flask import Blueprint, render_template, request, session, redirect, flash
from app.services.users_service import user_auth, username_taken, create_user

bp = Blueprint('login', __name__)

@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    else:
        username: str = request.form["username"]
        password: str = request.form["password"]
        if (id := user_auth(username, password)) is not None:
            session["user_id"] = id
            return redirect("/account")
        else:
            flash("Invalid username or password", "error")
            return redirect("/login")


@bp.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")
    else:
        username: str = request.form["username"]
        password: str = request.form["password"]
        if username_taken(username):
            flash(f"The username '{username}' is already taken", "error")
            return redirect("/signup")
        else:
            create_user(username, password)
            return redirect("/login")