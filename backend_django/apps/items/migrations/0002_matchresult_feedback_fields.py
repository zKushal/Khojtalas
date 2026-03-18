from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("items", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="matchresult",
            name="feedback_status",
            field=models.CharField(
                choices=[("pending", "pending"), ("recovered", "recovered"), ("incorrect", "incorrect")],
                default="pending",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="matchresult",
            name="resolved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
