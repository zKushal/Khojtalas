from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (("user", "user"), ("admin", "admin"))
    TRUST_CHOICES = (("new", "new"), ("verified", "verified"), ("trusted", "trusted"))

    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="user")
    trust_level = models.CharField(max_length=16, choices=TRUST_CHOICES, default="new")
    two_fa_enabled = models.BooleanField(default=False)
    two_fa_secret = models.CharField(max_length=64, blank=True)

    @property
    def full_name(self):
        return self.get_full_name() or self.username
