"""Template-based views for users pages."""

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from users.application import auth_service
from users.identity import ensure_profile

from .forms import EmailRegisterForm, ProfileUpdateForm, UserUpdateForm


def register(request):
    """Регистрирует данные.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    if request.method == "POST":
        form = EmailRegisterForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get("email", "")
            local = (email.split("@", 1)[0] if "@" in email else email).strip().lower() or "user"
            auth_service.register_user(
                login=local,
                password=form.cleaned_data.get("password1", ""),
                password_confirm=form.cleaned_data.get("password2", ""),
                name=local,
                username=None,
                email=email,
            )
            email = form.cleaned_data.get("email", "")
            messages.success(request, f"{email} has been created!")
            return redirect("login")
    else:
        form = EmailRegisterForm()

    return render(request, "users/register.html", {"form": form})


@login_required
def profile(request):
    """Вспомогательная функция `profile` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    profile_obj = ensure_profile(request.user)

    if request.method == "POST":
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile_obj)

        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, "Your account has been updated")
            return redirect("profile")
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=profile_obj)

    context = {
        "u_form": u_form,
        "p_form": p_form,
    }
    return render(request, "users/profile.html", context)
