from flask import Blueprint, render_template, request, session, redirect, flash
from typing import Callable
import functools

def require_auth(function: Callable):
    @functools.wraps(function)
    def __inner(*args, **kwargs):
        if session.get("user_id") is not None:
            return function(*args, **kwargs)
        else:
            return redirect("/login")
    return __inner