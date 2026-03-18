import json
from difflib import SequenceMatcher
from decimal import Decimal
from apps.items.models import Item, MatchResult
from apps.notifications.models import Notification


def suggest_category_from_description(description: str) -> str:
    text = (description or "").lower()
    if any(k in text for k in ["phone", "laptop", "tablet", "camera", "imei", "samsung", "iphone"]):
        return "Gadget"
    if any(k in text for k in ["ring", "necklace", "bracelet", "diamond", "gold", "silver"]):
        return "Jewelry"
    if "wallet" in text:
        return "Wallet"
    if any(k in text for k in ["passport", "license", "citizenship", "certificate"]):
        return "Documents"
    if any(k in text for k in ["bag", "backpack", "handbag"]):
        return "Bags"
    if "key" in text:
        return "Keys"
    return "Others"


def _normalize_feature_blob(item: Item) -> str:
    data = item.feature_data or {}
    try:
        return json.dumps(data, sort_keys=True)
    except TypeError:
        return ""


def _primary_media_signature(item: Item) -> str:
    media = item.media.order_by("sort_order", "id").first()
    if not media or not media.media_file:
        return ""
    return (media.media_file.name or "").lower()


def _score_pair(lost_item: Item, found_item: Item) -> Decimal:
    title_score = SequenceMatcher(None, (lost_item.title or "").lower(), (found_item.title or "").lower()).ratio()
    description_score = SequenceMatcher(None, (lost_item.description or "").lower(), (found_item.description or "").lower()).ratio()
    feature_score = SequenceMatcher(None, _normalize_feature_blob(lost_item), _normalize_feature_blob(found_item)).ratio()
    media_score = SequenceMatcher(None, _primary_media_signature(lost_item), _primary_media_signature(found_item)).ratio()
    category_boost = 1.0 if lost_item.category.lower() == found_item.category.lower() else 0.9

    weighted = ((title_score * 0.25) + (description_score * 0.35) + (feature_score * 0.25) + (media_score * 0.15)) * category_boost
    return Decimal(str(round(weighted * 100, 2)))


def run_auto_match_for_item(source_item: Item, include_all_lost: bool = False):
    if source_item.status == "LOST" and source_item.verification_status != "verified":
        return []

    if source_item.status == "LOST":
        candidates = Item.objects.filter(status="FOUND", verification_status="verified").exclude(id=source_item.id)
        lost_item = source_item
        pairs = [(lost_item, c) for c in candidates]
    else:
        candidates = Item.objects.filter(status="LOST").exclude(id=source_item.id)
        if not include_all_lost:
            candidates = candidates.filter(verification_status="verified")
        found_item = source_item
        pairs = [(c, found_item) for c in candidates]

    created_matches = []

    for lost_item, found_item in pairs:
        similarity = _score_pair(lost_item, found_item)
        match, created = MatchResult.objects.get_or_create(
            lost_item=lost_item,
            found_item=found_item,
            defaults={
                "similarity_score": similarity,
                "is_auto_notified": similarity >= Decimal("95.00"),
            },
        )

        if not created:
            match.similarity_score = similarity
            previous_auto_notified = match.is_auto_notified
            should_notify = similarity >= Decimal("95.00")
            match.is_auto_notified = previous_auto_notified or should_notify
            match.save(update_fields=["similarity_score", "is_auto_notified"])
        else:
            should_notify = similarity >= Decimal("95.00")
            previous_auto_notified = False

        if should_notify and not previous_auto_notified:
            Notification.objects.create(
                user=lost_item.reporter,
                type="ai_match_detected",
                title="High-confidence AI match detected",
                body=f"{found_item.title} appears to match your lost item at {similarity}% similarity.",
                payload={
                    "lostItemId": lost_item.id,
                    "foundItemId": found_item.id,
                    "similarity": float(similarity),
                },
            )

        created_matches.append(match)

    return created_matches
