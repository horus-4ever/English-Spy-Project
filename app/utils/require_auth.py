from flask import Blueprint, render_template, request, session, redirect, flash
from typing import Callable

def require_auth(function: Callable):
    def __inner(*args, **kwargs):
        if session.get("user_id") is not None:
            return function(*args, **kwargs)
    return __inner