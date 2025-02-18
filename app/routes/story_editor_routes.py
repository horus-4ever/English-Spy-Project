from flask import Blueprint, render_template, request, session, redirect, flash
from app.utils import require_auth

bp = Blueprint('story_editor', __name__, url_prefix="/editor")

@bp.route("/<int:story_id>", methods=["GET"])
@require_auth
def editor(story_id: int):
    """
    This route will render the visual story editor for a specific story.
    """
    return render_template("story_editor.html", story_id=story_id)
