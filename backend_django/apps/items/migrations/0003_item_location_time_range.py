from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("items", "0002_matchresult_feedback_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="incident_from",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="incident_to",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="location_from",
            field=models.CharField(blank=True, max_length=240),
        ),
        migrations.AddField(
            model_name="item",
            name="location_to",
            field=models.CharField(blank=True, max_length=240),
        ),
    ]
