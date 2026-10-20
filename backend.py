from pathlib import Path
import sqlite3
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

# ---------------- APP CONFIGURATION ----------------

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "fixnear.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"


# ---------------- DATABASE CONNECTION ----------------

def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    with get_db() as connection:
        schema = SCHEMA_PATH.read_text(encoding="utf-8")
        connection.executescript(schema)

        count = connection.execute(
            "SELECT COUNT(*) FROM shops"
        ).fetchone()[0]

        # Add sample providers only when the table is empty.
        if count == 0:
            sample_shops = [
                (
                    "Sri Lakshmi Electrical Works",
                    "Electrician",
                    "9876543210",
                    17.0005,
                    81.8040,
                    1,
                    4.5,
                    12
                ),
                (
                    "Raju Plumbing Services",
                    "Plumber",
                    "9876543211",
                    17.0050,
                    81.7900,
                    0,
                    4.2,
                    8
                ),
                (
                    "Smart Mobile Repair",
                    "Mobile Repair",
                    "9876543212",
                    16.9980,
                    81.7850,
                    1,
                    4.4,
                    15
                ),
                (
                    "Quick Home Cleaning",
                    "Cleaning",
                    "9876543213",
                    17.0100,
                    81.8000,
                    0,
                    4.0,
                    6
                )
            ]

            connection.executemany(
                """
                INSERT INTO shops
                (name, category, phone, lat, lng, active, rating, reviews)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                sample_shops
            )


# ---------------- HEALTH CHECK ----------------

@app.get("/api/health")
def health_check():
    return jsonify({
        "success": True,
        "message": "FixNear backend is running"
    })


# ---------------- GET SERVICE PROVIDERS ----------------

@app.get("/api/shops")
def get_shops():
    with get_db() as connection:
        rows = connection.execute(
            """
            SELECT
                s.id,
                s.name,
                s.category,
                s.phone,
                s.lat,
                s.lng,
                s.active,
                s.rating,
                s.reviews
            FROM shops s
            ORDER BY s.id
            """
        ).fetchall()

    shops = []

    for row in rows:
        shops.append({
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "phone": row["phone"],
            "lat": row["lat"],
            "lng": row["lng"],
            "active": bool(row["active"]),
            "rating": row["rating"],
            "reviews": row["reviews"]
        })

    return jsonify(shops)


# ---------------- CREATE CUSTOMER REQUEST ----------------

@app.post("/api/requests")
def create_request():
    data = request.get_json(silent=True) or {}

    customer = str(data.get("customer", "")).strip()
    service = str(data.get("service", "")).strip()
    details = str(data.get("details", "")).strip()
    address = str(data.get("address", "")).strip()

    allowed_services = {
        "Electrician",
        "Plumber",
        "Mobile Repair",
        "Cleaning"
    }

    if len(customer) < 2:
        return jsonify({
            "error": "Please enter a valid customer name."
        }), 400

    if service not in allowed_services:
        return jsonify({
            "error": "Please select a valid service category."
        }), 400

    if len(details) < 5:
        return jsonify({
            "error": "Please describe your service problem."
        }), 400

    if len(address) < 3:
        return jsonify({
            "error": "Please enter your location or address."
        }), 400

    created_at = datetime.now(timezone.utc).isoformat(
        timespec="seconds"
    )

    with get_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO service_requests
            (customer, service, details, address, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                customer,
                service,
                details,
                address,
                "Pending",
                created_at
            )
        )

        request_id = cursor.lastrowid

    return jsonify({
        "success": True,
        "id": request_id,
        "customer": customer,
        "service": service,
        "details": details,
        "address": address,
        "status": "Pending",
        "created_at": created_at
    }), 201


# ---------------- GET CUSTOMER REQUESTS ----------------

@app.get("/api/requests")
def get_requests():
    customer = request.args.get("customer", "").strip()

    if not customer:
        return jsonify({
            "error": "Customer name is required."
        }), 400

    with get_db() as connection:
        rows = connection.execute(
            """
            SELECT id, customer, service, details,
                   address, status, created_at
            FROM service_requests
            WHERE customer = ?
            ORDER BY id DESC
            """,
            (customer,)
        ).fetchall()

    results = []

    for row in rows:
        results.append({
            "id": row["id"],
            "customer": row["customer"],
            "service": row["service"],
            "details": row["details"],
            "address": row["address"],
            "status": row["status"],
            "created_at": row["created_at"]
        })

    return jsonify(results)


# ---------------- SAVE PROVIDER RATING ----------------

@app.post("/api/shops/<int:shop_id>/ratings")
def add_rating(shop_id):
    data = request.get_json(silent=True) or {}

    customer = str(data.get("customer", "")).strip()
    score = data.get("score")

    if len(customer) < 2:
        return jsonify({
            "error": "Customer name is required."
        }), 400

    if (
        not isinstance(score, int)
        or isinstance(score, bool)
        or score < 1
        or score > 5
    ):
        return jsonify({
            "error": "Rating must be a number from 1 to 5."
        }), 400

    with get_db() as connection:
        shop = connection.execute(
            "SELECT id FROM shops WHERE id = ?",
            (shop_id,)
        ).fetchone()

        if shop is None:
            return jsonify({
                "error": "Service provider not found."
            }), 404

        connection.execute(
            """
            INSERT INTO ratings (shop_id, customer, score)
            VALUES (?, ?, ?)
            """,
            (shop_id, customer, score)
        )

    return jsonify({
        "success": True,
        "message": "Rating saved successfully."
    }), 201


# ---------------- UPDATE WORKER ATTENDANCE ----------------

@app.post("/api/shops/<int:shop_id>/attendance")
def update_attendance(shop_id):
    data = request.get_json(silent=True) or {}
    active = data.get("active")

    if not isinstance(active, bool):
        return jsonify({
            "error": "active must be true or false."
        }), 400

    with get_db() as connection:
        cursor = connection.execute(
            """
            UPDATE shops
            SET active = ?
            WHERE id = ?
            """,
            (int(active), shop_id)
        )

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Service provider not found."
            }), 404

    return jsonify({
        "success": True,
        "shop_id": shop_id,
        "active": active,
        "message": "Attendance status updated."
    })


# ---------------- START SERVER ----------------

if __name__ == "__main__":
    initialize_database()

    print("FixNear backend is running.")
    print("Health check: http://127.0.0.1:5000/api/health")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )