from flask import Flask, request, jsonify, render_template
from database import get_connection

app = Flask(__name__, template_folder="templates", static_folder="static")

@app.route("/")
def index():
    return render_template("index.html")


# CREATE
@app.route("/api/opportunities", methods=["POST"])
def create_opportunity():

    data = request.get_json()

    required_fields = ["research_title", "research_description", "research_area", "faculty_name", "department", "required_skills", "available_positions", "application_deadline", "status"]

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data["status"] not in ["Open", "Closed"]:
        return jsonify({"error": "Status must be Open or Closed"}), 400

    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO opportunities
        (research_title, research_description, research_area,
        faculty_name, department, required_skills,
        available_positions, application_deadline, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (data["research_title"], data["research_description"], data["research_area"], data["faculty_name"], data["department"], data["required_skills"], data["available_positions"], data["application_deadline"], data["status"])

        cursor.execute(query, values)
        connection.commit()

        opportunity_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Research opportunity created successfully",
            "id": opportunity_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# READ ALL
@app.route("/api/opportunities", methods=["GET"])
def get_opportunities():

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM opportunities")

        opportunities = cursor.fetchall()

        for opp in opportunities:
            if opp.get("application_deadline") is not None:
                opp["application_deadline"] = str(opp["application_deadline"])

        cursor.close()
        connection.close()

        return jsonify(opportunities), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# READ ONE
@app.route("/api/opportunities/<int:id>", methods=["GET"])
def get_opportunity(id):

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM opportunities WHERE id = %s",
            (id,)
        )

        opportunity = cursor.fetchone()

        if opportunity and opportunity.get("application_deadline") is not None:
            opportunity["application_deadline"] = str(opportunity["application_deadline"])

        cursor.close()
        connection.close()

        if opportunity is None:
            return jsonify({
                "error": "Research opportunity not found"
            }), 404

        return jsonify(opportunity), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE
@app.route("/api/opportunities/<int:id>", methods=["PUT"])
def update_opportunity(id):

    data = request.get_json()

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM opportunities WHERE id = %s",
            (id,)
        )

        opportunity = cursor.fetchone()

        if opportunity is None:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Research opportunity not found"
            }), 404

        if "status" in data:
            if data["status"] not in ["Open", "Closed"]:
                cursor.close()
                connection.close()

                return jsonify({
                    "error": "Status must be Open or Closed"
                }), 400

        fields = ["research_title", "research_description", "research_area", "faculty_name", "department", "required_skills", "available_positions", "application_deadline", "status"]

        update_fields = []
        values = []

        for field in fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])

        if len(update_fields) == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "No fields provided for update"
            }), 400

        values.append(id)

        query = f"""
        UPDATE opportunities
        SET {", ".join(update_fields)}
        WHERE id = %s
        """

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Research opportunity updated successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE
@app.route("/api/opportunities/<int:id>", methods=["DELETE"])
def delete_opportunity(id):

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM opportunities WHERE id = %s",
            (id,)
        )

        opportunity = cursor.fetchone()

        if opportunity is None:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Research opportunity not found"
            }), 404

        cursor.execute(
            "DELETE FROM opportunities WHERE id = %s",
            (id,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Research opportunity deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)