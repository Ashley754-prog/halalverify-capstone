import hashlib
import json
import urllib.parse
import urllib.request
from typing import Optional, Tuple

# Central reference coordinate for Zamboanga City Center
DEFAULT_ZAMBOANGA_LAT = 6.9075
DEFAULT_ZAMBOANGA_LNG = 122.0770

# Recognized barangays, streets, and zones across Zamboanga City
ZAMBOANGA_BARANGAY_COORDINATES = {
    "zone i": (6.9075, 122.0760),
    "zone ii": (6.9100, 122.0730),
    "zone iii": (6.9142, 122.0745),
    "governor alvarez": (6.9142, 122.0745),
    "gov. alvarez": (6.9142, 122.0745),
    "gov alvarez": (6.9142, 122.0745),
    "zone iv": (6.9040, 122.0780),
    "pilar": (6.9040, 122.0780),
    "pettit": (6.9040, 122.0780),
    "canelar": (6.9165, 122.0685),
    "santa maria": (6.9320, 122.0710),
    "sta. maria": (6.9320, 122.0710),
    "sta maria": (6.9320, 122.0710),
    "gov. ramos": (6.9320, 122.0710),
    "gov ramos": (6.9320, 122.0710),
    "galvez": (6.9320, 122.0710),
    "tetuan": (6.9230, 122.0880),
    "pasonanca": (6.9520, 122.0720),
    "baliwasan": (6.9180, 122.0580),
    "san roque": (6.9380, 122.0850),
    "guiwan": (6.9280, 122.0980),
    "tumaga": (6.9390, 122.0670),
    "santa catalina": (6.9120, 122.0870),
    "sta. catalina": (6.9120, 122.0870),
    "sta catalina": (6.9120, 122.0870),
    "ayala": (6.9600, 121.9600),
    "putik": (6.9400, 122.1100),
    "talon-talon": (6.9020, 122.1050),
    "talon talon": (6.9020, 122.1050),
    "suterville": (6.9150, 122.0490),
    "calarian": (6.9250, 122.0280),
    "divisoria": (6.9530, 122.1380),
    "cabatangan": (6.9380, 122.0550),
    "san jose": (6.9210, 122.0490),
    "sinunuc": (6.9290, 122.0080),
    "recodo": (6.9450, 121.9850),
    "culianan": (6.9610, 122.1580),
    "boalan": (6.9550, 122.1180),
    "mercedes": (6.9680, 122.1390),
    "mampang": (6.9150, 122.1250),
    "veterans": (6.9120, 122.0760),
    "mayor jaldon": (6.9110, 122.0735),
    "jaldon": (6.9110, 122.0735),
    "nuñez": (6.9130, 122.0700),
    "nunez": (6.9130, 122.0700),
    "la purisima": (6.9080, 122.0770),
    "pueblo": (6.9075, 122.0770),
    "kcc": (6.9180, 122.0820),
    "sm mindpro": (6.9090, 122.0740),
}


def _calculate_dispersion(seed_text: str) -> Tuple[float, float]:
    """
    Generate a tiny deterministic jitter (10 to 30 meters) using MD5 hash
    so multiple establishments located on the same street or barangay
    do not overlap into the exact same pixel on the interactive map.
    """
    digest = hashlib.md5(seed_text.strip().lower().encode("utf-8")).hexdigest()
    lat_offset = ((int(digest[:4], 16) % 600) - 300) / 1000000.0
    lng_offset = ((int(digest[4:8], 16) % 600) - 300) / 1000000.0
    return lat_offset, lng_offset


def geocode_zamboanga_address(address: str, city: Optional[str] = "Zamboanga City") -> Tuple[float, float]:
    """
    Resolve GPS latitude and longitude coordinates for an address in Zamboanga City.
    First attempts OpenStreetMap Nominatim with a brief timeout.
    Falls back to a curated Zamboanga City barangay lookup dictionary.
    """
    addr_clean = (address or "").strip()
    city_clean = (city or "Zamboanga City").strip()

    # 1. Attempt Nominatim Geocoding with a 1.5 second timeout
    if addr_clean:
        try:
            query = f"{addr_clean}, {city_clean}, Philippines"
            encoded_query = urllib.parse.quote(query)
            url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "HalalVerify-Capstone/1.0 (contact@halalverify.app)"}
            )
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if data and len(data) > 0:
                        lat = float(data[0]["lat"])
                        lon = float(data[0]["lon"])
                        # Verify the result falls within the greater Zamboanga peninsula region
                        if 6.80 <= lat <= 7.45 and 121.80 <= lon <= 122.45:
                            return round(lat, 6), round(lon, 6)
        except Exception:
            # Silently proceed to deterministic local dictionary fallback
            pass

    # 2. Local Zamboanga Barangay & Zone Dictionary
    addr_lower = addr_clean.lower()
    base_lat = DEFAULT_ZAMBOANGA_LAT
    base_lng = DEFAULT_ZAMBOANGA_LNG

    for key, (k_lat, k_lng) in ZAMBOANGA_BARANGAY_COORDINATES.items():
        if key in addr_lower:
            base_lat = k_lat
            base_lng = k_lng
            break

    # Apply deterministic dispersion
    d_lat, d_lng = _calculate_dispersion(addr_clean or "Zamboanga")
    final_lat = round(base_lat + d_lat, 6)
    final_lng = round(base_lng + d_lng, 6)
    return final_lat, final_lng
