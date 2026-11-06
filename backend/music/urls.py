from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health),
    path("overview/", views.overview),
    path("comparisons/", views.comparisons),
    path("history/", views.history),
    path("imports/status/", views.imports_status),
    path("imports/run/", views.scan_import),
    path("<str:entity>/", views.rankings),
]
